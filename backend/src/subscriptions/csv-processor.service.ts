/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';
import * as csv from 'csv-parser';
import * as xlsx from 'node-xlsx';
import { Readable } from 'stream';

interface CSVRecord {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  dateDeNaissance: string;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string;
  remarques?: string;
}

interface ProcessingResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  summary: string;
  newStudents: Array<{ nom: string; prenom: string; email: string }>;
}

@Injectable()
export class CsvProcessorService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // Clean tariff values (remove spaces in quotes)
  private cleanTarif(tarif: string): string {
    if (!tarif) return '';
    return tarif.replace(/"\s+/g, '"').replace(/\s+"/g, '"').trim();
  }

  // Clean and validate phone numbers
  private cleanTelephone(telephone: string): string {
    if (!telephone) return '';
    
    let cleaned = telephone.replace(/\D/g, '');
    
    // Convert international numbers
    if (cleaned.startsWith('33') && cleaned.length === 11) {
      cleaned = '0' + cleaned.substring(2);
    }
    
    // Add 0 if needed
    if (cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    
    // Final validation
    if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
      return '0000000000';
    }
    
    return cleaned;
  }

  // Clean date strings
  private cleanDate(dateString: string): Date {
    if (!dateString) return new Date();
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date();
      }
      return date;
    } catch {
      return new Date();
    }
  }

  // Clean string values
  private cleanString(str: string): string {
    return str ? str.trim() : '';
  }

  // Process Excel file using node-xlsx
  async processExcelFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      errors: [],
      summary: '',
      newStudents: [],
    };

    try {
      // Parse Excel file
      const workSheets = xlsx.parse(fileBuffer);
      const worksheet = workSheets[0];

      if (!worksheet || !worksheet.data) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }

      const data = worksheet.data;
      const headers = data[0] as string[];
      const jsonData: any[] = [];

      // Convert to array of objects
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row.length === 0) continue; // Skip empty rows

        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          if (header && row[index] !== undefined) {
            rowData[header] = String(row[index] || '');
          }
        });

        if (Object.keys(rowData).length > 0) {
          jsonData.push(rowData);
        }
      }

      results.totalRecords = jsonData.length;
      results.newStudents = [];

      // Process each record
      // Ligne 133
      for (const record of jsonData as Record<string, any>[]) {
        try {
          const cleanedData = {
            nom: this.cleanString(
              String(
                record['Nom adhérent'] ||
                  record['nom adherent'] ||
                  record['nomadherent'] ||
                  '',
              ),
            ),
            prenom: this.cleanString(
              String(
                record['Prénom adhérent'] ||
                  record['prénom adherent'] ||
                  record['prenomadherent'] ||
                  '',
              ),
            ),
            email: this.cleanString(
              String(
                record['Email facilement joignable '] ||
                  record['email facilement joignable'] ||
                  record['emailfacilementjoignable'] ||
                  '',
              ),
            ),
            telephone: this.cleanTelephone(
              String(
                record['Numéro de téléphone'] ||
                  record['telephone'] ||
                  record['numerodetelephone'] ||
                  '',
              ),
            ),
            telephoneUrgence: this.cleanTelephone(
              String(
                record['TELEPHONE URGENCE '] ||
                  record['telephone urgence'] ||
                  record['telephoneurgence'] ||
                  '',
              ),
            ),
            tarif: this.cleanTarif(
              String(record['Tarif'] || record['tarif'] || ''),
            ),
            dateDeNaissance: this.cleanDate(
              String(
                record['Date de naissance du pratiquants'] ||
                  record['date de naissance du pratiquant'] ||
                  record['datedenaissancedupratiquants'] ||
                  '',
              ),
            ),
            adresse: this.cleanString(
              String(record['Adresse'] || record['adresse'] || ''),
            ),
            ville: this.cleanString(
              String(record['Ville'] || record['ville'] || ''),
            ),
            codePostal: this.cleanString(
              String(
                record['Code Postal'] ||
                  record['code postal'] ||
                  record['codepostal'] ||
                  '',
              ),
            ),
            dateInscription: new Date(),
            statutPaiement:
              String(
                record['Statut de la commande'] ||
                  record['statut de la commande'] ||
                  '',
              ).toLowerCase() === 'validé'
                ? 'payé'
                : 'en attente',
            remarques: this.cleanString(
              String(
                record['Commentaires (Hors ligne)'] ||
                  record['commentaires hors ligne'] ||
                  record['commentaireshorsligne'] ||
                  '',
              ),
            ),
          };

          if (!cleanedData.email) {
            continue;
          }

          // Check if record already exists (by nom + prenom to avoid same person duplicates)
          const existingRecord = await this.subscriptionModel.findOne({
            nom: cleanedData.nom,
            prenom: cleanedData.prenom,
          });

          if (existingRecord) {
            // Update existing record
            await this.subscriptionModel.findByIdAndUpdate(
              existingRecord._id,
              cleanedData,
              { new: true },
            );
            results.updatedRecords++;
          } else {
            // Create new record
            await this.subscriptionModel.create(cleanedData);
            results.newRecords++;
            // Add to new students list
            results.newStudents.push({
              nom: cleanedData.nom,
              prenom: cleanedData.prenom,
              email: cleanedData.email
            });
          }
        } catch (error) {
          results.errors.push(
            `Error for ${record.email}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        }
      }

      // Generate summary
      results.summary = `Processing completed: ${results.totalRecords} records processed, ${results.newRecords} new, ${results.updatedRecords} updated.`;
    } catch (error) {
      results.errors.push(`General error: ${String(error)}`);
    }

    return results;
  }

  // Process CSV file (existing method)
  async processCSVFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      errors: [],
      summary: '',
      newStudents: [],
    };

    try {
      const csvData: CSVRecord[] = [];
      
      // Parse CSV
      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(fileBuffer);
        stream
          .pipe(csv())
          .on('data', (data: CSVRecord) => {
            csvData.push(data);
          })
          .on('end', () => resolve())
          .on('error', reject);
      });

      results.totalRecords = csvData.length;

      // Process each record
      for (const record of csvData) {
        try {
          const cleanedData = {
            nom: this.cleanString(record['nom adherent']),
            prenom: this.cleanString(record['prénom adherent']),
            email: this.cleanString(record['email facilement joignable']),
            telephone: this.cleanTelephone(record['telephone']),
            telephoneUrgence: this.cleanTelephone(record['telephone urgence']),
            tarif: this.cleanTarif(record['tarif']),
            dateDeNaissance: null,
            adresse: '',
            ville: '',
            codePostal: '',
            dateInscription: new Date(),
            statutPaiement: 'en attente',
            remarques: '',
          };

          if (!cleanedData.email) {
            continue;
          }

          // Check if record already exists (by nom + prenom to avoid same person duplicates)
          const existingRecord = await this.subscriptionModel.findOne({ 
            nom: cleanedData.nom,
            prenom: cleanedData.prenom,
          });

          if (existingRecord) {
            // Update existing record
            await this.subscriptionModel.findByIdAndUpdate(
              existingRecord._id,
              cleanedData,
              { new: true },
            );
            results.updatedRecords++;
          } else {
            // Create new record
            await this.subscriptionModel.create(cleanedData);
            results.newRecords++;
            // Add to new students list
            results.newStudents.push({
              nom: cleanedData.nom,
              prenom: cleanedData.prenom,
              email: cleanedData.email
            });
          }
        } catch (error) {
          results.errors.push(`Error for ${record.email}: ${String(error)}`);
        }
      }

      // Generate summary
      results.summary = `Processing completed: ${results.totalRecords} records processed, ${results.newRecords} new, ${results.updatedRecords} updated.`;
    } catch (error) {
      results.errors.push(
        `General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }

    return results;
  }
}
