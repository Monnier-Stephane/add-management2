import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Subscription, SubscriptionDocument } from './schemas/subscription.schema';
import * as csv from 'csv-parser';
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
}

@Injectable()
export class CsvProcessorService {
  constructor(
    @InjectModel(Subscription.name) private subscriptionModel: Model<SubscriptionDocument>,
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

  // Process CSV file
  async processCSVFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results: ProcessingResult = {
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      errors: [],
      summary: ''
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
            adresse: "",
            ville: "",
            codePostal: "",
            dateInscription: new Date(),
            statutPaiement: 'en attente',
            remarques: ""
          };

          if (!cleanedData.email) {
            continue;
          }

          // Check if record already exists (by email)
          const existingRecord = await this.subscriptionModel.findOne({ 
            email: cleanedData.email 
          });

          if (existingRecord) {
            // Update existing record
            await this.subscriptionModel.findByIdAndUpdate(
              existingRecord._id,
              cleanedData,
              { new: true }
            );
            results.updatedRecords++;
          } else {
            // Create new record
            await this.subscriptionModel.create(cleanedData);
            results.newRecords++;
          }

        } catch (error) {
          results.errors.push(`Error for ${record.email}: ${error.message}`);
        }
      }

      // Generate summary
      results.summary = `Processing completed: ${results.totalRecords} records processed, ${results.newRecords} new, ${results.updatedRecords} updated.`;

    } catch (error) {
      results.errors.push(`General error: ${error.message}`);
    }

    return results;
  }
}