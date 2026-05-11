import { create } from "zustand";

interface UnreadMessageStore {
  unreadCounts: Record<string, number>; // orderId -> count
  setUnread: (orderId: string, count: number) => void;
  incrementUnread: (orderId: string, amount?: number) => void;
  decrementUnread: (orderId: string, amount?: number) => void;
  clearUnread: (orderId: string) => void;
  getUnread: (orderId: string) => number;
}

const useUnreadMessagesStore = create<UnreadMessageStore>((set, get) => ({
  unreadCounts: {},
  
  setUnread: (orderId: string, count: number) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [orderId]: Math.max(0, count),
      },
    })),

  incrementUnread: (orderId: string, amount = 1) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [orderId]: (state.unreadCounts[orderId] || 0) + amount,
      },
    })),

  decrementUnread: (orderId: string, amount = 1) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [orderId]: Math.max(0, (state.unreadCounts[orderId] || 0) - amount),
      },
    })),

  clearUnread: (orderId: string) =>
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [orderId]: 0,
      },
    })),

  getUnread: (orderId: string) => {
    const state = get();
    return state.unreadCounts[orderId] || 0;
  },
}));

export default useUnreadMessagesStore;
