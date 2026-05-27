export async function fetchOrderMessages(orderId: string, limit = 200) {
  const res = await fetch(`/api/chat/orders/${orderId}/messages?limit=${limit}`, {
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

export async function sendOrderMessage(orderId: string, text: string) {
  const res = await fetch(`/api/chat/orders/${orderId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const raw = await res.text();
    throw new Error(`Failed to send message: ${res.status} ${raw}`);
  }

  return res.json();
}

export default { fetchOrderMessages, sendOrderMessage };
