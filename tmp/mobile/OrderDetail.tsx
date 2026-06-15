import { useFocusEffect } from "@react-navigation/native";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import api, {
  CustomerOrder,
  getOrderStatusLabel,
  mapOrderResponse,
} from "../../api/customer";
import BottomNav from "../../components/BottomNav";
import Header from "../../components/Header";
import { OTTO_THEME } from "../../constants/otto-theme";
import { useRealtime } from "../../providers/RealtimeProvider";
import Icon from "../../utils/icons";

function getOrderId(value: any) {
  return String(
    value?.orderId ||
      value?.id ||
      value?._id ||
      value?.data?._id ||
      value?.data?.id ||
      "",
  );
}

function applyStatusPayload(order: CustomerOrder, payload: any) {
  const mergedRaw = {
    ...(order.raw || {}),
    ...(payload?.data && typeof payload.data === "object" ? payload.data : {}),
  };

  if (payload?.status) {
    mergedRaw.status = payload.status;
  }

  if (payload?.paymentStatus) {
    mergedRaw.paymentStatus = payload.paymentStatus;
  }

  if (typeof payload?.isPaid === "boolean") {
    mergedRaw.isPaid = payload.isPaid;
    if (payload.isPaid && !mergedRaw.paidAt) {
      mergedRaw.paidAt = new Date().toISOString();
    }
  }

  if (typeof payload?.isRefunded === "boolean") {
    mergedRaw.isRefunded = payload.isRefunded;
  }

  if (!mergedRaw._id && !mergedRaw.id) {
    mergedRaw._id = order._id;
  }

  return {
    ...mapOrderResponse(mergedRaw),
    status: String(mergedRaw.status || order.status),
    statusLabel: getOrderStatusLabel(mergedRaw.status || order.status),
    paymentStatus: String(mergedRaw.paymentStatus || order.paymentStatus),
    isPaid:
      typeof mergedRaw.isPaid === "boolean"
        ? Boolean(mergedRaw.isPaid)
        : order.isPaid,
    isRefunded:
      typeof mergedRaw.isRefunded === "boolean"
        ? Boolean(mergedRaw.isRefunded)
        : order.isRefunded,
    raw: mergedRaw,
  };
}

function canCancelOrder(order?: CustomerOrder | null) {
  if (!order) return false;

  const normalizedStatus = String(order.status || "").toUpperCase();
  if (normalizedStatus !== "SEARCHING" && normalizedStatus !== "ASSIGNED") {
    return false;
  }

  const startTime = new Date(order.startTime || "");
  if (Number.isNaN(startTime.getTime())) return true;

  return startTime.getTime() - Date.now() > 60 * 60 * 1000;
}

function isRefundablePayment(order?: CustomerOrder | null) {
  if (!order) return false;
  return (
    String(order.paymentMethod || "").toLowerCase() !== "cash" &&
    Boolean(order.isPaid)
  );
}

function getTaskerInitials(name?: string) {
  const normalized = String(name || "").trim();
  if (!normalized) return "T";

  const parts = normalized.split(/\s+/).slice(0, 2);
  return parts
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        backgroundColor: "#fff",
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
          fontWeight: "700",
          fontSize: 17,
          marginBottom: subtitle ? 4 : 14,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            color: OTTO_THEME.mutedText,
            lineHeight: 20,
            marginBottom: 14,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

function InfoRow({
  iconFamily,
  iconName,
  label,
  value,
  valueColor,
  multiline,
}: {
  iconFamily: "Feather" | "MaterialCommunityIcons" | "FontAwesome5";
  iconName: string;
  label: string;
  value: string;
  valueColor?: string;
  multiline?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: multiline ? "flex-start" : "center",
        marginBottom: 14,
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
          marginRight: 12,
          marginTop: multiline ? 2 : 0,
        }}
      >
        <Icon
          family={iconFamily}
          name={iconName}
          size={16}
          color={OTTO_THEME.primaryDark}
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ color: OTTO_THEME.mutedText, marginBottom: 2 }}>{label}</Text>
        <Text
          style={{
            color: valueColor || OTTO_THEME.text,
            fontWeight: "700",
            lineHeight: 21,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  variant = "primary",
  loading = false,
  iconFamily = "Feather",
  iconName,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "outline" | "danger";
  loading?: boolean;
  iconFamily?: "Feather" | "MaterialCommunityIcons" | "FontAwesome5";
  iconName?: string;
}) {
  const isPrimary = variant === "primary";
  const isDanger = variant === "danger";

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      style={{
        backgroundColor: isPrimary
          ? OTTO_THEME.primary
          : isDanger
            ? "#fff"
            : "#fff",
        borderRadius: 18,
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: isPrimary ? 0 : 1,
        borderColor: isDanger ? OTTO_THEME.danger : OTTO_THEME.border,
        marginBottom: 12,
        flexDirection: "row",
      }}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? "#fff" : OTTO_THEME.primaryDark} />
      ) : (
        <>
          {iconName ? (
            <Icon
              family={iconFamily}
              name={iconName}
              size={16}
              color={
                isPrimary
                  ? "#fff"
                  : isDanger
                    ? OTTO_THEME.danger
                    : OTTO_THEME.primaryDark
              }
            />
          ) : null}
          <Text
            style={{
              color: isPrimary
                ? "#fff"
                : isDanger
                  ? OTTO_THEME.danger
                  : OTTO_THEME.primaryDark,
              fontWeight: "700",
              fontSize: 16,
              marginLeft: iconName ? 8 : 0,
            }}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

function getStatusPresentation(status?: string) {
  switch (String(status || "").toUpperCase()) {
    case "PENDING_PAYMENT":
      return {
        tone: "#F59E0B",
        background: "#FFFBEB",
        border: "#FCD34D",
        iconFamily: "Feather" as const,
        iconName: "credit-card",
        title: "Đơn hàng đang chờ thanh toán",
        description:
          "Hoàn tất xác minh thanh toán để hệ thống bắt đầu điều phối tasker cho đơn hàng này.",
        step: 0,
      };
    case "PAID":
      return {
        tone: OTTO_THEME.primaryDark,
        background: "#EFF6FF",
        border: "#BFDBFE",
        iconFamily: "MaterialCommunityIcons" as const,
        iconName: "cash-check",
        title: "Đã thanh toán thành công",
        description:
          "Đơn hàng đã được ghi nhận. Hệ thống đang chuẩn bị điều phối tasker phù hợp.",
        step: 1,
      };
    case "SEARCHING":
      return {
        tone: "#EA580C",
        background: "#FFF7ED",
        border: "#FDBA74",
        iconFamily: "Feather" as const,
        iconName: "search",
        title: "Đang tìm tasker cho bạn",
        description:
          "Đơn hàng đang được gửi tới những tasker phù hợp với dịch vụ và khu vực của bạn.",
        step: 1,
        loading: true,
      };
    case "ASSIGNED":
      return {
        tone: OTTO_THEME.primaryDark,
        background: "#EFF6FF",
        border: "#BFDBFE",
        iconFamily: "MaterialCommunityIcons" as const,
        iconName: "account-check-outline",
        title: "Tasker đã nhận đơn",
        description:
          "Tasker đã xác nhận công việc. Bạn có thể nhắn tin hoặc gọi điện trực tiếp nếu cần chuẩn bị thêm.",
        step: 2,
      };
    case "IN_PROGRESS":
      return {
        tone: OTTO_THEME.success,
        background: "#ECFDF5",
        border: "#A7F3D0",
        iconFamily: "MaterialCommunityIcons" as const,
        iconName: "briefcase-check-outline",
        title: "Tasker đang thực hiện công việc",
        description:
          "Đơn hàng đang trong quá trình xử lý. Bạn vẫn có thể theo dõi và trao đổi thêm với tasker.",
        step: 3,
      };
    case "WAITING_CONFIRMATION":
      return {
        tone: OTTO_THEME.primaryDark,
        background: "#EFF6FF",
        border: "#BFDBFE",
        iconFamily: "MaterialCommunityIcons" as const,
        iconName: "clipboard-check-outline",
        title: "Chờ bạn xác nhận hoàn thành",
        description:
          "Tasker đã báo hoàn tất công việc. Hãy kiểm tra lại và xác nhận để đơn hàng kết thúc trọn vẹn.",
        step: 4,
      };
    case "COMPLETED":
      return {
        tone: OTTO_THEME.success,
        background: "#ECFDF5",
        border: "#A7F3D0",
        iconFamily: "Feather" as const,
        iconName: "check-circle",
        title: "Đơn hàng đã hoàn thành",
        description:
          "Cảm ơn bạn đã sử dụng Otto. Bạn có thể đặt lại dịch vụ bất cứ lúc nào nếu vẫn còn nhu cầu.",
        step: 5,
      };
    case "TIMEOUT":
      return {
        tone: OTTO_THEME.danger,
        background: "#FEF2F2",
        border: "#FECACA",
        iconFamily: "MaterialCommunityIcons" as const,
        iconName: "clock-alert-outline",
        title: "Đơn hàng đã quá hạn",
        description:
          "Đơn hàng đã vượt quá thời gian xử lý cho phép. Bạn có thể tạo lại đơn mới hoặc kiểm tra hoàn tiền nếu có.",
        step: -1,
      };
    case "CANCELLED":
      return {
        tone: OTTO_THEME.danger,
        background: "#FEF2F2",
        border: "#FECACA",
        iconFamily: "Feather" as const,
        iconName: "x-circle",
        title: "Đơn hàng đã bị hủy",
        description:
          "Đơn hàng không còn hiệu lực. Nếu vẫn cần dịch vụ, bạn có thể đặt lại ngay từ màn hình này.",
        step: -1,
      };
    default:
      return {
        tone: OTTO_THEME.mutedText,
        background: "#F8FAFC",
        border: OTTO_THEME.border,
        iconFamily: "Feather" as const,
        iconName: "refresh-cw",
        title: "Đơn hàng đang được cập nhật",
        description:
          "Trạng thái đơn hàng sẽ được đồng bộ ngay khi hệ thống nhận được sự kiện mới từ backend.",
        step: -1,
      };
  }
}

function StatusProgress({
  currentStep,
}: {
  currentStep: number;
}) {
  const steps = [
    "Thanh toán",
    "Tìm tasker",
    "Đã nhận",
    "Đang làm",
    "Hoàn tất",
  ];

  if (currentStep < 0) return null;

  return (
    <View style={{ marginTop: 18 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {steps.map((_, index) => {
          const active = index <= currentStep;
          return (
            <View key={index} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: active ? OTTO_THEME.primaryDark : "#D9E2EC",
                  borderWidth: 3,
                  borderColor: active ? "#DBEAFE" : "#F1F5F9",
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        {steps.map((step) => (
          <Text
            key={step}
            style={{
              flex: 1,
              textAlign: "center",
              color: OTTO_THEME.mutedText,
              fontSize: 11,
            }}
          >
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function OrderDetail({ route, navigation }: any) {
  const orderId = String(route?.params?.id || "");
  const seededOrder = route?.params?.order || null;
  const { socket } = useRealtime();

  const [order, setOrder] = useState<CustomerOrder | null>(() =>
    seededOrder ? (seededOrder.raw ? seededOrder : mapOrderResponse(seededOrder)) : null,
  );
  const [loading, setLoading] = useState(!seededOrder);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const hasFocusedRef = useRef(false);

  const loadOrder = useCallback(
    async (silent = false) => {
      if (!orderId) return;

      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");
        const response = await api.getOrder(orderId);
        setOrder(response);
      } catch (err: any) {
        setError(err?.message || "Không thể tải chi tiết đơn hàng.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [orderId],
  );

  useFocusEffect(
    useCallback(() => {
      const shouldRefreshSilently = hasFocusedRef.current || Boolean(seededOrder);
      hasFocusedRef.current = true;
      void loadOrder(shouldRefreshSilently);
    }, [loadOrder, seededOrder]),
  );

  useEffect(() => {
    if (!socket || !orderId) return;

    const joinRoom = () => {
      socket.emit("order:join", { orderId });
    };

    const handleConnect = () => {
      joinRoom();
      void loadOrder(true);
    };

    const handleOrderUpdated = (payload: any) => {
      if (getOrderId(payload) !== orderId) return;
      setOrder(
        mapOrderResponse(payload?.data && payload?.data._id ? payload.data : payload),
      );
    };

    const handleOrderStatusUpdated = (payload: any) => {
      if (getOrderId(payload) !== orderId) return;
      setOrder((current) => {
        if (!current) {
          if (payload?.data) {
            return mapOrderResponse(payload.data);
          }
          return current;
        }

        return applyStatusPayload(current, payload);
      });
    };

    const handleNotification = (notification: any) => {
      const type = String(notification?.type || "").toLowerCase();
      if (type !== "refund") return;
      if (String(notification?.orderId || "") !== orderId) return;

      setOrder((current) => {
        if (!current) return current;
        return applyStatusPayload(current, {
          isRefunded: true,
          data: {
            ...(current.raw || {}),
            isRefunded: true,
          },
        });
      });
    };

    if (socket.connected) {
      joinRoom();
    }

    socket.on("connect", handleConnect);
    socket.on("order:updated", handleOrderUpdated);
    socket.on("order:status-updated", handleOrderStatusUpdated);
    socket.on("notification:new", handleNotification);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("order:updated", handleOrderUpdated);
      socket.off("order:status-updated", handleOrderStatusUpdated);
      socket.off("notification:new", handleNotification);
    };
  }, [loadOrder, orderId, socket]);

  const normalizedStatus = String(order?.status || "").toUpperCase();
  const paymentMethod = String(order?.paymentMethod || "").toLowerCase();
  const cancelAllowed = useMemo(() => canCancelOrder(order), [order]);
  const refundEligible =
    ["CANCELLED", "TIMEOUT", "AUTO_CANCELLED"].includes(normalizedStatus) &&
    isRefundablePayment(order);
  const refundCompleted = refundEligible && Boolean(order?.isRefunded || order?.raw?.isRefunded);
  const presentation = useMemo(
    () => getStatusPresentation(order?.status),
    [order?.status],
  );
  const canRebook = ["COMPLETED", "CANCELLED", "TIMEOUT"].includes(normalizedStatus);
  const hasRated = Boolean(order?.rating || order?.raw?.rating);
  const shouldShowWalletAction =
    normalizedStatus === "PENDING_PAYMENT" && paymentMethod === "wallet";
  const shouldShowStripeAction =
    normalizedStatus === "PENDING_PAYMENT" && paymentMethod === "stripe";
  const canChatWithTasker = Boolean(
    order?.tasker &&
      ["ASSIGNED", "IN_PROGRESS", "WAITING_CONFIRMATION", "COMPLETED"].includes(
        normalizedStatus,
      ),
  );

  const openStripeCheckout = useCallback(async (checkoutUrl: string) => {
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
  }, []);

  const handleOpenChat = useCallback(() => {
    if (!order) return;
    navigation.navigate("OrderChat", {
      orderId: order._id,
      peerName: order.tasker?.name,
    });
  }, [navigation, order]);

  const openOrderThankYou = useCallback(
    (targetOrderId?: string) => {
      const resolvedOrderId = String(targetOrderId || order?._id || "").trim();
      if (!resolvedOrderId) return;

      setTimeout(() => {
        navigation.push("OrderThankYou", {
          orderId: resolvedOrderId,
        });
      }, 0);
    },
    [navigation, order?._id],
  );

  const handleOpenThankYou = useCallback(() => {
    openOrderThankYou(order?._id);
  }, [openOrderThankYou, order?._id]);

  const handleCancel = () => {
    if (!order) return;

    const refundNote = isRefundablePayment(order)
      ? " Số tiền thanh toán sẽ được hoàn về Ví Otto của bạn sau khi hủy thành công."
      : "";

    Alert.alert(
      "Hủy đơn hàng",
      `Bạn có chắc muốn hủy đơn hàng này không?${refundNote}`,
      [
        { text: "Giữ lại", style: "cancel" },
        {
          text: "Hủy đơn",
          style: "destructive",
          onPress: async () => {
            try {
              setActionLoading(true);
              const response = await api.cancelOrder(order._id);
              const mapped = mapOrderResponse(response);
              setOrder(mapped);
              Alert.alert(
                "Đã hủy đơn",
                isRefundablePayment(mapped)
                  ? "Tiền thanh toán đang được hoàn về Ví Otto. Bạn có thể kiểm tra lại ở thông báo hoặc ví sau ít phút."
                  : "Đơn hàng đã được hủy thành công.",
              );
            } catch (err: any) {
              Alert.alert(
                "Không thể hủy đơn",
                err?.message || "Vui lòng thử lại sau.",
              );
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleConfirmCompleted = useCallback(async () => {
    if (!order || actionLoading) return;

    try {
      setActionLoading(true);
      const response = await api.confirmCompleted(order._id);
      const mapped = mapOrderResponse(response);
      setOrder(mapped);
      await new Promise((resolve) => setTimeout(resolve, 300));
      openOrderThankYou(mapped?._id || order._id);
    } catch (err: any) {
      Alert.alert(
        "Không thể xác nhận",
        err?.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setActionLoading(false);
    }
  }, [actionLoading, openOrderThankYou, order]);

  const handleContinueWalletPayment = async () => {
    if (!order) return;

    try {
      setActionLoading(true);
      const payment = await api.createWalletPayment(order._id);

      navigation.navigate("WalletVerify", {
        orderId: order._id,
        transactionId: payment.transactionId,
        amount: order.totalPrice,
        serviceName: order.service,
      });
    } catch (err: any) {
      Alert.alert(
        "Không thể gửi OTP",
        err?.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleContinueStripePayment = async () => {
    if (!order) return;

    try {
      setActionLoading(true);
      const payment = await api.createStripePayment(order._id);

      if (!payment?.checkoutUrl) {
        throw new Error("Không lấy được link thanh toán Stripe.");
      }

      await openStripeCheckout(payment.checkoutUrl);
    } catch (err: any) {
      Alert.alert(
        "Không thể mở Stripe",
        err?.message || "Vui lòng thử lại sau.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallTasker = async () => {
    const phone = String(order?.tasker?.phone || "").trim();
    if (!phone) {
      Alert.alert(
        "Chưa có số điện thoại",
        "Tasker chưa cập nhật số điện thoại liên hệ.",
      );
      return;
    }

    const url = `tel:${phone}`;
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert(
        "Không thể gọi điện",
        "Thiết bị hiện không hỗ trợ mở trình gọi điện.",
      );
      return;
    }

    await Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
        <Header title="Trạng thái đơn hàng" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator color={OTTO_THEME.primary} />
          <Text style={{ marginTop: 10, color: OTTO_THEME.mutedText }}>
            Đang tải chi tiết đơn hàng...
          </Text>
        </View>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
        <Header title="Trạng thái đơn hàng" />
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 24,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: OTTO_THEME.text }}>
            Không tìm thấy đơn hàng
          </Text>
          <Text
            style={{
              color: OTTO_THEME.mutedText,
              textAlign: "center",
              marginTop: 8,
              marginBottom: 16,
            }}
          >
            Đơn hàng có thể đã bị xóa hoặc bạn không còn quyền truy cập.
          </Text>
          <ActionButton
            label="Quay về lịch sử đơn hàng"
            onPress={() => navigation.replace("Orders")}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: OTTO_THEME.background }}>
      <Header title="Trạng thái đơn hàng" />
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 112 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadOrder(true)}
            tintColor={OTTO_THEME.primary}
          />
        }
      >
        {!!error ? (
          <View
            style={{
              backgroundColor: "#FEF2F2",
              borderRadius: 16,
              borderWidth: 1,
              borderColor: "#FECACA",
              padding: 12,
              marginBottom: 14,
            }}
          >
            <Text style={{ color: OTTO_THEME.danger, lineHeight: 20 }}>{error}</Text>
          </View>
        ) : null}

        <View
          style={{
            backgroundColor: presentation.background,
            borderRadius: 28,
            borderWidth: 1,
            borderColor: presentation.border,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View
              style={{
                width: 58,
                height: 58,
                borderRadius: 18,
                backgroundColor: "#fff",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              {presentation.loading ? (
                <ActivityIndicator color={presentation.tone} />
              ) : (
                <Icon
                  family={presentation.iconFamily}
                  name={presentation.iconName}
                  size={28}
                  color={presentation.tone}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: presentation.tone,
                  fontWeight: "700",
                  marginBottom: 6,
                }}
              >
                {order.statusLabel}
              </Text>
              <Text
                style={{
                  color: OTTO_THEME.text,
                  fontWeight: "700",
                  fontSize: 22,
                  marginBottom: 8,
                }}
              >
                {presentation.title}
              </Text>
              <Text style={{ color: OTTO_THEME.text, lineHeight: 21 }}>
                {presentation.description}
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              marginTop: 16,
            }}
          >
            {[
              {
                label: `Mã đơn ${order._id.slice(-6).toUpperCase()}`,
                tone: OTTO_THEME.text,
                background: "#fff",
              },
              {
                label: String(order.paymentMethod || "cash").toUpperCase(),
                tone: OTTO_THEME.primaryDark,
                background: "#DBEAFE",
              },
              {
                label: order.isPaid ? "Đã thanh toán" : "Chưa thanh toán",
                tone: order.isPaid ? OTTO_THEME.success : "#B45309",
                background: order.isPaid ? "#D1FAE5" : "#FEF3C7",
              },
            ].map((chip) => (
              <View
                key={chip.label}
                style={{
                  backgroundColor: chip.background,
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginRight: 8,
                  marginBottom: 8,
                }}
              >
                <Text style={{ color: chip.tone, fontWeight: "700", fontSize: 12 }}>
                  {chip.label}
                </Text>
              </View>
            ))}
          </View>

          <StatusProgress currentStep={presentation.step} />
        </View>

        {refundEligible ? (
          <View
            style={{
              backgroundColor: refundCompleted ? OTTO_THEME.successLight : "#EFF6FF",
              borderRadius: 20,
              borderWidth: 1,
              borderColor: refundCompleted ? "#A7F3D0" : "#BFDBFE",
              padding: 16,
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                color: refundCompleted ? OTTO_THEME.success : OTTO_THEME.primaryDark,
                fontWeight: "700",
                fontSize: 16,
                marginBottom: 6,
              }}
            >
              {refundCompleted
                ? "Tiền đã được hoàn về Ví Otto"
                : "Đang xử lý hoàn tiền"}
            </Text>
            <Text style={{ color: OTTO_THEME.text, lineHeight: 20 }}>
              {refundCompleted
                ? `Đơn thanh toán bằng ${String(order.paymentMethod || "").toUpperCase()} đã được hoàn ${api.formatMoney(order.totalPrice)} về Ví Otto của bạn.`
                : `Hệ thống đang xử lý hoàn ${api.formatMoney(order.totalPrice)} về Ví Otto của bạn. Vui lòng kiểm tra lại sau ít phút.`}
            </Text>
          </View>
        ) : null}

        {normalizedStatus === "WAITING_CONFIRMATION" ? (
          <SectionCard
            title="Bước cuối để hoàn tất đơn hàng"
            subtitle={
              paymentMethod === "cash"
                ? "Hãy kiểm tra lại chất lượng công việc trước khi xác nhận. Sau bước này, bạn sẽ được chuyển sang màn hình cảm ơn và đánh giá tasker như trên web."
                : `Hãy kiểm tra lại công việc trước khi xác nhận. Sau bước này, Otto sẽ hoàn tất đơn hàng, ghi nhận thanh toán ${String(order.paymentMethod || "").toUpperCase()} và đưa bạn tới màn hình cảm ơn, đánh giá dịch vụ.`
            }
          >
            <View
              style={{
                backgroundColor: "#F8FAFC",
                borderRadius: 18,
                borderWidth: 1,
                borderColor: OTTO_THEME.border,
                padding: 14,
                marginBottom: 14,
              }}
            >
              {[
                "Tasker đã báo hoàn tất công việc trên hệ thống.",
                "Sau khi xác nhận, đơn hàng sẽ chuyển sang trạng thái hoàn thành.",
                paymentMethod === "cash"
                  ? "Bạn có thể đánh giá và đặt lại dịch vụ ngay sau đó."
                  : "Tiền thanh toán sẽ được hệ thống ghi nhận và chuyển sang luồng tất toán cho tasker.",
              ].map((item) => (
                <View
                  key={item}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: OTTO_THEME.primarySoft,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 10,
                      marginTop: 1,
                    }}
                  >
                    <Icon
                      family="Feather"
                      name="check"
                      size={12}
                      color={OTTO_THEME.primaryDark}
                    />
                  </View>
                  <Text style={{ flex: 1, color: OTTO_THEME.text, lineHeight: 20 }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>

            <ActionButton
              label="Xác nhận hoàn thành & đánh giá"
              onPress={handleConfirmCompleted}
              loading={actionLoading}
              iconFamily="MaterialCommunityIcons"
              iconName="clipboard-check-outline"
            />
          </SectionCard>
        ) : null}

        <SectionCard title={order.service} subtitle="Thông tin lịch hẹn và khu vực thực hiện">
          <InfoRow
            iconFamily="Feather"
            iconName="calendar"
            label="Ngày làm việc"
            value={order.dateLabel}
          />
          <InfoRow
            iconFamily="Feather"
            iconName="clock"
            label="Khung giờ"
            value={order.timeLabel}
          />
          <InfoRow
            iconFamily="Feather"
            iconName="map-pin"
            label="Địa chỉ"
            value={order.address}
            multiline
          />
        </SectionCard>

        <SectionCard title="Thanh toán và chi tiết đơn">
          <InfoRow
            iconFamily="MaterialCommunityIcons"
            iconName="wallet-outline"
            label="Phương thức"
            value={String(order.paymentMethod || "cash").toUpperCase()}
          />
          <InfoRow
            iconFamily="MaterialCommunityIcons"
            iconName="cash-check"
            label="Trạng thái thanh toán"
            value={order.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
            valueColor={order.isPaid ? OTTO_THEME.success : "#B45309"}
          />
          <InfoRow
            iconFamily="MaterialCommunityIcons"
            iconName="timer-outline"
            label="Tổng thời lượng"
            value={`${order.totalHours} giờ`}
          />
          <InfoRow
            iconFamily="Feather"
            iconName="credit-card"
            label="Tổng thanh toán"
            value={api.formatMoney(order.totalPrice)}
            valueColor={OTTO_THEME.primaryDark}
          />
          <InfoRow
            iconFamily="Feather"
            iconName="hash"
            label="Mã đơn hàng"
            value={order._id}
          />
        </SectionCard>

        {order.note ? (
          <SectionCard title="Ghi chú từ khách hàng">
            <Text style={{ color: OTTO_THEME.text, lineHeight: 21 }}>{order.note}</Text>
          </SectionCard>
        ) : null}

        {order.tasker ? (
          <SectionCard
            title="Tasker phụ trách"
            subtitle="Thông tin người đang trực tiếp xử lý đơn hàng của bạn"
          >
            <View
              style={{
                backgroundColor: OTTO_THEME.primarySoft,
                borderRadius: 20,
                padding: 16,
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 29,
                    backgroundColor: OTTO_THEME.primaryDark,
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 14,
                  }}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 20 }}>
                    {getTaskerInitials(order.tasker.name)}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: OTTO_THEME.text,
                      fontWeight: "700",
                      fontSize: 17,
                      marginBottom: 4,
                    }}
                  >
                    {order.tasker.name}
                  </Text>
                  <Text style={{ color: OTTO_THEME.mutedText, marginBottom: 2 }}>
                    Đánh giá {order.tasker.rating || 0} • {order.tasker.completedJobs || 0} đơn đã hoàn thành
                  </Text>
                  {order.tasker.phone ? (
                    <Text style={{ color: OTTO_THEME.primaryDark, fontWeight: "600" }}>
                      {order.tasker.phone}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            {order.tasker.phone ? (
              <ActionButton
                label="Gọi tasker"
                onPress={handleCallTasker}
                variant="outline"
                iconName="phone"
              />
            ) : null}

            {canChatWithTasker ? (
              <ActionButton
                label="Nhắn tin với tasker"
                onPress={handleOpenChat}
                variant="outline"
                iconName="message-square"
              />
            ) : null}
          </SectionCard>
        ) : null}

        <SectionCard
          title="Hành động nhanh"
          subtitle="Các thao tác khả dụng sẽ thay đổi theo đúng trạng thái hiện tại của đơn hàng"
        >
          {shouldShowWalletAction ? (
            <ActionButton
              label="Gửi lại OTP thanh toán"
              onPress={handleContinueWalletPayment}
              loading={actionLoading}
              iconName="shield"
            />
          ) : null}

          {shouldShowStripeAction ? (
            <ActionButton
              label="Mở lại thanh toán Stripe"
              onPress={handleContinueStripePayment}
              loading={actionLoading}
              iconName="external-link"
            />
          ) : null}

          {normalizedStatus === "COMPLETED" ? (
            <ActionButton
              label={hasRated ? "Xem lời cảm ơn & đánh giá" : "Đánh giá dịch vụ"}
              onPress={handleOpenThankYou}
              variant="outline"
              iconName="star"
            />
          ) : null}

          {cancelAllowed ? (
            <ActionButton
              label="Hủy đơn hàng"
              onPress={handleCancel}
              loading={actionLoading}
              variant="danger"
              iconName="x-circle"
            />
          ) : null}

          {canRebook ? (
            <ActionButton
              label="Đặt lại dịch vụ"
              onPress={() => navigation.navigate("CreateOrder")}
              variant="outline"
              iconName="rotate-ccw"
            />
          ) : null}

          <ActionButton
            label="Xem lịch sử đơn hàng"
            onPress={() => navigation.navigate("Orders")}
            variant="outline"
            iconName="list"
          />
        </SectionCard>
      </ScrollView>
      <BottomNav />
    </View>
  );
}
