import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Users, Download, Eye } from 'lucide-react'
import { StudentItem } from './StudentItem'
import { AddStudentDialog } from './AddStudentDialog'
import { useState } from 'react'
import { jsPDF } from 'jspdf'


interface Student {
  id: string
  nom: string
  prenom: string
  present: boolean
  isTemporary?: boolean
}

interface Course {
  id: string
  nom: string
  jour: string
  heure: string
  lieu: string
  coach: string
  eleves: Student[]
}

interface CourseCardProps {
  course: Course
  onPresenceChange: (courseId: string, studentId: string, present: boolean) => void
  onRemoveTemporaryStudent: (courseId: string, studentId: string) => void
  onAddTemporaryStudent: (courseId: string, nom: string, prenom: string) => void
  isHighlighted?: boolean
}

export const CourseCard = ({ 
  course, 
  onPresenceChange, 
  onRemoveTemporaryStudent, 
  onAddTemporaryStudent,
  isHighlighted = false 
}: CourseCardProps) => {
  
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)
  
  const generatePDF = async (action: 'preview' | 'download' = 'download') => {
    if (isGeneratingPDF) return // Éviter les clics multiples
    
    setIsGeneratingPDF(true)
    
    try {
      // Créer un nouveau document PDF
      const doc = new jsPDF('p', 'mm', 'a4')
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      
      // Fonction pour ajouter du texte avec gestion du retour à la ligne
      const addText = (text: string, x: number, y: number, options: { fontSize?: number; align?: 'center' | 'left' | 'right' | 'justify' } = {}) => {
        const maxWidth = pageWidth - x - 20
        const lines = doc.splitTextToSize(text, maxWidth)
        doc.text(lines, x, y, options)
        return y + (lines.length * (options.fontSize || 12) * 0.4)
      }
      
      // Fonction pour dessiner un rectangle
      const drawRect = (x: number, y: number, width: number, height: number, fill: boolean = false) => {
        if (fill) {
          doc.setFillColor(240, 240, 240)
          doc.rect(x, y, width, height, 'F')
        }
        doc.setDrawColor(0, 0, 0)
        doc.rect(x, y, width, height)
      }
      
      let y = 20
      
      // En-tête avec logo et titre
      try {
        // Ajouter le logo à gauche avec taille réduite
        const logoSize = 15 // Taille réduite du logo en mm
        const logoX = 20
        const logoY = y
        
        // Charger et ajouter l'image du logo
        const logoImg = new Image()
        logoImg.crossOrigin = 'anonymous'
        logoImg.src = '/logo_add.png'
        
        // Attendre que l'image soit chargée
        await new Promise((resolve, reject) => {
          logoImg.onload = resolve
          logoImg.onerror = reject
        })
        
        // Redimensionner l'image avant de l'ajouter (optimisation)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const maxSize = 150 // Taille maximale en pixels (augmentée)
        
        // Calculer les nouvelles dimensions
        const ratio = Math.min(maxSize / logoImg.width, maxSize / logoImg.height)
        canvas.width = logoImg.width * ratio
        canvas.height = logoImg.height * ratio
        
        // Dessiner l'image redimensionnée
        ctx?.drawImage(logoImg, 0, 0, canvas.width, canvas.height)
        
        // Convertir en base64 avec compression PNG (meilleure qualité)
        const compressedImageData = canvas.toDataURL('image/png', 0.9) // Compression PNG à 90%
        
        // Ajouter l'image compressée au PDF
        doc.addImage(compressedImageData, 'PNG', logoX, logoY, logoSize, logoSize)
        
      } catch (error) {
        console.warn('Impossible de charger le logo:', error)
      }
      
      // Titre à droite du logo
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      const titleX = 50 // Position après le logo
      doc.text(course.nom, titleX, y + 15) // y + 15 pour centrer verticalement avec le logo
      
      y += 20
      
      // Informations du cours - Centrées
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      const infoText = `Lieu: ${course.lieu} | Coach: ${course.coach} | Date: ${new Date().toLocaleDateString('fr-FR')}`
      const infoWidth = doc.getTextWidth(infoText)
      const infoX = (pageWidth - infoWidth) / 2
      doc.text(infoText, infoX, y)
      y += 20
      
      // Ligne de séparation
      doc.setLineWidth(0.5)
      doc.line(20, y, pageWidth - 20, y)
      y += 10
      
      // Titre de la section
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      y = addText('Liste des élèves', 20, y)
      y += 10
      
      // Tableau avec colonnes modifiées
      const colWidths = [35, 35, 25, 25] // Prénom, Nom, Présent, Absent
      const rowHeight = 10
      const tableWidth = colWidths.reduce((sum, width) => sum + width, 0)
      const tableStartX = (pageWidth - tableWidth) / 2
      
      // En-tête du tableau
      let currentX = tableStartX
      const headers = ['Prénom', 'Nom', 'Présent', 'Absent']
      
      // Dessiner l'en-tête avec fond gris
      drawRect(currentX, y, tableWidth, rowHeight, true)
      
      headers.forEach((header, index) => {
        const cellWidth = colWidths[index]
        drawRect(currentX, y, cellWidth, rowHeight)
        doc.setFontSize(11)
        doc.setFont('helvetica', 'bold')
        const headerX = currentX + (cellWidth / 2)
        doc.text(header, headerX, y + 6, { align: 'center' })
        currentX += cellWidth
      })
      
      y += rowHeight
      
      // Lignes des élèves avec distinction visuelle
      const sortedStudents = [...course.eleves].sort((a, b) => 
        a.prenom.localeCompare(b.prenom, 'fr', { sensitivity: 'base' })
      )
      
      sortedStudents.forEach((eleve) => {
        // Vérifier si on a besoin d'une nouvelle page
        if (y + rowHeight > pageHeight - 20) {
          doc.addPage()
          y = 20
        }
        
        currentX = tableStartX
        
        // Dessiner la ligne
        drawRect(currentX, y, tableWidth, rowHeight)
        
        // Prénom
        drawRect(currentX, y, colWidths[0], rowHeight)
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        
        // Gérer le retour à la ligne pour le prénom
        const prenomLines = doc.splitTextToSize(eleve.prenom, colWidths[0] - 4) // -4 pour la marge
        const prenomY = y + (rowHeight / 2) - ((prenomLines.length - 1) * 2) // Centrer verticalement
        doc.text(prenomLines, currentX + 2, prenomY)
        currentX += colWidths[0]
        
        // Nom
        drawRect(currentX, y, colWidths[1], rowHeight)
        
        // Gérer le retour à la ligne pour le nom
        const nomLines = doc.splitTextToSize(eleve.nom, colWidths[1] - 4) // -4 pour la marge
        const nomY = y + (rowHeight / 2) - ((nomLines.length - 1) * 2) // Centrer verticalement
        doc.text(nomLines, currentX + 2, nomY)
        currentX += colWidths[1]
        
        // Présent - avec symbole plus gros
        drawRect(currentX, y, colWidths[2], rowHeight)
        doc.setFontSize(16) // Plus gros
        doc.setFont('helvetica', 'bold')
        
        if (eleve.present) {
          // Présent - O
          doc.setTextColor(0, 128, 0) // Vert
          doc.text('O', currentX + colWidths[2]/2, y + 7, { align: 'center' })
        }
        // Sinon, laisser la case vide
        
        currentX += colWidths[2]
        
        // Absent - avec symbole plus gros
        drawRect(currentX, y, colWidths[3], rowHeight)
        doc.setFontSize(16) // Plus gros
        doc.setFont('helvetica', 'bold')
        
        if (!eleve.present) {
          // Absent - X
          doc.setTextColor(200, 0, 0) // Rouge
          doc.text('X', currentX + colWidths[3]/2, y + 7, { align: 'center' })
        }
        // Sinon, laisser la case vide
        
        // Remettre la couleur noire pour la suite
        doc.setTextColor(0, 0, 0)
        
        y += rowHeight
      })
      
      y += 20
      
      // Résumé avec meilleure mise en page
      if (y + 40 > pageHeight - 20) {
        doc.addPage()
        y = 20
      }
      
      // Ligne de séparation avant le résumé
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
      
      // Présents en vert
      doc.setTextColor(0, 128, 0)
      y = addText(`Présents: ${course.eleves.filter(e => e.present).length}`, 20, y)
      
      // Absents en rouge
      doc.setTextColor(200, 0, 0)
      y = addText(`Absents: ${course.eleves.filter(e => !e.present).length}`, 20, y)
      
      // Remettre la couleur noire
      doc.setTextColor(0, 0, 0)
      
      // Action selon le paramètre
      const filename = `feuille-appel-${course.nom.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`
      
      if (action === 'preview') {
        // Pour la visualisation, utiliser bloburl au lieu de dataurlnewwindow
        const pdfBlob = doc.output('blob')
        const pdfUrl = URL.createObjectURL(pdfBlob)
        
        // Ouvrir dans un nouvel onglet
        const newWindow = window.open(pdfUrl, '_blank')
        if (!newWindow) {
          alert('Veuillez autoriser les popups pour visualiser le PDF')
        }
        
        // Nettoyer l'URL après un délai
        setTimeout(() => {
          URL.revokeObjectURL(pdfUrl)
        }, 1000)
      } else {
        // Télécharger directement avec compression
        doc.save(filename)
      }
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error)
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.')
    } finally {
      setIsGeneratingPDF(false)
    }
  }


  return (
    <Card className={`w-full ${isHighlighted ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {course.nom}
          </CardTitle>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {course.lieu}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.coach}
            </div>
          </div>
        </div>
        <Badge variant="outline">
          {course.eleves.length} élèves
        </Badge>
      </div>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        {course.eleves.map(eleve => (
          <StudentItem 
            key={eleve.id} 
            eleve={eleve} 
            course={course}
            onPresenceChange={onPresenceChange}
            onRemoveTemporaryStudent={onRemoveTemporaryStudent}
          />
        ))}
      </div>
      
      {/* Bouton pour ajouter un élève temporaire */}
      <div className="mt-4 pt-4 border-t">
        <AddStudentDialog 
          course={course} 
          onAddStudent={onAddTemporaryStudent}
        />
      </div>
      
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mt-4 pt-4 border-t gap-3">
        <div className="text-sm text-gray-600">
          {course.eleves.filter(e => e.present).length} / {course.eleves.length} présents
        </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => generatePDF('preview')} 
              size="sm" 
              variant="outline"
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Eye className="h-4 w-4" />
              {isGeneratingPDF ? 'Génération...' : 'Visualiser'}
            </Button>
            <Button 
              onClick={() => generatePDF('download')} 
              size="sm" 
              disabled={isGeneratingPDF}
              className="flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Download className="h-4 w-4" />
              {isGeneratingPDF ? 'Génération...' : 'Télécharger'}
            </Button>
          </div>
      </div>
    </CardContent>

  </Card>
)
}