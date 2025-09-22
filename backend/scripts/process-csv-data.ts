/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { MongoClient } from 'mongodb';
import fs from 'fs';
import csv from 'csv-parser';
import dotenv from 'dotenv';

dotenv.config();

// URL de connexion MongoDB depuis les variables d'environnement
const url = process.env.MONGODB_URL || 'mongodb://localhost:27017/test';

// Fonction pour nettoyer les tarifs
function cleanTarif(tarif: string | undefined): string {
  if (!tarif) return '';
  // Nettoyage sécurisé des espaces autour des guillemets
  return tarif
    .replace(/"\s+/g, '"') // Espaces après guillemets ouvrants
    .replace(/\s+"/g, '"') // Espaces avant guillemets fermants
    .trim();
}

// Fonction pour nettoyer et valider les numéros de téléphone
function cleanTelephone(telephone: string | undefined): string {
  if (!telephone) return '';
  let cleaned = telephone.replace(/\D/g, '');
  if (cleaned.startsWith('33') && cleaned.length === 11) {
    cleaned = '0' + cleaned.substring(2);
  }
  if (cleaned.length === 10 && cleaned.startsWith('0')) {
    return cleaned;
  }
  if (cleaned.length === 9) {
    cleaned = '0' + cleaned;
  }
  if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
    console.warn(`Numéro de téléphone invalide: ${telephone} -> ${cleaned}`);
    return '0000000000';
  }
  return cleaned;
}

// Fonction pour nettoyer les dates
function cleanDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Date invalide: ${dateString}, utilisation de null`);
      return null;
    }
    return date;
  } catch {
    console.warn(
      `Erreur de parsing de date: ${dateString}, utilisation de null`,
    );
    return null;
  }
}

// Fonction pour nettoyer les chaînes de caractères
function cleanString(str: string | undefined): string {
  if (!str) return '';
  return str.trim();
}

// Fonction utilitaire pour normaliser les clés
function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/\s+/g, '') // retire tous les espaces
    .replace(/[’'"]/g, '') // retire les apostrophes et guillemets
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // retire les accents
}

// Fonction pour traiter le fichier CSV
async function processCSVFile(csvFilePath: string) {
  const client = new MongoClient(url);
  const results: any[] = [];

  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvFilePath)
        .pipe(csv())
        .on('data', (data: Record<string, string>) => {
          // Création d'un objet avec des clés normalisées
          const normalizedData: Record<string, string> = {};
          for (const key in data) {
            normalizedData[normalizeKey(key)] = data[key];
          }

          const cleanedData = {
            nom: cleanString(normalizedData['nomadherent']),
            prenom: cleanString(normalizedData['prenomadherent']),
            email: cleanString(normalizedData['emailfacilementjoignable']),
            telephone: cleanTelephone(normalizedData['numerodetelephone']),
            telephoneUrgence: cleanTelephone(
              normalizedData['telephoneurgence'],
            ),
            dateDeNaissance: cleanDate(
              normalizedData['datedenaissancedupratiquants'],
            ),
            adresse: cleanString(normalizedData['adresse']),
            ville: cleanString(normalizedData['ville']),
            codePostal: cleanString(normalizedData['codepostal']),
            tarif: cleanTarif(normalizedData['tarif']),
            nomPayeur: cleanString(normalizedData['nompayeur']),
            prenomPayeur: cleanString(normalizedData['prenompayeur']),
            emailPayeur: cleanString(normalizedData['emailpayeur']),
            dateInscription: new Date(),
            statutPaiement:
              normalizedData['statutdelacommande'] &&
              normalizedData['statutdelacommande'].toLowerCase() === 'validé'
                ? 'payé'
                : 'en attente',
            remarques: cleanString(
              normalizedData['commentaireshorsligne'] || '',
            ),
          };

          // Ignorer les lignes sans email
          if (!cleanedData.email) {
            console.warn('Ligne ignorée : email manquant');
            return;
          }

          results.push(cleanedData);
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`${results.length} enregistrements lus depuis le CSV`);
    console.log(
      'Données prêtes à insérer ou mettre à jour dans MongoDB :',
      results.slice(0, 3),
    ); // Affiche les 3 premiers pour vérif

    // Se connecter à MongoDB
    await client.connect();
    console.log('Connecté à la base de données MongoDB');

    const db = client.db('parisChoisy');

    // Insérer ou mettre à jour les données nettoyées (gestion des doublons)
    if (results.length > 0) {
      const operations = results.map((cleanedData: any) => ({
        updateOne: {
          filter: { email: cleanedData.email as string },
          update: { $set: cleanedData },
          upsert: true,
        },
      }));
      const result = await db.collection('subscriptions').bulkWrite(operations);
      console.log(
        `${result.upsertedCount} nouveaux enregistrements insérés, ${result.modifiedCount} enregistrements mis à jour.`,
      );
    } else {
      console.log('Aucun enregistrement à insérer.');
    }
  } catch (error) {
    console.error('Erreur lors du traitement:', error);
  } finally {
    await client.close();
    console.log('Connexion fermée');
  }
}

// Fonction principale
async function main() {
  const csvFilePath = process.argv[2];

  if (!csvFilePath) {
    console.error('Usage: node process-csv-data.js <chemin_vers_fichier.csv>');
    process.exit(1);
  }

  if (!fs.existsSync(csvFilePath)) {
    console.error(`Le fichier ${csvFilePath} n'existe pas`);
    process.exit(1);
  }

  console.log(`Traitement du fichier: ${csvFilePath}`);
  await processCSVFile(csvFilePath);
}

void main().catch(console.error);
