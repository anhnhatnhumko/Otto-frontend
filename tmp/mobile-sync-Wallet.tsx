import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api, { WalletSummary, WalletTransaction } from "../../api/customer";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { OTTO_THEME } from "../../constants/otto-theme";
import Icon from "../../utils/icons";

type WalletFilter = "ALL" | "IN" | "OUT";

const FILTERS: { key: WalletFilter; label: string }[] = [
  { key: "ALL", label: "Tất cả" },
  { key: "IN", label: "Tiền vào" },
  { key: "OUT", label: "Tiền ra" },
];

function isIncoming(type?: string) {
  return ["DEPOSIT", "REFUND", "RECEIVE"].includes(
    String(type || "").toUpperCase(),
  );
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const WALLET_SYNC_HINT_KEY = "wallet:syncHint";

type WalletSyncHint = {
  createdAt?: number;
  historyDelayMs?: number;
  suppressHistoryError?: boolean;
};

function getWalletHistoryErrorMessage(rawMessage?: string) {
  const normalizedMessage = String(rawMessage || "").trim().toLowerCase();

  if (normalizedMessage.includes("unauthorized")) {
    return "Otto chưa kịp đồng bộ lại lịch sử ví sau khi quay về từ Stripe. Vui lòng chờ giây lát hoặc kéo xuống để tải lại.";
  }

  return "Hiện chưa tải được lịch sử ví. Vui lòng thử lại sau ít giây hoặc kéo xuống để làm mới.";
}

async function consumeWalletSyncHint() {
  try {
    const raw = await AsyncStorage.getItem(WALLET_SYNC_HINT_KEY);
    if (!raw) {
      return null;
    }

    await AsyncStorage.removeItem(WALLET_SYNC_HINT_KEY);
    const parsed = JSON.parse(raw) as WalletSyncHint;

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    const createdAt = Number(parsed.createdAt || 0);
    if (createdAt > 0 && Date.now() - createdAt > 30000) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.warn("Failed to consume wallet sync hint", error);
    return null;
  }
}

function getTransactionTitle(tx: WalletTransaction) {
  switch (String(tx.type || "").toUpperCase()) {
    case "DEPOSIT":
      return "Nạp tiền vào ví";
    case "PAYMENT":
      return "Thanh toán đơn hàng";
    case "REFUND":
      return "Hoàn tiền đơn hàng";
    case "WITHDRAW":
      return "Rút tiền khỏi ví";
    case "RECEIVE":
      return "Nhận tiền giao dịch";
    default:
      return "Giao dịch ví Otto";
  }
}

function getOrderCode(orderId: any) {
  if (!orderId) return "";
  if (typeof orderId === "string") return orderId.slice(-6).toUpperCase();
  const raw = orderId?.code || orderId?._id || orderId?.id;
  return raw ? String(raw).slice(-6).toUpperCase() : "";
}

function getTransactionSubtitle(tx: WalletTransaction) {
  const orderCode = getOrderCode(tx.orderId);
  const bankLabel = tx.bankName
    ? `${tx.bankName}${tx.accountNumber ? ` ••••${tx.accountNumber.slice(-4)}` : ""}`
    : "";

  switch (String(tx.type || "").toUpperCase()) {
    case "PAYMENT":
    case "REFUND":
      return orderCode
        ? `Đơn hàng #${orderCode}`
        : "Đơn hàng của bạn đã bị hủy và hoàn tiền đã được trả thành côngvào ví";
    case "WITHDRAW":
      return bankLabel || "Giao dịch rút tiền về tài khoản";
    case "DEPOSIT":
      return "Giao dịch nạp tiền vào ví Otto";
    case "RECEIVE":
      return tx.paymentMethod
        ? `Nguồn tiền: ${tx.paymentMethod}`
        : "Cập nhật số dư vào ví";
    default:
      return "Theo dõi biến động số dư của bạn";
  }
}

function getStatusStyles(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "SUCCESS":
      return {
        label: "Thành công",
        backgroundColor: OTTO_THEME.successLight,
        color: OTTO_THEME.success,
      };
    case "FAILED":
      return {
        label: "Thất bại",
        backgroundColor: "#FEE2E2",
        color: OTTO_THEME.danger,
      };
    default:
      return {
        label: "Đang xử lý",
        backgroundColor: "#FEF3C7",
        color: "#B45309",
      };
  }
}

function getTransactionIcon(type?: string) {
  switch (String(type || "").toUpperCase()) {
    case "PAYMENT":
    case "WITHDRAW":
      return {
        family: "Feather" as const,
        name: "arrow-up-right",
        backgroundColor: "#FEE2E2",
        color: OTTO_THEME.danger,
      };
    case "REFUND":
      return {
        family: "Feather" as const,
        name: "rotate-ccw",
        backgroundColor: "#DBEAFE",
        color: OTTO_THEME.primaryDark,
      };
    case "DEPOSIT":
      return {
        family: "Feather" as const,
        name: "plus-circle",
        backgroundColor: "#DCFCE7",
        color: OTTO_THEME.success,
      };
    default:
      return {
        family: "Feather" as const,
        name: "arrow-down-left",
        backgroundColor: "#DCFCE7",
        color: OTTO_THEME.success,
      };
  }
}

function formatDateTime(dateLike?: string) {
  if (!dateLike) return "Vừa xong";
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) return "Vừa xong";

  const datePart = date.toLocaleDateString("vi-VN");
  const timePart = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${datePart} • ${timePart}`;
}

export default function Wallet({ navigation, route }: any) {
  const [wallet, setWallet] = useState<WalletSummary>({
    balance: 0,
    pendingBalance: 0,
  });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [activeFilter, setActiveFilter] = useState<WalletFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWallet = useCallback(
    async (silent = false, syncHint?: WalletSyncHint | null) => {
      const suppressHistoryError = Boolean(syncHint?.suppressHistoryError);
      const initialHistoryDelayMs = Math.max(
        0,
        Number(syncHint?.historyDelayMs || 0),
      );

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const loadTransactionsWithRetry = async () => {
          let lastError: any;
          const retryDelays = suppressHistoryError
            ? [initialHistoryDelayMs, 700, 1400]
            : [initialHistoryDelayMs, 450, 900];

          for (const delayMs of retryDelays) {
            if (delayMs > 0) {
              await wait(delayMs);
            }

            try {
              return await api.getWalletTransactions();
            } catch (error: any) {
              lastError = error;
              const message = String(error?.message || "").toLowerCase();
              const shouldRetry =
                message.includes("unauthorized") || message.includes("network");

              if (!shouldRetry) {
                break;
              }
            }
          }

          throw lastError;
        };

        const [walletResult, txResult] = await Promise.allSettled([
          api.getWallet(),
          loadTransactionsWithRetry(),
        ]);

        if (walletResult.status === "fulfilled") {
          setWallet(walletResult.value);
        }

        if (txResult.status === "fulfilled") {
          setTransactions(Array.isArray(txResult.value) ? txResult.value : []);
          setError("");
        } else {
          setError(
            suppressHistoryError
              ? ""
              : getWalletHistoryErrorMessage(txResult.reason?.message),
          );
        }
      } catch (err: any) {
        setError(
          suppressHistoryError
            ? ""
            : getWalletHistoryErrorMessage(err?.message),
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      let followUpTimer = null as ReturnType<typeof setTimeout> | null;

      (async () => {
        const syncHint = await consumeWalletSyncHint();
        if (!active) {
          return;
        }

        await loadWallet(true, syncHint);

        if (syncHint?.suppressHistoryError) {
          followUpTimer = setTimeout(() => {
            if (active) {
              void loadWallet(true);
            }
          }, Math.max(1800, Number(syncHint.historyDelayMs || 0) + 1200));
        }
      })();

      return () => {
        active = false;
        if (followUpTimer) {
          clearTimeout(followUpTimer);
        }
      };
    }, [loadWallet, route?.params]),
  );

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "ALL") return transactions;
    return transactions.filter((tx) =>
      activeFilter === "IN" ? isIncoming(tx.type) : !isIncoming(tx.type),
    );
  }, [activeFilter, transactions]);

  const incomingTotal = useMemo(() => {
    return transactions
      .filter((tx) => isIncoming(tx.type))
      .reduce((sum, tx) => sum + Math.abs(Number(tx.amount || 0)), 0);
  }, [transactions]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: OTTO_THEME.background,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" color={OTTO_THEME.primary} />
        <Text style={{ marginTop: 10, color: OTTO_THEME.mutedText }}>
          Đang tải ví Otto...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
      <Header title="Ví Otto" />

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void loadWallet(true)}
            tintColor={OTTO_THEME.primary}
          />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      >
        <LinearGradient
          colors={["#2563EB", "#3C8CDD"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            borderRadius: 24,
            padding: 20,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>
                Số dư khả dụng
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 30,
                  fontWeight: "800",
                }}
              >
                {api.formatMoney(wallet.balance || 0)}
              </Text>
            </View>

            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.18)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon
                family="Feather"
                name="credit-card"
                size={22}
                color="#FFFFFF"
              />
            </View>
          </View>

          <Text style={{ color: "rgba(255,255,255,0.82)", lineHeight: 20 }}>
            Dùng ví để thanh toán nhanh bằng OTP và nhận hoàn tiền tự động nếu
            đơn bị hủy đúng điều kiện.
          </Text>

          <View
            style={{
              flexDirection: "row",
              marginTop: 16,
            }}
          >
            <View
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.14)",
                padding: 12,
                marginRight: 8,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }}>
                Đang chờ xử lý
              </Text>
              <Text style={{ color: "#fff", fontWeight: "700", marginTop: 4 }}>
                {api.formatMoney(wallet.pendingBalance || 0)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                borderRadius: 16,
                backgroundColor: "rgba(255,255,255,0.14)",
                padding: 12,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 12 }}>
                Tổng đã vào ví
              </Text>
              <Text style={{ color: "#fff", fontWeight: "700", marginTop: 4 }}>
                {api.formatMoney(incomingTotal)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <TouchableOpacity
          onPress={() => navigation.navigate("WalletDeposit")}
          style={{
            backgroundColor: OTTO_THEME.primaryDark,
            borderRadius: 20,
            padding: 16,
            marginBottom: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={{ color: "#FFFFFF", fontSize: 17, fontWeight: "800" }}>
              Nạp tiền vào ví
            </Text>
            <Text
              style={{
                color: "rgba(255,255,255,0.82)",
                marginTop: 6,
                lineHeight: 20,
              }}
            >
              Mở Stripe để bổ sung số dư và quay lại ứng dụng kiểm tra trạng thái nạp tiền.
            </Text>
          </View>

          <View
            style={{
              width: 46,
              height: 46,
              borderRadius: 15,
              backgroundColor: "rgba(255,255,255,0.18)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon family="Feather" name="plus-circle" size={20} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        <View style={{ flexDirection: "row", marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateOrder")}
            style={{
              flex: 1,
              backgroundColor: OTTO_THEME.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: OTTO_THEME.border,
              padding: 14,
              marginRight: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: OTTO_THEME.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Icon
                family="Feather"
                name="plus-circle"
                size={18}
                color={OTTO_THEME.primaryDark}
              />
            </View>
              <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>
                Đặt dịch vụ
              </Text>
              <Text style={{ color: OTTO_THEME.mutedText, marginTop: 4 }}>
                Dùng ví Otto ngay ở bước thanh toán.
              </Text>
            </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Orders")}
            style={{
              flex: 1,
              backgroundColor: OTTO_THEME.surface,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: OTTO_THEME.border,
              padding: 14,
              marginLeft: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                backgroundColor: "#ECFDF5",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Icon
                family="Feather"
                name="clock"
                size={18}
                color={OTTO_THEME.success}
              />
            </View>
            <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>
              Lịch sử đơn
            </Text>
            <Text style={{ color: OTTO_THEME.mutedText, marginTop: 4 }}>
              Theo dõi thanh toán và hoàn tiền.
            </Text>
          </TouchableOpacity>
        </View>

        {/* <View
          style={{
            backgroundColor: "#EFF6FF",
            borderRadius: 18,
            borderWidth: 1,
            borderColor: "#BFDBFE",
            padding: 14,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: OTTO_THEME.primaryDark,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Ví Otto đang hỗ trợ gì?
          </Text>
          <Text style={{ color: OTTO_THEME.mutedText, lineHeight: 20 }}>
            Bạn có thể thanh toán đơn bằng ví, nhận OTP xác minh, và theo dõi
            hoàn tiền ngay tại đây. Khi backend cập nhật trạng thái hủy/refund,
            lịch sử giao dịch cũng sẽ phản ánh lại trong danh sách bên dưới.
          </Text>
        </View> */}

        <View style={{ flexDirection: "row", marginBottom: 12 }}>
          {FILTERS.map((item) => {
            const active = activeFilter === item.key;

            return (
              <TouchableOpacity
                key={item.key}
                onPress={() => setActiveFilter(item.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 14,
                  backgroundColor: active
                    ? OTTO_THEME.primary
                    : OTTO_THEME.surface,
                  borderWidth: 1,
                  borderColor: active
                    ? OTTO_THEME.primary
                    : OTTO_THEME.border,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    color: active ? "#fff" : OTTO_THEME.text,
                    fontWeight: "700",
                  }}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View
          style={{
            backgroundColor: OTTO_THEME.surface,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: OTTO_THEME.border,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 17, fontWeight: "700", color: OTTO_THEME.text }}>
              Giao dịch gần đây
            </Text>
            {/* <Text style={{ color: OTTO_THEME.mutedText }}>
              Chi ra {api.formatMoney(outgoingTotal)}
            </Text> */}
          </View>

          {error ? (
            <View
              style={{
                borderRadius: 16,
                backgroundColor: "#FEF2F2",
                borderWidth: 1,
                borderColor: "#FECACA",
                padding: 14,
              }}
            >
              <Text style={{ color: OTTO_THEME.danger, fontWeight: "700" }}>
                Không tải được lịch sử ví
              </Text>
              <Text
                style={{
                  color: OTTO_THEME.mutedText,
                  lineHeight: 20,
                  marginTop: 6,
                }}
              >
                {error}
              </Text>
            </View>
          ) : filteredTransactions.length ? (
            filteredTransactions.map((tx) => {
              const incoming = isIncoming(tx.type);
              const icon = getTransactionIcon(tx.type);
              const status = getStatusStyles(tx.status);

              return (
                <View
                  key={tx._id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    paddingVertical: 14,
                    borderTopWidth: 1,
                    borderTopColor: OTTO_THEME.border,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      backgroundColor: icon.backgroundColor,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <Icon
                      family={icon.family}
                      name={icon.name}
                      size={18}
                      color={icon.color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        color: OTTO_THEME.text,
                        fontWeight: "700",
                        marginBottom: 4,
                      }}
                    >
                      {getTransactionTitle(tx)}
                    </Text>
                    <Text
                      style={{
                        color: OTTO_THEME.mutedText,
                        lineHeight: 18,
                        marginBottom: 6,
                      }}
                    >
                      {getTransactionSubtitle(tx)}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Text
                        style={{
                          color: OTTO_THEME.mutedText,
                          fontSize: 12,
                          marginRight: 8,
                        }}
                      >
                        {formatDateTime(tx.createdAt)}
                      </Text>
                      <View
                        style={{
                          paddingHorizontal: 10,
                          paddingVertical: 4,
                          borderRadius: 999,
                          backgroundColor: status.backgroundColor,
                        }}
                      >
                        <Text
                          style={{
                            color: status.color,
                            fontSize: 12,
                            fontWeight: "700",
                          }}
                        >
                          {status.label}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Text
                    style={{
                      color: incoming ? OTTO_THEME.success : OTTO_THEME.danger,
                      fontWeight: "800",
                      marginLeft: 10,
                    }}
                  >
                    {incoming ? "+" : "-"}
                    {api.formatMoney(Math.abs(Number(tx.amount || 0)))}
                  </Text>
                </View>
              );
            })
          ) : (
            <View
              style={{
                borderRadius: 16,
                backgroundColor: OTTO_THEME.background,
                padding: 18,
                alignItems: "center",
              }}
            >
              <Icon
                family="Feather"
                name="inbox"
                size={22}
                color={OTTO_THEME.mutedText}
              />
              <Text
                style={{
                  color: OTTO_THEME.text,
                  fontWeight: "700",
                  marginTop: 10,
                }}
              >
                Chưa có giao dịch phù hợp
              </Text>
              <Text
                style={{
                  color: OTTO_THEME.mutedText,
                  textAlign: "center",
                  marginTop: 6,
                  lineHeight: 20,
                }}
              >
                Hãy tạo đơn mới hoặc dùng ví thanh toán để lịch sử bắt đầu xuất
                hiện tại đây.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
