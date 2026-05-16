  import { Order } from "./types";
  import AssignedView from "./AssignedView";
  import CancelledView from "./CancelledView";
  // import CompletedView from "./CompletedView";
  import InProgressView from "./InProgressView";
  import OfferingView from "./OfferingView";
  import TimeoutView from "./TimeoutView";
  import SearchingView from "./SearchingView";
  import { useRouter } from "next/navigation";
import CompletedView from "./CompletedView";

  interface OrderStateRendererProps {
    order: Order;
    onCancel?: () => void;
    onAccept?: () => void;
    onReject?: () => void;
    onChat?: () => void;
    onCall?: () => void;
    onRate?: (rating: number, review: string) => void;
    onRebook?: () => void;
    onRetry?: () => void;
    onSupport?: () => void;
  }

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const OrderStateRenderer = ({
    order,
    ...handlers
  }: OrderStateRendererProps) => {
    const router = useRouter();
    const normalizedStatus = String(order.status || "").toUpperCase();
    const handlePay = async () => {
      console.log("🚀 START CONFIRM");

      const res = await fetch(
        `${API_URL}/orders/${order._id}/confirm-completed`,
        {
          method: "PATCH",
          credentials: "include",
        },
      );

      const data = await res.json();
      console.log("🔥 CONFIRM RESULT:", data);

      if (!res.ok) {
        console.error("❌ CONFIRM FAILED");
        return;
      }

      // delay nhẹ để DB sync 
      await new Promise((r) => setTimeout(r, 300));
      router.push(`/orders/${order._id}/thank-you`); 
    };
    switch (normalizedStatus) {
      case "SEARCHING":
        return <SearchingView order={order} onCancel={handlers.onCancel} />;
      case "WAITING_CONFIRMATION":
        return <OfferingView order={order} onAccept={handlePay} />;
      case "ASSIGNED":
        return (
          <AssignedView
            order={order}
            onChat={handlers.onChat}
            onCall={handlers.onCall}
            onCancel={handlers.onCancel}
          />
        );
      case "IN_PROGRESS":
        return (
          <InProgressView
            order={order}
            onChat={handlers.onChat}
            onCall={handlers.onCall}
          />
        );
      case "COMPLETED":
        return (
          <CompletedView
            order={order}
            onRate={handlers.onRate}
            onRebook={handlers.onRebook}
          />
        );
      case "TIMEOUT":
        return (
          <TimeoutView
            order={order}
            onRetry={handlers.onRetry}
            onCancel={handlers.onCancel}
          />
        );
      case "CANCELLED":
        return (
          <CancelledView
            order={order}
            onRebook={handlers.onRebook}
            onSupport={handlers.onSupport}
          />
        );
      default:
        return (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Trạng thái không xác định: {order.status}
          </div>
        );
    }
  };

  export default OrderStateRenderer;
