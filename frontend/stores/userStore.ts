import { create } from 'zustand'
import type { User } from '@/types/api'
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  getUserProfile,
  searchUsers,
  getFollowers,
  getFollowing,
} from '@/api/user'
import type {
  UpdateProfileRequest,
  SearchUsersParams,
} from '@/api/user'

interface UserState {
  // Current user profile (from auth store)
  currentProfile: User | null
  // Viewed user profile (when viewing someone else's profile)
  viewedProfile: User | null
  // Search results
  searchResults: User[]
  // Followers/Following lists
  followers: User[]
  following: User[]
  // Loading states
  isLoading: boolean
  isSearching: boolean
  // Error state
  error: string | null
  // Actions
  setCurrentProfile: (profile: User | null) => void
  setViewedProfile: (profile: User | null) => void
  fetchProfile: () => Promise<void>
  fetchUserProfile: (userId: string) => Promise<void>
  updateUserProfile: (data: UpdateProfileRequest) => Promise<void>
  uploadUserAvatar: (file: File) => Promise<void>
  searchUsersList: (params: SearchUsersParams) => Promise<void>
  fetchFollowers: (userId: string, page?: number, limit?: number) => Promise<void>
  fetchFollowing: (userId: string, page?: number, limit?: number) => Promise<void>
  clearSearchResults: () => void
  clearError: () => void
}

export const useUserStore = create<UserState>((set, get) => ({
  currentProfile: null,
  viewedProfile: null,
  searchResults: [],
  followers: [],
  following: [],
  isLoading: false,
  isSearching: false,
  error: null,

  setCurrentProfile: (profile) => set({ currentProfile: profile }),
  setViewedProfile: (profile) => set({ viewedProfile: profile }),

  fetchProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const profile = await getProfile()
      set({ currentProfile: profile, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch profile',
        isLoading: false,
      })
      throw error
    }
  },

  fetchUserProfile: async (userId: string) => {
    set({ isLoading: true, error: null })
    try {
      const profile = await getUserProfile(userId)
      set({ viewedProfile: profile, isLoading: false })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch user profile',
        isLoading: false,
      })
      throw error
    }
  },

  updateUserProfile: async (data: UpdateProfileRequest) => {
    set({ isLoading: true, error: null })
    try {
      const updatedProfile = await updateProfile(data)
      set({
        currentProfile: updatedProfile,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to update profile',
        isLoading: false,
      })
      throw error
    }
  },

  uploadUserAvatar: async (file: File) => {
    set({ isLoading: true, error: null })
    try {
      const result = await uploadAvatar(file)
      const { currentProfile } = get()
      if (currentProfile) {
        set({
          currentProfile: { ...currentProfile, avatar: result.avatar },
          isLoading: false,
        })
      }
    } catch (error: any) {
      set({
        error: error.message || 'Failed to upload avatar',
        isLoading: false,
      })
      throw error
    }
  },

  searchUsersList: async (params: SearchUsersParams) => {
    set({ isSearching: true, error: null })
    try {
      const result = await searchUsers(params)
      set({
        searchResults: result.data,
        isSearching: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to search users',
        isSearching: false,
      })
      throw error
    }
  },

  fetchFollowers: async (userId: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getFollowers(userId, page, limit)
      set({
        followers: result.data,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch followers',
        isLoading: false,
      })
      throw error
    }
  },

  fetchFollowing: async (userId: string, page = 1, limit = 10) => {
    set({ isLoading: true, error: null })
    try {
      const result = await getFollowing(userId, page, limit)
      set({
        following: result.data,
        isLoading: false,
      })
    } catch (error: any) {
      set({
        error: error.message || 'Failed to fetch following',
        isLoading: false,
      })
      throw error
    }
  },

  clearSearchResults: () => set({ searchResults: [] }),
  clearError: () => set({ error: null }),
}))

