const { MongoClient } = require('mongodb');

// URL de connexion MongoDB
const url = 'mongodb+srv://monnier1977:IXtkJma4j2z3Rb3h@adddatabase.wcudxw5.mongodb.net/new_data';

// Le nom exact de la collection
const COLLECTION_NAME = 'subscriptions'; // avec un 's' à la fin

async function viewCollectionData() {
  const client = new MongoClient(url);

  try {
    // Se connecter au serveur MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    // Accéder à la base de données
    const db = client.db();
    
    // Obtenir la liste des collections pour vérifier le nom exact
    const collections = await db.listCollections().toArray();
    console.log('Collections disponibles:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });
    
    // Afficher toutes les données de la collection spécifiée
    console.log(`\nDonnées de la collection '${COLLECTION_NAME}':`);
    const items = await db.collection(COLLECTION_NAME).find().toArray();
    console.log(`Nombre total d'éléments: ${items.length}`);
    
    items.forEach((item, index) => {
      console.log(`\nÉlément ${index + 1}:`);
      console.log(JSON.stringify(item, null, 2));
    });

  } catch (err) {
    console.error('Erreur lors de la connexion à MongoDB:', err);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

viewCollectionData(); 