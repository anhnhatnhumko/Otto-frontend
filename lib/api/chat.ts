const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchOrderMessages(orderId: string, limit = 200) {
  if (!API_URL) throw new Error('NEXT_PUBLIC_API_URL is required');
  const res = await fetch(`${API_URL}/chat/orders/${orderId}/messages?limit=${limit}`, {
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
