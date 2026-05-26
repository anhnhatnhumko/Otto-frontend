export async function fetchOrderMessages(orderId: string, limit = 200) {
  const res = await fetch(`/api/proxy/chat/orders/${orderId}/messages?limit=${limit}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch messages: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data as any[];
}

export default { fetchOrderMessages };
