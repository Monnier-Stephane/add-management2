import { CATEGORY_ORDER, getStudentCategory, type StudentCategory } from '@/lib/utils/studentCategory'

export interface CourseStudent {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
  photoUrl?: string
  categorie?: StudentCategory
}

export interface CourseSubscription {
  _id: string
  nom: string
  prenom: string
  tarif: string | string[]
  dateDeNaissance?: string
  photoUrl?: string
}

export interface CourseSlot {
  id: string
  nom: string
  jour: string
  heure: string
  lieu: string
  coach: string
}

export const coursesStructure: CourseSlot[] = [
  {
    id: "lundi-bercy",
    nom: "Cours Lundi 19h30",
    jour: "Lundi",
    heure: "19h30",
    lieu: "Paris Bercy",
    coach: "Coach Bercy"
  },
  {
    id: "mercredi-12h15",
    nom: "Cours Mercredi 12h15",
    jour: "Mercredi",
    heure: "12h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "mercredi-16h15",
    nom: "Cours Mercredi 16h15",
    jour: "Mercredi",
    heure: "16h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "jeudi-18h",
    nom: "Cours Jeudi 18h",
    jour: "Jeudi",
    heure: "18h00",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "jeudi-19h30",
    nom: "Cours Jeudi 19h30",
    jour: "Jeudi",
    heure: "19h30",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-10h",
    nom: "Cours Samedi 10h",
    jour: "Samedi",
    heure: "10h00",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-11h15",
    nom: "Cours Samedi 11h15",
    jour: "Samedi",
    heure: "11h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-12h15",
    nom: "Cours Samedi 12h15",
    jour: "Samedi",
    heure: "12h15",
    lieu: "Paris Châtelet",
    coach: "Coach Châtelet"
  },
  {
    id: "samedi-16h30",
    nom: "Cours Samedi 16h30",
    jour: "Samedi",
    heure: "16h30",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "samedi-17h45",
    nom: "Cours Samedi 17h45",
    jour: "Samedi",
    heure: "17h45",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "dimanche-10h",
    nom: "Cours Dimanche 10h",
    jour: "Dimanche",
    heure: "10h00",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  },
  {
    id: "dimanche-11h30",
    nom: "Cours Dimanche 11h30",
    jour: "Dimanche",
    heure: "11h30",
    lieu: "Choisy le Roi",
    coach: "Coach Choisy"
  }
]

interface CourseData {
  jour: string
  heure: string
  lieu: string
}

const hasAdultsInCourse = (course: CourseData, subscriptions: CourseSubscription[]): boolean => {
  return subscriptions.some((sub: CourseSubscription) => {
    const tarifs = Array.isArray(sub.tarif) ? sub.tarif : [sub.tarif].filter(Boolean);

    return tarifs.some((tarif: string) => {
      const tarifStr = tarif || '';
      return checkCourseDayAndTime(course, tarifStr) &&
             (tarifStr.includes('ADULTES') || tarifStr.includes('JEUNES ADULTES'));
    });
  })
}

const isAdultCourse = (course: CourseData): boolean => {
  const adultCourses = [
    'Lundi 19h30 - Paris Bercy',
    'Mercredi 16h15 - Paris Châtelet',
    'Jeudi 19h30 - Paris Châtelet',
    'Samedi 10h00 - Paris Châtelet',
    'Samedi 16h30 - Choisy le Roi',
    'Samedi 17h45 - Choisy le Roi',
    'Dimanche 10h00 - Choisy le Roi',
    'Dimanche 11h30 - Choisy le Roi'
  ]

  return adultCourses.some(adultCourse => {
    const [dayTime, location] = adultCourse.split(' - ')
    return course.jour === dayTime.split(' ')[0] &&
           course.heure === dayTime.split(' ')[1] &&
           course.lieu === location
  })
}

const checkTimeMatch = (heure: string, tarif: string): boolean => {
  const timeChecks: Record<string, () => boolean> = {
    '12h15': () => tarif.includes('12h15') || tarif.includes('12H15'),
    '16h15': () => tarif.includes('16h15'),
    '18h00': () => tarif.includes('18h'),
    '19h30': () => tarif.includes('19h30'),
    '10h00': () => tarif.includes('10h') || tarif.includes('Paris châtelet 10h') || tarif.includes('Paris Châtelet 1Oh'),
    '11h15': () => tarif.includes('11h15'),
    '16h30': () => tarif.includes('16h30') && tarif.includes('Choisy'),
    '17h45': () => tarif.includes('17h45'),
    '11h30': () => tarif.includes('11h30')
  }

  return timeChecks[heure]?.() || false
}

const checkCourseDayAndTime = (course: CourseData, tarif: string): boolean => {
  const { jour, heure } = course

  const dayChecks: Record<string, () => boolean> = {
    'Lundi': () => tarif.includes('LUNDI') && tarif.includes('Bercy'),
    'Mercredi': () => tarif.includes('MERCREDI') && checkTimeMatch(heure, tarif),
    'Jeudi': () => tarif.includes('JEUDI') && checkTimeMatch(heure, tarif),
    'Samedi': () => tarif.includes('SAMEDI') && checkTimeMatch(heure, tarif),
    'Dimanche': () => tarif.includes('DIMANCHE') && checkTimeMatch(heure, tarif)
  }

  return dayChecks[jour]?.() || false
}

const isUnlimitedOr2Courses = (tarif: string): boolean => {
  return tarif.includes('ADULTES COURS ILLIMITE/SEMAINE') || tarif.includes('ADULTES 2 COURS/SEMAINE')
}

export const filterStudentsForCourse = (course: CourseData, subscriptions: CourseSubscription[]): CourseStudent[] => {
  const courseHasAdults = hasAdultsInCourse(course, subscriptions)
  const isAdultCourseType = isAdultCourse(course)

  const students = subscriptions.filter((sub: CourseSubscription) => {
    const tarifs = Array.isArray(sub.tarif) ? sub.tarif : [sub.tarif].filter(Boolean);

    return tarifs.some((tarif: string) => {
      const tarifStr = tarif || '';
      const isUnlimited = isUnlimitedOr2Courses(tarifStr);

      if (course.jour === 'Mercredi' && course.heure === '16h15') {
        return checkCourseDayAndTime(course, tarifStr) && !tarifStr.includes('ADULTES');
      }

      if (course.jour === 'Jeudi' && course.heure === '18h00') {
        return checkCourseDayAndTime(course, tarifStr) && !tarifStr.includes('ADULTES');
      }

      if (isUnlimited && (courseHasAdults || isAdultCourseType)) {
        return true;
      }

      return checkCourseDayAndTime(course, tarifStr);
    });
  })

  return students.map((sub: CourseSubscription, index: number) => ({
    id: sub._id || `student-${index}`,
    nom: sub.nom || '',
    prenom: sub.prenom || '',
    present: false,
    photoUrl: sub.photoUrl,
    categorie: getStudentCategory(sub.tarif, sub.dateDeNaissance),
  })).sort((a: CourseStudent, b: CourseStudent) => {
    const extraA = a.isTemporary ? 1 : 0
    const extraB = b.isTemporary ? 1 : 0
    if (extraA !== extraB) return extraA - extraB

    const catA = CATEGORY_ORDER[a.categorie ?? 'enfants']
    const catB = CATEGORY_ORDER[b.categorie ?? 'enfants']
    if (catA !== catB) return catA - catB

    return a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
  })
}
