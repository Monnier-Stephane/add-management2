import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// URL de connexion MongoDB depuis les variables d'environnement
const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';

async function insertTestData() {
  const client = new MongoClient(url);

  try {
    // Se connecter au serveur MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    // Accéder à la base de données
    const db = client.db();

    // Fonction utilitaire pour créer une souscription
    const createSubscription = (data: {
      nom: string;
      prenom: string;
      email: string;
      telephone: string;
      dateDeNaissance: string;
      adresse: string;
      ville: string;
      codePostal: string;
      tarif: string;
      statutPaiement: 'payé' | 'en attente';
      remarques: string;
    }) => ({
      nom: data.nom,
      prenom: data.prenom,
      email: data.email,
      telephone: data.telephone,
      dateDeNaissance: new Date(data.dateDeNaissance),
      adresse: data.adresse,
      ville: data.ville,
      codePostal: data.codePostal,
      tarif: data.tarif,
      dateInscription: new Date(),
      statutPaiement: data.statutPaiement,
      remarques: data.remarques,
    });

    // Données de test pour les souscriptions
    const subscriptionsData = [
      createSubscription({
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '0123456789',
        dateDeNaissance: '1990-01-15',
        adresse: '123 Rue Principale',
        ville: 'Paris',
        codePostal: '75001',
        tarif: '100€',
        statutPaiement: 'payé',
        remarques: 'Client régulier',
      }),
      createSubscription({
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@example.com',
        telephone: '0678901234',
        dateDeNaissance: '1985-05-20',
        adresse: '456 Avenue des Fleurs',
        ville: 'Lyon',
        codePostal: '69001',
        tarif: '90€',
        statutPaiement: 'en attente',
        remarques: 'Première inscription',
      }),
      createSubscription({
        nom: 'Leroy',
        prenom: 'Thomas',
        email: 'thomas.leroy@example.com',
        telephone: '0712345678',
        dateDeNaissance: '1992-10-08',
        adresse: '789 Boulevard des Arts',
        ville: 'Marseille',
        codePostal: '13001',
        tarif: '120€',
        statutPaiement: 'payé',
        remarques: 'Inscrit pour 6 mois',
      }),
      createSubscription({
        nom: 'Petit',
        prenom: 'Julie',
        email: 'julie.petit@example.com',
        telephone: '0654321098',
        dateDeNaissance: '1988-12-03',
        adresse: '321 Rue du Commerce',
        ville: 'Bordeaux',
        codePostal: '33000',
        tarif: '80€',
        statutPaiement: 'en attente',
        remarques: '',
      }),
      createSubscription({
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'pierre.bernard@example.com',
        telephone: '0698765432',
        dateDeNaissance: '1978-07-25',
        adresse: '654 Avenue de la République',
        ville: 'Lille',
        codePostal: '59000',
        tarif: '110€',
        statutPaiement: 'payé',
        remarques: 'Renouvellement annuel',
      }),
    ];

    // Fonction utilitaire pour créer un coach
    const createCoach = (nom: string, prenom: string, email: string) => ({
      nom,
      prenom,
      email,
    });

    // Données de test pour les coachs
    const coachesData = [
      createCoach('Dubois', 'Michel', 'michel.dubois@example.com'),
      createCoach('Garcia', 'Maria', 'maria.garcia@example.com'),
      createCoach('Roux', 'Antoine', 'antoine.roux@example.com'),
      createCoach('Moreau', 'Isabelle', 'isabelle.moreau@example.com'),
      createCoach('Simon', 'Laurent', 'laurent.simon@example.com'),
    ];

    // Insérer les données de test
    const resultSubscriptions = await db
      .collection('subscriptions')
      .insertMany(subscriptionsData);
    console.log(`${resultSubscriptions.insertedCount} souscriptions insérées`);

    const resultCoaches = await db
      .collection('coaches')
      .insertMany(coachesData);
    console.log(`${resultCoaches.insertedCount} coachs insérés`);
  } catch (err) {
    console.error("Erreur lors de l'insertion des données:", err);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

void insertTestData();
