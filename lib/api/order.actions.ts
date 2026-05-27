export const acceptOrder = async (id: string) => {
  return fetch(`/api/orders/${id}/accept`, {
    method: "PATCH",
    credentials: "include",
  });
};

export const rejectOrder = async (id: string) => {
  return fetch(`/api/orders/${id}/reject`, {
    method: "PATCH",
    credentials: "include",
  });
};

export const completeOrder = async (id: string) => {
  return fetch(`/api/orders/${id}/complete`, {
    method: "PATCH",
    credentials: "include",
  });
};