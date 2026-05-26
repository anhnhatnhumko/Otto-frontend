"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const res = await fetch(`/api/orders/my`, {
      credentials: "include",
    });
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>

      {orders.map((order: any) => (
        <Link key={order._id} href={`/orders/${order._id}`}>
          <div className="p-4 border rounded-xl mb-4 hover:bg-muted">
            <div className="font-semibold">
              {order.serviceSnapshot.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {new Date(order.scheduleTime).toLocaleString()}
            </div>
            <div className="mt-2">
              {order.status}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}