// src/store/authStore.ts
import { create } from 'zustand';

type UserRole = 
  | "System Administrator" 
  | "Finance Approver" 
  | "Senior Reconciliation Officer" 
  | "Reconciliation Officer" 
  | "Auditor";

interface AuthState {
  currentUser: {
    name: string;
    role: UserRole;
  };
  setRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: {
    name: "Eric Opute",
    role: "Senior Reconciliation Officer",   // Change this to test different roles
  },
  setRole: (role) => set((state) => ({
    currentUser: { ...state.currentUser, role }
  })),
}));