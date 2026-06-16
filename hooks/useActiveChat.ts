import { create } from "zustand";

interface ActiveChatStore {
  activeOrderId: string | null;
  setActiveOrderId: (orderId: string | null) => void;
  isActiveOrder: (orderId?: string | null) => boolean;
}

const useActiveChatStore = create<ActiveChatStore>((set, get) => ({
  activeOrderId: null,

  setActiveOrderId: (orderId) =>
    set({
      activeOrderId: orderId ? String(orderId).trim() : null,
    }),

  isActiveOrder: (orderId) => {
    const nextOrderId = String(orderId ?? "").trim();
    if (!nextOrderId) {
      return false;
    }

    return get().activeOrderId === nextOrderId;
  },
}));

export default useActiveChatStore;
