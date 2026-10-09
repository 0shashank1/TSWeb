import { create } from "zustand";

export type Notification = {
  id: string;
  message: string;
  tone: "info" | "success" | "error";
};

type NotificationsState = {
  notifications: Notification[];
  notify: (message: string, tone?: Notification["tone"]) => void;
  dismiss: (id: string) => void;
};

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  notify: (message, tone = "info") =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { id: crypto.randomUUID(), message, tone },
      ],
    })),
  dismiss: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((item) => item.id !== id),
    })),
}));
