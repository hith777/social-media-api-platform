import { create } from 'zustand'

interface UserProfile {
  id: string
  email: string
  username: string
  displayName?: string
  bio?: string
  avatar?: string
  followersCount: number
  followingCount: number
  postsCount: number
}

interface UserState {
  profile: UserProfile | null
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  setProfile: (profile) => set({ profile }),
  updateProfile: (updates) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, ...updates } : null,
    })),
}))

