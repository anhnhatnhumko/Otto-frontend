import { requireApiUrl } from "@/lib/api-url";

const API_URL = requireApiUrl();

/**
 * Fetch customer profile stats: total orders, total spent, avg rating, loyalty points, member level
 */
export async function fetchProfileStats() {
  try {
    const res = await fetch(`${API_URL}/customers/profile-stats`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching profile stats:', err);
    return null;
  }
}

/**
 * Fetch upcoming bookings (orders with status: pending, confirmed, assigned)
 */
export async function fetchUpcomingBookings() {
  try {
    const res = await fetch(`${API_URL}/orders?status=pending,confirmed,assigned&sort=-scheduleTime&limit=5`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching upcoming bookings:', err);
    return [];
  }
}

/**
 * Fetch customer's order history (latest orders, any status)
 */
export async function fetchOrdersHistory(limit = 20) {
  try {
    const res = await fetch(`${API_URL}/orders?sort=-createdAt&limit=${limit}`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching orders history:', err);
    return [];
  }
}

/**
 * Fetch active promotions/vouchers for customer
 */
export async function fetchPromotions() {
  try {
    const res = await fetch(`${API_URL}/promotions?active=true&limit=10`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching promotions:', err);
    return [];
  }
}

/**
 * Fetch customer's favorite/frequently booked services
 */
export async function fetchFavoriteServices() {
  try {
    const res = await fetch(`${API_URL}/customers/favorite-services?limit=5`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return [];
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching favorite services:', err);
    return [];
  }
}

/**
 * Fetch customer profile details (birthday, address, etc)
 */
export async function fetchCustomerProfile() {
  try {
    const res = await fetch(`${API_URL}/customers/profile`, {
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (err) {
    console.error('Error fetching customer profile:', err);
    return null;
  }
}
