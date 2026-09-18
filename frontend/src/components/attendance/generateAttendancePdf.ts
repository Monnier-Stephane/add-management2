import { jsPDF } from 'jspdf'
import { CATEGORY_ORDER, type StudentCategory } from '@/lib/utils/studentCategory'

export interface AttendancePdfStudent {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
  categorie?: StudentCategory
}

export interface AttendancePdfCourse {
  nom: string
  lieu: string
  coach: string
  eleves: AttendancePdfStudent[]
}

export const isExtraStudent = (eleve: AttendancePdfStudent) =>
  Boolean(eleve.isTemporary) || eleve.id.startsWith('temp-')

const getSectionKey = (eleve: AttendancePdfStudent) =>
  isExtraStudent(eleve) ? 'extra' : (eleve.categorie ?? 'enfants')

const getSectionLabel = (key: string) => {
  if (key === 'adolescents') return 'Adolescents'
  if (key === 'adultes') return 'Adultes'
  if (key === 'extra') return 'Élèves en +'
  return 'Enfants'
}

export async function buildAttendancePdf(course: AttendancePdfCourse) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const addText = (
    text: string,
    x: number,
    y: number,
    options: { fontSize?: number; align?: 'center' | 'left' | 'right' | 'justify' } = {},
  ) => {
    const maxWidth = pageWidth - x - 20
    const lines = doc.splitTextToSize(text, maxWidth)
    doc.text(lines, x, y, options)
    return y + lines.length * (options.fontSize || 12) * 0.4
  }

  const drawRect = (
    x: number,
    y: number,
    width: number,
    height: number,
    fill: boolean = false,
  ) => {
    if (fill) {
      doc.setFillColor(240, 240, 240)
      doc.rect(x, y, width, height, 'F')
    }
    doc.setDrawColor(0, 0, 0)
    doc.rect(x, y, width, height)
  }

  let y = 20

  try {
    const logoSize = 15
    const logoX = 20
    const logoY = y

    const logoImg = new Image()
    logoImg.crossOrigin = 'anonymous'
    logoImg.src = '/logo_add.png'

    await new Promise((resolve, reject) => {
      logoImg.onload = resolve
      logoImg.onerror = reject
    })

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const maxSize = 150
    const ratio = Math.min(maxSize / logoImg.width, maxSize / logoImg.height)
    canvas.width = logoImg.width * ratio
    canvas.height = logoImg.height * ratio
    ctx?.drawImage(logoImg, 0, 0, canvas.width, canvas.height)

    const compressedImageData = canvas.toDataURL('image/png', 0.9)
    doc.addImage(compressedImageData, 'PNG', logoX, logoY, logoSize, logoSize)
  } catch (error) {
    console.warn('Impossible de charger le logo:', error)
  }

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text(course.nom, 50, y + 15)

  y += 20

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  const infoText = `Lieu: ${course.lieu} | Coach: ${course.coach} | Date: ${new Date().toLocaleDateString('fr-FR')}`
  const infoWidth = doc.getTextWidth(infoText)
  doc.text(infoText, (pageWidth - infoWidth) / 2, y)
  y += 20

  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)
  y += 10

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  y = addText('Liste des élèves', 20, y)
  y += 10

  const colWidths = [35, 35, 25, 25]
  const rowHeight = 10
  const tableWidth = colWidths.reduce((sum, width) => sum + width, 0)
  const tableStartX = (pageWidth - tableWidth) / 2

  let currentX = tableStartX
  const headers = ['Prénom', 'Nom', 'Présent', 'Absent']

  drawRect(currentX, y, tableWidth, rowHeight, true)

  headers.forEach((header, index) => {
    const cellWidth = colWidths[index]
    drawRect(currentX, y, cellWidth, rowHeight)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text(header, currentX + cellWidth / 2, y + 6, { align: 'center' })
    currentX += cellWidth
  })

  y += rowHeight

  const sortedStudents = [...course.eleves].sort((a, b) => {
    const extraA = isExtraStudent(a) ? 1 : 0
    const extraB = isExtraStudent(b) ? 1 : 0
    if (extraA !== extraB) return extraA - extraB
  
    const catA = CATEGORY_ORDER[a.categorie ?? 'enfants']
    const catB = CATEGORY_ORDER[b.categorie ?? 'enfants']
    if (catA !== catB) return catA - catB
  
    return a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
  })

  const headerHeight = 8

sortedStudents.forEach((eleve, index) => {
  const sectionKey = getSectionKey(eleve)
  const previous = sortedStudents[index - 1]
  const showHeader = !previous || getSectionKey(previous) !== sectionKey

  if (y + rowHeight + (showHeader ? headerHeight : 0) > pageHeight - 20) {
    doc.addPage()
    y = 20
  }

  if (showHeader) {
    if (sectionKey === 'adolescents') doc.setFillColor(186, 230, 253)
    else if (sectionKey === 'adultes') doc.setFillColor(233, 213, 255)
    else if (sectionKey === 'extra') doc.setFillColor(255, 179, 102)
    else doc.setFillColor(243, 244, 246)

    doc.setDrawColor(0)
    doc.rect(tableStartX, y, tableWidth, headerHeight, 'FD')
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(0)
    doc.text(getSectionLabel(sectionKey), tableStartX + 3, y + 5.5)
    y += headerHeight
  }

  currentX = tableStartX
  const isExtra = isExtraStudent(eleve)

  const paintCell = (x: number, w: number) => {
    if (isExtra) {
      doc.setFillColor('#FFB366')
      doc.rect(x, y, w, rowHeight, 'FD')
    } else if (eleve.categorie === 'adolescents') {
      doc.setFillColor(224, 242, 254)
      doc.rect(x, y, w, rowHeight, 'FD')
    } else if (eleve.categorie === 'adultes') {
      doc.setFillColor(243, 232, 255)
      doc.rect(x, y, w, rowHeight, 'FD')
    } else {
      drawRect(x, y, w, rowHeight)
    }
  }

  paintCell(currentX, colWidths[0])
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(isExtra ? '#C2410C' : '#000000')

  const prenomAffiche = eleve.prenom
  const prenomLines = doc.splitTextToSize(prenomAffiche, colWidths[0] - 4)
  const prenomY = y + rowHeight / 2 - (prenomLines.length - 1) * 2
  doc.text(prenomLines, currentX + 2, prenomY)
  currentX += colWidths[0]

  paintCell(currentX, colWidths[1])
  const nomLines = doc.splitTextToSize(eleve.nom, colWidths[1] - 4)
  const nomY = y + rowHeight / 2 - (nomLines.length - 1) * 2
  doc.text(nomLines, currentX + 2, nomY)
  currentX += colWidths[1]

  paintCell(currentX, colWidths[2])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  if (eleve.present) {
    doc.setTextColor(0, 128, 0)
    doc.text('O', currentX + colWidths[2] / 2, y + 7, { align: 'center' })
  }
  currentX += colWidths[2]

  paintCell(currentX, colWidths[3])
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  if (!eleve.present) {
    doc.setTextColor(200, 0, 0)
    doc.text('X', currentX + colWidths[3] / 2, y + 7, { align: 'center' })
  }

  doc.setTextColor(0, 0, 0)
  y += rowHeight
})

  y += 20

  if (y + 40 > pageHeight - 20) {
    doc.addPage()
    y = 20
  }

  doc.setLineWidth(0.5)
  doc.line(20, y, pageWidth - 20, y)
  y += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  y = addText('Résumé', 20, y)
  y += 5

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  y = addText(`Total élèves: ${course.eleves.length}`, 20, y)

  doc.setTextColor(0, 128, 0)
  y = addText(`Présents: ${course.eleves.filter((e) => e.present).length}`, 20, y)

  doc.setTextColor(200, 0, 0)
  y = addText(`Absents: ${course.eleves.filter((e) => !e.present).length}`, 20, y)

  const nbExtra = course.eleves.filter(isExtraStudent).length
  if (nbExtra > 0) {
    doc.setTextColor('#C2410C')
    y = addText(`Non inscrits : ${nbExtra}`, 20, y)
  }

  doc.setTextColor(0, 0, 0)
  return doc
}
