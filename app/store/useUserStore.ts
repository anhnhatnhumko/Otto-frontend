import { create } from "zustand";

type User = {
  _id: string;
  fullName: string;
  email: string;
  role?: string;
  avatar?: string;
};

type UserStore = {
  user: User | null;
  setUser: (
    user: User | null | ((prev: User | null) => User | null)
  ) => void;
};

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) =>
    set((state) => ({
      user:
        typeof user === "function"
          ? user(state.user)
          : user,
    })),
}));