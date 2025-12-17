export class CreateSubscriptionDto {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  telephoneUrgence?: string;
  dateDeNaissance: Date;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string | string[];
  statutPaiement?: string;
  remarques?: string;
}
