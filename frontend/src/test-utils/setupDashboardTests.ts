jest.mock('@/lib/auth/AuthContext', () => ({
  useAuth: jest.fn(() => ({
    user: { email: 'test@example.com', uid: 'test-uid' },
    userProfile: null,
    userRole: 'admin',
    loading: false,
    logout: jest.fn().mockResolvedValue(undefined),
    sessionExpired: false,
    timeRemaining: 3600000,
    extendSession: jest.fn(),
  })),
}))

export const mockUseSubscriptions = jest.fn(() => ({
  data: [],
  isLoading: true,
  error: null,
  refetch: jest.fn(),
}))

export const mockUseUniqueTarifs = jest.fn(() => ({
  data: [],
  isLoading: false,
  error: null,
}))

jest.mock('@/lib/hooks/useSubscriptions', () => ({
  useSubscriptions: () => mockUseSubscriptions(),
  useUniqueTarifs: () => mockUseUniqueTarifs(),
}))
