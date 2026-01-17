import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'candidate' | 'recruiter';

interface RoleState {
  role: UserRole;
  setRole: (role: UserRole) => void;
  toggleRole: () => void;
  userName: string;
  companyName: string;
}

export const useRoleStore = create<RoleState>()(
  persist(
    (set, get) => ({
      role: 'candidate',
      userName: '김민수',
      companyName: 'TechCorp',
      setRole: (role) => set({ role }),
      toggleRole: () => {
        const currentRole = get().role;
        set({ role: currentRole === 'candidate' ? 'recruiter' : 'candidate' });
      },
    }),
    {
      name: 'role-storage',
    }
  )
);

