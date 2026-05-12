import { requireApiUrl } from "@/lib/api-url";

const API_URL = requireApiUrl();
export const getAvailableOrders = async () => {
    const res = await fetch(`${API_URL}/orders/available`, {
        credentials: "include", // vì bạn dùng cookie JWT
    });

    if (!res.ok) throw new Error("Failed to fetch orders");

    return res.json();
};

export const getMyTaskerOrders = async () => {
  const res = await fetch(`${API_URL}/orders/my-tasker`, {
    credentials: "include", // vì bạn dùng cookie JWT
  });

  if (!res.ok) throw new Error("Failed to fetch orders");

  return res.json();
};