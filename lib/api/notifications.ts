export async function fetchNotifications(limit = 20) {
  const res = await fetch(`/api/notifications?limit=${limit}`, {
    credentials: 'include',
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch notifications: ${res.status}`);
  }

  return res.json();
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to mark read: ${res.status}`);
  }

  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`/api/notifications/read-all`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error(`Failed to mark all read: ${res.status}`);
  }

  return res.json();
}
