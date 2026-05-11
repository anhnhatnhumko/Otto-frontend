import { Job } from "./taskerTypes";
import { formatTime } from "./taskerUtils";

const mapStatus = (status: string) => {
  switch (status) {
    case "SEARCHING":
    case "OFFERING":
      return "pending";

    case "ASSIGNED":
    case "IN_PROGRESS":
      return "in_progress";

    case "WAITING_CONFIRMATION":
    case "COMPLETED":
      return "completed";

    default:
      return "pending";
  }
};

export function buildWorkTime(start?: string, end?: string) {
  if (!start || !end) return "";
  return `${new Date(start).toLocaleTimeString()} - ${new Date(end).toLocaleTimeString()}`;
}

export const mapOrderToJob = (data: any): Job => {
  return {
    id: data._id,

    service: data.serviceSnapshot?.name,

    customer: data.customerId?.fullName,
    phone: data.customerId?.phone,

    address: data.address || data.addressDetail || "",

    date: new Date(data.scheduleTime).toLocaleDateString("vi-VN"),

    time: `${formatTime(data.startTime)} - ${formatTime(data.endTime)}`,

    price: data.totalPrice,

    status: data.status,

    notes: data.note,

    rating: data.rating,
    review: data.review,

    scheduleTime: data.scheduleTime,
    endTime: data.endTime,
    offerExpiresAt: data.offerExpiresAt,
    unreadMessages: data.unreadMessages || 0,
  };
};