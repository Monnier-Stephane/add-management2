export class CreateSubscriptionDto {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateDeNaissance: Date;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string;
  statutPaiement?: string;
  remarques?: string;
}
