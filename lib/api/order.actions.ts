const API_URL = process.env.NEXT_PUBLIC_API_URL!;
export const acceptOrder = async (id: string) => {
  return fetch(`${API_URL}/orders/${id}/accept`, {
    method: "PATCH",
    credentials: "include",
  });
};

export const rejectOrder = async (id: string) => {
  return fetch(`${API_URL}/orders/${id}/reject`, {
    method: "PATCH",
    credentials: "include",
  });
};

export const completeOrder = async (id: string) => {
  return fetch(`${API_URL}/orders/${id}/complete`, {
    method: "PATCH",
    credentials: "include",
  });
};