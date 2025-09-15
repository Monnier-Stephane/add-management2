import { model, Schema, connect, disconnect } from 'mongoose';
require('dotenv').config();

// Use the same URI as the main application
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/add-academy';

const Coach = model(
  'Coach',
  new Schema({
    nom: String,
    prenom: String,
    email: String,
    statut: { type: String, enum: ['coach', 'admin'], default: 'coach' },
  })
);

async function updateStatus() {
  try {
    console.log('Connecting to MongoDB with URI:', uri);
    await connect(uri);
    console.log('Connected to MongoDB');

    // Mettre admin pour Belle Chau et Monnier Stéphane
    const result1 = await Coach.updateOne(
      { nom: 'Belle', prenom: 'Chau' },
      { $set: { statut: 'admin' } }
    );
    console.log('Belle Chau updated:', result1.modifiedCount, 'document(s)');

    const result2 = await Coach.updateOne(
      { nom: 'Monnier', prenom: 'Stéphane' },
      { $set: { statut: 'admin' } }
    );
    console.log('Monnier Stéphane updated:', result2.modifiedCount, 'document(s)');

    // Mettre coach pour tous les autres
    const result3 = await Coach.updateMany(
      {
        $nor: [
          { nom: 'Belle', prenom: 'Chau' },
          { nom: 'Monnier', prenom: 'Stéphane' },
        ],
      },
      { $set: { statut: 'coach' } }
    );
    console.log('Other coaches updated:', result3.modifiedCount, 'document(s)');

    console.log('✅ Coach status update completed successfully!');
  } catch (error) {
    console.error('❌ Error updating coach status:', error);
  } finally {
    await disconnect();
    console.log('Disconnected from MongoDB');
  }
}

updateStatus(); 