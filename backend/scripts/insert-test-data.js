const { MongoClient } = require('mongodb');

// URL de connexion MongoDB
const url = 'mongodb+srv://monnier1977:IXtkJma4j2z3Rb3h@adddatabase.wcudxw5.mongodb.net/new_data';

async function insertTestData() {
  const client = new MongoClient(url);

  try {
    // Se connecter au serveur MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    // Accéder à la base de données
    const db = client.db();
    
    // Données de test pour les souscriptions
    const subscriptionsData = [
      {
        nom: 'Dupont',
        prenom: 'Jean',
        email: 'jean.dupont@example.com',
        telephone: '0123456789',
        dateDeNaissance: new Date('1990-01-15'),
        adresse: '123 Rue Principale',
        ville: 'Paris',
        codePostal: '75001',
        tarif: '100€',
        dateInscription: new Date(),
        statutPaiement: 'payé',
        remarques: 'Client régulier'
      },
      {
        nom: 'Martin',
        prenom: 'Sophie',
        email: 'sophie.martin@example.com',
        telephone: '0678901234',
        dateDeNaissance: new Date('1985-05-20'),
        adresse: '456 Avenue des Fleurs',
        ville: 'Lyon',
        codePostal: '69001',
        tarif: '90€',
        dateInscription: new Date(),
        statutPaiement: 'en attente',
        remarques: 'Première inscription'
      },
      {
        nom: 'Leroy',
        prenom: 'Thomas',
        email: 'thomas.leroy@example.com',
        telephone: '0712345678',
        dateDeNaissance: new Date('1992-10-08'),
        adresse: '789 Boulevard des Arts',
        ville: 'Marseille',
        codePostal: '13001',
        tarif: '120€',
        dateInscription: new Date(),
        statutPaiement: 'payé',
        remarques: 'Inscrit pour 6 mois'
      },
      {
        nom: 'Petit',
        prenom: 'Julie',
        email: 'julie.petit@example.com',
        telephone: '0654321098',
        dateDeNaissance: new Date('1988-12-03'),
        adresse: '321 Rue du Commerce',
        ville: 'Bordeaux',
        codePostal: '33000',
        tarif: '80€',
        dateInscription: new Date(),
        statutPaiement: 'en attente',
        remarques: ''
      },
      {
        nom: 'Bernard',
        prenom: 'Pierre',
        email: 'pierre.bernard@example.com',
        telephone: '0698765432',
        dateDeNaissance: new Date('1978-07-25'),
        adresse: '654 Avenue de la République',
        ville: 'Lille',
        codePostal: '59000',
        tarif: '110€',
        dateInscription: new Date(),
        statutPaiement: 'payé',
        remarques: 'Renouvellement annuel'
      }
    ];

    // Données de test pour les coachs
    const coachesData = [
      {
        nom: 'Dubois',
        prenom: 'Michel',
        email: 'michel.dubois@example.com'
      },
      {
        nom: 'Garcia',
        prenom: 'Maria',
        email: 'maria.garcia@example.com'
      },
      {
        nom: 'Roux',
        prenom: 'Antoine',
        email: 'antoine.roux@example.com'
      },
      {
        nom: 'Moreau',
        prenom: 'Isabelle',
        email: 'isabelle.moreau@example.com'
      },
      {
        nom: 'Simon',
        prenom: 'Laurent',
        email: 'laurent.simon@example.com'
      }
    ];

    // Insérer les données de test
    const resultSubscriptions = await db.collection('subscriptions').insertMany(subscriptionsData);
    console.log(`${resultSubscriptions.insertedCount} souscriptions insérées`);

    const resultCoaches = await db.collection('coaches').insertMany(coachesData);
    console.log(`${resultCoaches.insertedCount} coachs insérés`);

  } catch (err) {
    console.error('Erreur lors de l\'insertion des données:', err);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

insertTestData(); 