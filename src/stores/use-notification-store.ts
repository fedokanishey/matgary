import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NotificationPreferences {
  soundEnabled: boolean;
  browserEnabled: boolean;
  emailEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  setBrowserEnabled: (enabled: boolean) => void;
  setEmailEnabled: (enabled: boolean) => void;
}

export const useNotificationStore = create<NotificationPreferences>()(
  persist(
    (set) => ({
      soundEnabled: true,
      browserEnabled: true,
      emailEnabled: true,
      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setBrowserEnabled: (enabled) => set({ browserEnabled: enabled }),
      setEmailEnabled: (enabled) => set({ emailEnabled: enabled }),
    }),
    {
      name: "matgary-notification-prefs",
    }
  )
);
