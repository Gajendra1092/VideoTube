import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppState, Theme } from '@/types';

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      sidebarOpen: true,

      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme: Theme = currentTheme === 'light' ? 'dark' : 'light';
        set({ theme: newTheme });
        
        // Update document class for theme
        if (newTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },

      toggleSidebar: () => {
        set({ sidebarOpen: !get().sidebarOpen });
      },

      setSidebarOpen: (open: boolean) => {
        set({ sidebarOpen: open });
      },
    }),
    {
      name: 'app-storage',
      onRehydrateStorage: () => (state) => {
        // Apply theme on rehydration
        if (state?.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      },
    }
  )
);
