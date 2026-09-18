export type StudentCategory = 'enfants' | 'adolescents' | 'adultes'

export const CATEGORY_ORDER: Record<StudentCategory, number> = {
  enfants: 0,
  adolescents: 1,
  adultes: 2,
}

export function calculateAge(dateOfBirth: string | undefined): number {
  if (!dateOfBirth) return 0

  const today = new Date()
  const birthDate = new Date(dateOfBirth)

  if (isNaN(birthDate.getTime())) return 0

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }

  if (age < 0 || age > 120) return 0

  return age
}

export function getStudentCategory(
  tarif: string | string[] | undefined,
  dateDeNaissance?: string,
): StudentCategory {
  const tarifs = Array.isArray(tarif) ? tarif : [tarif].filter(Boolean)

  for (const t of tarifs) {
    const tarifLower = (t || '').toLowerCase()

    if (
      tarifLower.includes('enfant') ||
      tarifLower.includes('5 à 8') ||
      tarifLower.includes('9 à 11') ||
      tarifLower.includes('7 à 11')
    ) {
      return 'enfants'
    }
    if (
      tarifLower.includes('ado') ||
      tarifLower.includes('10 à 17') ||
      tarifLower.includes('11 à 17') ||
      tarifLower.includes('12 à 17')
    ) {
      return 'adolescents'
    }
    if (
      tarifLower.includes('adulte') ||
      tarifLower.includes('18 à 20') ||
      tarifLower.includes('jeunes adultes')
    ) {
      return 'adultes'
    }
  }

  const age = calculateAge(dateDeNaissance)
  if (age > 0 && age < 12) return 'enfants'
  if (age >= 12 && age < 18) return 'adolescents'
  if (age >= 18) return 'adultes'

  return 'enfants'
}