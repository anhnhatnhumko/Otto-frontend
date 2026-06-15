import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as ExpoLinking from "expo-linking";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import api, { WalletSummary, WalletTransaction } from "../../api/customer";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { OTTO_THEME } from "../../constants/otto-theme";
import Icon from "../../utils/icons";

const PRESET_AMOUNTS = [100000, 200000, 500000, 1000000, 2000000, 5000000];
const WALLET_SYNC_HINT_KEY = "wallet:syncHint";

type DepositState = "IDLE" | "PENDING" | "SUCCESS" | "FAILED";

function normalizeAmount(value: string) {
  return value.replace(/[^\d]/g, "");
}

function getDepositStatusMeta(status: DepositState) {
  switch (status) {
    case "SUCCESS":
      return {
        title: "Nạp tiền thành công",
        description:
          "Stripe đã xác nhận giao dịch. Số dư ví của bạn đã được cập nhật giống như trên web.",
        tone: OTTO_THEME.success,
        backgroundColor: OTTO_THEME.successLight,
        borderColor: "#A7F3D0",
        iconFamily: "Feather" as const,
        iconName: "check-circle",
      };
    case "FAILED":
      return {
        title: "Giao dịch chưa hoàn tất",
        description:
          "Bạn có thể mở lại cổng thanh toán Stripe hoặc tạo giao dịch nạp mới khi cần.",
        tone: OTTO_THEME.danger,
        backgroundColor: "#FEF2F2",
        borderColor: "#FECACA",
        iconFamily: "Feather" as const,
        iconName: "x-circle",
      };
    default:
      return {
        title: "Đang chờ Stripe xác nhận",
        description:
          "Sau khi hoàn tất trên trình duyệt, quay lại ứng dụng và bấm kiểm tra trạng thái để cập nhật ví ngay.",
        tone: OTTO_THEME.primaryDark,
        backgroundColor: "#EFF6FF",
        borderColor: "#BFDBFE",
        iconFamily: "Feather" as const,
        iconName: "clock",
      };
  }
}

function getTransactionStatus(transactions: WalletTransaction[], transactionId: string) {
  return transactions.find(
    (item) => String(item._id || "").trim() === String(transactionId || "").trim(),
  );
}

function getQueryParamValue(
  queryParams: Record<string, string | string[] | undefined> | undefined,
  key: string,
) {
  const value = queryParams?.[key];

  if (Array.isArray(value)) {
    return String(value[0] || "");
  }

  return String(value || "");
}

async function persistWalletSyncHint(delayMs = 1400) {
  try {
    await AsyncStorage.setItem(
      WALLET_SYNC_HINT_KEY,
      JSON.stringify({
        createdAt: Date.now(),
        historyDelayMs: delayMs,
        suppressHistoryError: true,
      }),
    );
  } catch (error) {
    console.warn("Failed to persist wallet sync hint", error);
  }
}

export default function WalletDeposit({ route, navigation }: any) {
  const initialAmount = Number(route?.params?.initialAmount || 0);
  const [wallet, setWallet] = useState<WalletSummary>({
    balance: 0,
    pendingBalance: 0,
  });
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    PRESET_AMOUNTS.includes(initialAmount) ? initialAmount : 100000,
  );
  const [customAmount, setCustomAmount] = useState(
    initialAmount > 0 && !PRESET_AMOUNTS.includes(initialAmount)
      ? String(initialAmount)
      : "",
  );
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [depositState, setDepositState] = useState<DepositState>("IDLE");
  const [depositSession, setDepositSession] = useState<{
    transactionId: string;
    checkoutUrl: string;
    amount: number;
    stripeSessionId?: string;
  } | null>(null);
  const [statusNote, setStatusNote] = useState("");
  const confirmedStripeSessionsRef = useRef<Set<string>>(new Set());

  const finalAmount = useMemo(() => {
    if (customAmount) {
      return Number.parseInt(customAmount, 10) || 0;
    }

    return selectedAmount || 0;
  }, [customAmount, selectedAmount]);

  const canSubmit = finalAmount >= 10000 && !submitting;
  const statusMeta = getDepositStatusMeta(depositState === "IDLE" ? "PENDING" : depositState);
  const returnUrl = useMemo(() => ExpoLinking.createURL(""), []);

  const loadWallet = useCallback(async () => {
    try {
      setLoadingWallet(true);
      const walletData = await api.getWallet();
      setWallet(walletData);
    } catch (error: any) {
      Alert.alert(
        "Không tải được ví",
        error?.message || "Vui lòng thử lại sau vài phút.",
      );
    } finally {
      setLoadingWallet(false);
    }
  }, []);

  const confirmStripeSession = useCallback(
    async (targetSessionId?: string) => {
      const sessionId = String(
        targetSessionId || depositSession?.stripeSessionId || "",
      ).trim();

      if (!sessionId || confirmedStripeSessionsRef.current.has(sessionId)) {
        return;
      }

      await api.confirmStripeSession(sessionId);
      confirmedStripeSessionsRef.current.add(sessionId);
    },
    [depositSession?.stripeSessionId],
  );

  const checkDepositStatus = useCallback(
    async (targetTransactionId?: string, targetStripeSessionId?: string) => {
      const transactionId = String(
        targetTransactionId || depositSession?.transactionId || "",
      ).trim();

      if (!transactionId) {
        return;
      }

      try {
        setChecking(true);
        try {
          await confirmStripeSession(targetStripeSessionId);
        } catch (error) {
          console.warn("Stripe session confirm is pending:", error);
        }

        const [transactions, walletData] = await Promise.all([
          api.getWalletTransactions(),
          api.getWallet(),
        ]);

        setWallet(walletData);
        const matchedTransaction = getTransactionStatus(transactions, transactionId);
        const normalizedStatus = String(matchedTransaction?.status || "PENDING").toUpperCase();

        if (normalizedStatus === "SUCCESS") {
          await persistWalletSyncHint();
          setDepositState("SUCCESS");
          setStatusNote(
            `Ví Otto đã cộng ${api.formatMoney(
              Math.abs(Number(matchedTransaction?.amount || depositSession?.amount || 0)),
            )} vào số dư khả dụng của bạn.`,
          );
          return;
        }

        if (normalizedStatus === "FAILED") {
          setDepositState("FAILED");
          setStatusNote(
            "Stripe chưa xác nhận được giao dịch này. Bạn có thể mở lại cổng thanh toán hoặc tạo giao dịch mới.",
          );
          return;
        }

        setDepositState("PENDING");
        setStatusNote(
          "Giao dịch vẫn đang chờ Stripe xử lý. Nếu bạn đã thanh toán xong, hãy đợi vài giây rồi kiểm tra lại.",
        );
      } catch (error: any) {
        Alert.alert(
          "Không kiểm tra được giao dịch",
          error?.message || "Vui lòng thử lại sau.",
        );
      } finally {
        setChecking(false);
      }
    },
    [
      confirmStripeSession,
      depositSession?.amount,
      depositSession?.transactionId,
    ],
  );

  const openStripeCheckout = useCallback(
    async (checkoutUrl: string, transactionId: string) => {
      try {
        const result = await WebBrowser.openAuthSessionAsync(
          checkoutUrl,
          returnUrl,
        );

        if (result.type === "success" && result.url) {
          const parsed = ExpoLinking.parse(result.url);
          const paymentStatus = getQueryParamValue(
            parsed.queryParams as Record<string, string | string[] | undefined>,
            "paymentStatus",
          ).toLowerCase();
          const callbackTransactionId = getQueryParamValue(
            parsed.queryParams as Record<string, string | string[] | undefined>,
            "transactionId",
          );
          const callbackSessionId = getQueryParamValue(
            parsed.queryParams as Record<string, string | string[] | undefined>,
            "session_id",
          );

          if (paymentStatus === "success") {
            setDepositState("PENDING");
            setStatusNote(
              "Ứng dụng đã nhận callback thành công từ Stripe. Otto đang đồng bộ giao dịch nạp tiền của bạn.",
            );
            setDepositSession((current) =>
              current
                ? {
                    ...current,
                    stripeSessionId: callbackSessionId || current.stripeSessionId,
                  }
                : current,
            );
            await checkDepositStatus(
              callbackTransactionId || transactionId,
              callbackSessionId,
            );
            return;
          }

          if (paymentStatus === "cancel") {
            setDepositState("FAILED");
            setStatusNote(
              "Bạn đã hủy thanh toán trên Stripe trước khi giao dịch hoàn tất.",
            );
            return;
          }
        }

        setDepositState("PENDING");
        setStatusNote(
          "Phiên thanh toán đã đóng trước khi ứng dụng nhận callback. Nếu bạn đã thanh toán xong, hãy bấm kiểm tra trạng thái.",
        );
        await checkDepositStatus(transactionId);
      } catch {
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (!supported) {
          throw new Error("Không thể mở cổng thanh toán Stripe trên thiết bị này.");
        }

        await WebBrowser.openBrowserAsync(checkoutUrl, {
          showTitle: true,
          controlsColor: OTTO_THEME.primaryDark,
        });
        setDepositState("PENDING");
        setStatusNote(
          "Thiết bị đang dùng chế độ mở Stripe qua trình duyệt thường. Sau khi thanh toán, hãy quay lại app và bấm kiểm tra trạng thái.",
        );
      }
    },
    [checkDepositStatus, returnUrl],
  );

  const handleCreateDeposit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }

    try {
      setSubmitting(true);
      const session = await api.createWalletDeposit(finalAmount, {
        successUrl: returnUrl,
        cancelUrl: returnUrl,
      });
      const nextSession = {
        transactionId: String(session.transactionId || ""),
        checkoutUrl: String(session.checkoutUrl || ""),
        amount: finalAmount,
        stripeSessionId: String(session.sessionId || ""),
      };

      if (!nextSession.transactionId || !nextSession.checkoutUrl) {
        throw new Error("Không lấy được giao dịch nạp tiền từ hệ thống.");
      }

      setDepositSession(nextSession);
      setDepositState("PENDING");
      setStatusNote(
        "Stripe đã tạo giao dịch nạp tiền. Hoàn tất thanh toán trên trình duyệt rồi quay lại ứng dụng để kiểm tra.",
      );

      await openStripeCheckout(nextSession.checkoutUrl, nextSession.transactionId);
    } catch (error: any) {
      Alert.alert(
        "Không thể tạo giao dịch nạp tiền",
        error?.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  }, [canSubmit, finalAmount, openStripeCheckout, returnUrl]);

  const handleResetDeposit = useCallback(() => {
    setDepositSession(null);
    setDepositState("IDLE");
    setStatusNote("");
    confirmedStripeSessionsRef.current.clear();
  }, []);

  useEffect(() => {
    if (!depositSession || depositState !== "PENDING") {
      return;
    }

    const timer = setInterval(() => {
      void checkDepositStatus(depositSession.transactionId);
    }, 5000);

    return () => clearInterval(timer);
  }, [checkDepositStatus, depositSession, depositState]);

  useFocusEffect(
    useCallback(() => {
      void loadWallet();

      if (depositSession?.transactionId) {
        void checkDepositStatus(depositSession.transactionId);
      }
    }, [checkDepositStatus, depositSession?.transactionId, loadWallet]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
      <Header title="Nạp tiền vào ví" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 28 }}
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
          <Text style={{ color: "rgba(255,255,255,0.82)", marginBottom: 6 }}>
            Số dư hiện tại
          </Text>
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 30,
              fontWeight: "800",
              marginBottom: 14,
            }}
          >
            {loadingWallet ? "Đang tải..." : api.formatMoney(wallet.balance || 0)}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.82)", lineHeight: 20 }}>
            Nạp tiền bằng Stripe để thanh toán đơn hàng nhanh hơn, giống như luồng web hiện tại.
          </Text>
        </LinearGradient>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: OTTO_THEME.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: OTTO_THEME.text,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 6,
            }}
          >
            Chọn số tiền muốn nạp
          </Text>
          <Text style={{ color: OTTO_THEME.mutedText, lineHeight: 20, marginBottom: 14 }}>
            Số tiền tối thiểu là 10.000đ. Bạn có thể chọn nhanh hoặc nhập số tiền tùy chỉnh.
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", marginHorizontal: -6 }}>
            {PRESET_AMOUNTS.map((amount) => {
              const active = !customAmount && selectedAmount === amount;

              return (
                <TouchableOpacity
                  key={amount}
                  onPress={() => {
                    setSelectedAmount(amount);
                    setCustomAmount("");
                  }}
                  style={{
                    width: "50%",
                    paddingHorizontal: 6,
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      borderRadius: 18,
                      borderWidth: 1,
                      borderColor: active ? OTTO_THEME.primary : OTTO_THEME.border,
                      backgroundColor: active ? OTTO_THEME.primarySoft : "#FFFFFF",
                      paddingVertical: 14,
                      paddingHorizontal: 12,
                    }}
                  >
                    <Text
                      style={{
                        color: active ? OTTO_THEME.primaryDark : OTTO_THEME.text,
                        fontWeight: "700",
                        textAlign: "center",
                      }}
                    >
                      {api.formatMoney(amount)}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={{ color: OTTO_THEME.text, fontWeight: "700", marginBottom: 8 }}>
            Hoặc nhập số tiền khác
          </Text>
          <TextInput
            value={customAmount}
            onChangeText={(value) => {
              setCustomAmount(normalizeAmount(value));
              setSelectedAmount(null);
            }}
            placeholder="Ví dụ: 300000"
            keyboardType="number-pad"
            style={{
              borderWidth: 1,
              borderColor: OTTO_THEME.border,
              borderRadius: 16,
              paddingHorizontal: 14,
              paddingVertical: 13,
              color: OTTO_THEME.text,
              backgroundColor: "#FFFFFF",
            }}
          />
        </View>

        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: OTTO_THEME.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: OTTO_THEME.mutedText }}>Số tiền nạp</Text>
            <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>
              {finalAmount > 0 ? api.formatMoney(finalAmount) : "Chưa chọn"}
            </Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <Text style={{ color: OTTO_THEME.mutedText }}>Cổng thanh toán</Text>
            <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>Stripe</Text>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingTop: 10,
              borderTopWidth: 1,
              borderTopColor: OTTO_THEME.border,
            }}
          >
            <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>Tổng thanh toán</Text>
            <Text style={{ color: OTTO_THEME.primaryDark, fontWeight: "800", fontSize: 18 }}>
              {finalAmount > 0 ? api.formatMoney(finalAmount) : "0đ"}
            </Text>
          </View>
        </View>

        {depositSession ? (
          <View
            style={{
              backgroundColor: statusMeta.backgroundColor,
              borderRadius: 24,
              borderWidth: 1,
              borderColor: statusMeta.borderColor,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  backgroundColor: "#FFFFFF",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 12,
                }}
              >
                {checking ? (
                  <ActivityIndicator color={statusMeta.tone} />
                ) : (
                  <Icon
                    family={statusMeta.iconFamily}
                    name={statusMeta.iconName}
                    size={20}
                    color={statusMeta.tone}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: statusMeta.tone,
                    fontWeight: "700",
                    fontSize: 16,
                    marginBottom: 6,
                  }}
                >
                  {statusMeta.title}
                </Text>
                <Text style={{ color: OTTO_THEME.text, lineHeight: 20 }}>
                  {statusMeta.description}
                </Text>
                <Text
                  style={{
                    color: OTTO_THEME.mutedText,
                    marginTop: 10,
                    fontSize: 12,
                  }}
                >
                  Mã giao dịch: {depositSession.transactionId.slice(-6).toUpperCase()}
                </Text>
                {statusNote ? (
                  <Text style={{ color: OTTO_THEME.text, lineHeight: 20, marginTop: 8 }}>
                    {statusNote}
                  </Text>
                ) : null}
              </View>
            </View>

            <View style={{ marginTop: 14 }}>
              {depositState !== "SUCCESS" ? (
                <>
                  <TouchableOpacity
                    onPress={() =>
                      void openStripeCheckout(
                        depositSession.checkoutUrl,
                        depositSession.transactionId,
                      )
                    }
                    style={{
                      backgroundColor: OTTO_THEME.primary,
                      borderRadius: 16,
                      paddingVertical: 14,
                      alignItems: "center",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                      Mở lại thanh toán Stripe
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => void checkDepositStatus(depositSession.transactionId)}
                    style={{
                      borderWidth: 1,
                      borderColor: OTTO_THEME.border,
                      borderRadius: 16,
                      paddingVertical: 14,
                      alignItems: "center",
                      backgroundColor: "#FFFFFF",
                      marginBottom: 10,
                    }}
                  >
                    <Text style={{ color: OTTO_THEME.primaryDark, fontWeight: "700" }}>
                      Kiểm tra trạng thái
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  onPress={() => navigation.navigate("Wallet")}
                  style={{
                    backgroundColor: OTTO_THEME.primary,
                    borderRadius: 16,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                    Quay về ví Otto
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={handleResetDeposit}
                style={{
                  borderWidth: 1,
                  borderColor: OTTO_THEME.border,
                  borderRadius: 16,
                  paddingVertical: 14,
                  alignItems: "center",
                  backgroundColor: "#FFFFFF",
                }}
              >
                <Text style={{ color: OTTO_THEME.text, fontWeight: "700" }}>
                  {depositState === "SUCCESS" ? "Tạo giao dịch nạp mới" : "Đổi số tiền khác"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {!depositSession ? (
          <TouchableOpacity
            onPress={() => void handleCreateDeposit()}
            disabled={!canSubmit}
            style={{
              backgroundColor: canSubmit ? OTTO_THEME.primary : OTTO_THEME.primarySoft,
              borderRadius: 18,
              paddingVertical: 15,
              alignItems: "center",
              marginBottom: 10,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 16 }}>
                Nạp tiền bằng Stripe
                {finalAmount > 0 ? ` · ${api.formatMoney(finalAmount)}` : ""}
              </Text>
            )}
          </TouchableOpacity>
        ) : null}

        <Text
          style={{
            color: OTTO_THEME.mutedText,
            textAlign: "center",
            lineHeight: 20,
            paddingHorizontal: 6,
          }}
        >
          Sau khi Stripe báo thành công, backend sẽ tự cộng tiền vào ví và màn hình này sẽ cập nhật lại số dư.
        </Text>
      </ScrollView>

      <BottomNav />
    </View>
  );
}
