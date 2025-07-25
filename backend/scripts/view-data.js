const { MongoClient } = require('mongodb');

// URL de connexion MongoDB
const url = 'mongodb+srv://monnier1977:IXtkJma4j2z3Rb3h@adddatabase.wcudxw5.mongodb.net/new_data';

async function viewData() {
  const client = new MongoClient(url);

  try {
    // Se connecter au serveur MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    // Accéder à la base de données
    const db = client.db();
    
    // Obtenir la liste des collections
    const collections = await db.listCollections().toArray();
    console.log('Collections disponibles:');
    collections.forEach(collection => {
      console.log(`- ${collection.name}`);
    });

    // Afficher les 5 premiers documents de la collection subscriptions
    console.log('\n5 premières souscriptions:');
    const subscriptions = await db.collection('subscriptions').find().limit(5).toArray();
    subscriptions.forEach((sub, index) => {
      console.log(`\nSouscription ${index + 1}:`);
      console.log(JSON.stringify(sub, null, 2));
    });

    // Afficher les 5 premiers documents de la collection coaches
    console.log('\n5 premiers coachs:');
    const coaches = await db.collection('coaches').find().limit(5).toArray();
    coaches.forEach((coach, index) => {
      console.log(`\nCoach ${index + 1}:`);
      console.log(JSON.stringify(coach, null, 2));
    });

  } catch (err) {
    console.error('Erreur lors de la connexion à MongoDB:', err);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

viewData(); 