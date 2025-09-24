// Configuration des groupes WhatsApp
export const WHATSAPP_GROUPS = [
  {
    id: 'presence-eleves',
    name: 'ADD Présence des élèves',
    description: 'Groupe pour les feuilles d\'appel et la présence des élèves',
    inviteLink: 'https://chat.whatsapp.com/HfmHrOnzUEL1QcVa3Hoko0',
    phoneNumber: '33123456789' // Optionnel
  }
]

// Fonction pour générer le lien WhatsApp avec le lien d'invitation
export const generateWhatsAppLink = (phoneNumber: string, message: string) => {
  const encodedMessage = encodeURIComponent(message)
  return `https://wa.me/${phoneNumber}?text=${encodedMessage}`
}

// Fonction pour générer le lien d'invitation du groupe
export const generateGroupInviteLink = (inviteLink: string, message: string) => {
  const encodedMessage = encodeURIComponent(message)
  return `${inviteLink}?text=${encodedMessage}`
}
