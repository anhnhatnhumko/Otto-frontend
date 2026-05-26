export const getAvailableOrders = async () => {
    const res = await fetch(`/api/proxy/orders/available`, {
        credentials: "include", // vì bạn dùng cookie JWT
    });

    if (!res.ok) throw new Error("Failed to fetch orders");

    return res.json();
};

export const getMyTaskerOrders = async () => {
  const res = await fetch(`/api/proxy/orders/my-tasker`, {
    credentials: "include", // vì bạn dùng cookie JWT
  });

  if (!res.ok) throw new Error("Failed to fetch orders");

  return res.json();
};