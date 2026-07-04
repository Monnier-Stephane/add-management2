import { api } from '@/lib/api/api'

export function mockCoachByEmailSuccess(coach: {
  statut: string
  nom: string
  prenom: string
  email: string
}) {
  jest.mocked(api.get).mockResolvedValueOnce(coach)
}

export function mockCoachLookupFallback(
  coaches: Array<{
    email?: string
    prenom?: string
    nom?: string
    statut?: string
  }> = [],
) {
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('HTTP 404: Not Found'))
    .mockResolvedValueOnce(coaches)
}

export function mockCoachLookupFailure() {
  jest
    .mocked(api.get)
    .mockRejectedValueOnce(new Error('HTTP 404: Not Found'))
    .mockRejectedValueOnce(new Error('API Error'))
}
