import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

// URL de connexion MongoDB depuis les variables d'environnement
const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';

async function viewAllData() {
  const client = new MongoClient(url);

  try {
    // Se connecter au serveur MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    // Accéder à la base de données
    const db = client.db();

    // Afficher toutes les souscriptions
    console.log('\nToutes les souscriptions:');
    const subscriptions = await db.collection('subscriptions').find().toArray();
    console.log(`Nombre total de souscriptions: ${subscriptions.length}`);

    subscriptions.forEach((sub, index) => {
      console.log(`\nSouscription ${index + 1}:`);
      console.log(JSON.stringify(sub, null, 2));
    });
  } catch (err) {
    console.error('Erreur lors de la connexion à MongoDB:', err);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

void viewAllData();
