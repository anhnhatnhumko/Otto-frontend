import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api from "../../api/customer";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { OTTO_THEME } from "../../constants/otto-theme";

type PaymentMethod = "cash" | "wallet" | "stripe";

export default function Payments({ route, navigation }: any) {
  const draftOrder = route?.params?.draftOrder;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletLoading, setWalletLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    api
      .getWallet()
      .then((wallet) => {
        if (mounted) setWalletBalance(wallet.balance || 0);
      })
      .catch(() => {
        if (mounted) setWalletBalance(0);
      })
      .finally(() => {
        if (mounted) setWalletLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const totalPrice = Number(draftOrder?.totalPrice || 0);

  const walletEnough = useMemo(() => {
    return walletBalance >= totalPrice;
  }, [totalPrice, walletBalance]);

  const suggestedTopUpAmount = useMemo(() => {
    const missingAmount = Math.max(totalPrice - walletBalance, 0);
    if (missingAmount <= 0) {
      return 100000;
    }

    return Math.max(Math.ceil(missingAmount / 10000) * 10000, 10000);
  }, [totalPrice, walletBalance]);

  const paymentOptions = [
    {
      key: "cash" as const,
      title: "Tiền mặt khi hoàn thành",
      description: "Tasker sẽ nhận việc ngay sau khi bạn xác nhận đơn.",
      helper: "Phù hợp nếu bạn muốn match tasker ngay.",
    },
    {
      key: "wallet" as const,
      title: "Ví Otto",
      description: walletLoading
        ? "Đang tải số dư ví..."
        : `Số dư hiện tại: ${api.formatMoney(walletBalance)}`,
      helper: walletEnough
        ? "Thanh toán xong hệ thống sẽ tự động điều phối tasker."
        : "Số dư ví hiện chưa đủ cho đơn này.",
    },
    {
      key: "stripe" as const,
      title: "Thẻ ngân hàng qua Stripe",
      description:
        "Thanh toán online bằng thẻ, cổng thanh toán sẽ mở trong trình duyệt.",
      helper:
        "Nếu đơn bị hủy đúng điều kiện, tiền sẽ được hoàn về ví Otto của bạn.",
    },
  ];

  const openStripeCheckout = async (orderId: string, checkoutUrl: string) => {
    navigation.replace("OrderDetail", { id: orderId });

    try {
      await WebBrowser.openBrowserAsync(checkoutUrl, {
        showTitle: true,
        controlsColor: OTTO_THEME.primaryDark,
      });
    } catch {
      const supported = await Linking.canOpenURL(checkoutUrl);
      if (!supported) {
        throw new Error("Không thể mở cổng thanh toán Stripe trên thiết bị này.");
      }

      await Linking.openURL(checkoutUrl);
    }
  };

  const openWalletDeposit = () => {
    navigation.navigate("WalletDeposit", {
      initialAmount: suggestedTopUpAmount,
    });
  };

  const handleConfirm = async () => {
    if (!draftOrder?.service) {
      Alert.alert("Thiếu dữ liệu", "Không tìm thấy thông tin đặt dịch vụ.");
      return;
    }

    if (paymentMethod === "wallet" && !walletEnough) {
      Alert.alert(
        "Số dư chưa đủ",
        "Vui lòng nạp thêm tiền vào ví hoặc chuyển sang thanh toán khác.",
        [
          {
            text: "Nạp tiền",
            onPress: openWalletDeposit,
          },
          { text: "Đóng", style: "cancel" },
        ],
      );
      return;
    }

    setSubmitting(true);
    let createdOrder: any = null;

    try {
      createdOrder = await api.createOrder({
        ...draftOrder,
        paymentMethod,
      });

      const orderId = String(createdOrder?._id || createdOrder?.id || "");
      if (!orderId) {
        throw new Error("Không nhận được mã đơn hàng từ hệ thống.");
      }

      if (paymentMethod === "wallet") {
        const payment = await api.createWalletPayment(orderId);

        navigation.replace("WalletVerify", {
          orderId,
          transactionId: payment.transactionId,
          amount: Number(createdOrder?.totalPrice || totalPrice),
          serviceName: draftOrder.service.title,
        });
        return;
      }

      if (paymentMethod === "stripe") {
        const payment = await api.createStripePayment(orderId);

        if (!payment?.checkoutUrl) {
          throw new Error("Không lấy được link thanh toán Stripe.");
        }

        await openStripeCheckout(orderId, payment.checkoutUrl);
        return;
      }

      navigation.replace("OrderDetail", { id: orderId });
    } catch (error: any) {
      if (paymentMethod === "wallet" && createdOrder?._id) {
        Alert.alert(
          "Đơn đã được tạo",
          "Đơn đang chờ thanh toán. Bạn có thể vào chi tiết đơn để thử gửi lại OTP thanh toán.",
          [
            {
              text: "Xem đơn hàng",
              onPress: () =>
                navigation.replace("OrderDetail", {
                  id: String(createdOrder._id),
                }),
            },
            { text: "Đóng", style: "cancel" },
          ],
        );
      } else if (paymentMethod === "stripe" && createdOrder?._id) {
        Alert.alert(
          "Đơn đã được tạo",
          "Đơn đang chờ bạn hoàn tất thanh toán Stripe. Bạn có thể mở lại cổng thanh toán trong chi tiết đơn hàng.",
          [
            {
              text: "Xem đơn hàng",
              onPress: () =>
                navigation.replace("OrderDetail", {
                  id: String(createdOrder._id),
                }),
            },
            { text: "Đóng", style: "cancel" },
          ],
        );
      } else {
        Alert.alert(
          "Lỗi",
          error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!draftOrder?.service) {
    return (
      <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
        <Header title="Thanh toán" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text
            style={{
              color: OTTO_THEME.text,
              fontSize: 18,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Không có dữ liệu đơn nháp
          </Text>
          <Text style={{ color: OTTO_THEME.mutedText, textAlign: "center" }}>
            Hãy quay lại màn hình đặt dịch vụ để chọn lịch và khu vực trước.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.replace("CreateOrder")}
            style={{
              marginTop: 18,
              backgroundColor: OTTO_THEME.primary,
              paddingHorizontal: 18,
              paddingVertical: 12,
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700" }}>
              Quay lại đặt dịch vụ
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
      <Header title="Thanh toán" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 104 }}>
        <Text
          style={{
            fontSize: 22,
            fontWeight: "700",
            color: OTTO_THEME.text,
            marginBottom: 8,
          }}
        >
          Chọn phương thức thanh toán
        </Text>
        <Text style={{ color: OTTO_THEME.mutedText, marginBottom: 16 }}>
          Tien mat se gui don di ngay. Ví Otto se yeu cau OTP. Stripe se mo cong thanh toan the trong trinh duyet va don se tu dong cap nhat sau khi thanh toan xong.
        </Text>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: OTTO_THEME.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: OTTO_THEME.text,
              fontWeight: "700",
              fontSize: 17,
              marginBottom: 14,
            }}
          >
            Tóm tắt đơn hàng
          </Text>

          {[
            { label: "Dịch vụ", value: draftOrder.service.title },
            { label: "Ngày", value: draftOrder.scheduleDate },
            {
              label: "Giờ",
              value: `${draftOrder.startTime} - ${draftOrder.endTime}`,
            },
            { label: "Thời lượng", value: `${draftOrder.totalHours} giờ` },
            { label: "Địa chỉ", value: draftOrder.address },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: OTTO_THEME.mutedText, flex: 1, paddingRight: 12 }}>
                {item.label}
              </Text>
              <Text
                style={{
                  color: OTTO_THEME.text,
                  fontWeight: "700",
                  flex: 1,
                  textAlign: "right",
                }}
              >
                {item.value}
              </Text>
            </View>
          ))}

          {draftOrder.note ? (
            <View style={{ marginBottom: 10 }}>
              <Text style={{ color: OTTO_THEME.mutedText, marginBottom: 4 }}>
                Ghi chú
              </Text>
              <Text style={{ color: OTTO_THEME.text }}>{draftOrder.note}</Text>
            </View>
          ) : null}

          <View
            style={{
              borderTopWidth: 1,
              borderTopColor: OTTO_THEME.border,
              paddingTop: 14,
              marginTop: 4,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ color: OTTO_THEME.text, fontWeight: "700", fontSize: 18 }}>
                Tổng thanh toán
              </Text>
              <Text
                style={{
                  color: OTTO_THEME.primaryDark,
                  fontWeight: "700",
                  fontSize: 22,
                }}
              >
                {api.formatMoney(totalPrice)}
              </Text>
            </View>
          </View>
        </View>

        <View
          style={{
            backgroundColor: "#fff",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: OTTO_THEME.border,
            padding: 16,
            marginBottom: 16,
          }}
        >
          <Text
            style={{
              color: OTTO_THEME.text,
              fontWeight: "700",
              fontSize: 17,
              marginBottom: 14,
            }}
          >
            Phương thức thanh toán
          </Text>

          {paymentOptions.map((option) => {
            const active = paymentMethod === option.key;
            const disabled = option.key === "wallet" && walletLoading;

            return (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  if (!disabled) setPaymentMethod(option.key);
                }}
                style={{
                  borderWidth: 1,
                  borderColor: active ? OTTO_THEME.primary : OTTO_THEME.border,
                  backgroundColor: active ? OTTO_THEME.primarySoft : "#fff",
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 12,
                  opacity: disabled ? 0.7 : 1,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: OTTO_THEME.text, fontWeight: "700", fontSize: 16 }}>
                    {option.title}
                  </Text>
                  {active ? (
                    <Text style={{ color: OTTO_THEME.primaryDark, fontWeight: "700" }}>
                      Đã chọn
                    </Text>
                  ) : null}
                </View>
                <Text style={{ color: OTTO_THEME.mutedText, marginTop: 6 }}>
                  {option.description}
                </Text>
                <Text
                  style={{
                    color:
                      option.key === "wallet" && !walletEnough && !walletLoading
                        ? OTTO_THEME.danger
                        : OTTO_THEME.primaryDark,
                    marginTop: 8,
                    fontWeight: "600",
                  }}
                >
                  {option.helper}
                </Text>
                {option.key === "wallet" && !walletEnough && !walletLoading ? (
                  <TouchableOpacity
                    onPress={openWalletDeposit}
                    style={{
                      alignSelf: "flex-start",
                      marginTop: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 9,
                      borderRadius: 12,
                      backgroundColor: "#FFFFFF",
                      borderWidth: 1,
                      borderColor: OTTO_THEME.border,
                    }}
                  >
                    <Text style={{ color: OTTO_THEME.primaryDark, fontWeight: "700" }}>
                      Nạp thêm {api.formatMoney(suggestedTopUpAmount)}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          disabled={submitting}
          style={{
            backgroundColor: submitting
              ? OTTO_THEME.primarySoft
              : OTTO_THEME.primary,
            borderRadius: 18,
            paddingVertical: 15,
            alignItems: "center",
          }}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
              {paymentMethod === "wallet"
                ? "Tạo đơn và gửi OTP thanh toán"
                : paymentMethod === "stripe"
                  ? "Tạo đơn và mở Stripe"
                  : "Xác nhận đặt dịch vụ"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
