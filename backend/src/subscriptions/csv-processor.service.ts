/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';
import csv from 'csv-parser';
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

export interface ProcessingResult {
  totalRecords: number;
  newRecords: number;
  updatedRecords: number;
  errors: string[];
  summary: string;
  newStudents: Array<{ nom: string; prenom: string; email: string }>;
}

interface CleanedData {
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  telephoneUrgence?: string;
  dateDeNaissance: Date | null;
  adresse: string;
  ville: string;
  codePostal: string;
  tarif: string;
  dateInscription: Date;
  statutPaiement: string;
  remarques: string;
}

interface CourseCount {
  tarif: string;
  count: number;
}

interface StudentImportGroup {
  nom: string;
  prenom: string;
  sample: CleanedData;
  uniqueCourses: string[];
  duplicateCourseMessages: string[];
  needsChoice: boolean;
}

interface PreviewPersonBase {
  personKey: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  telephoneUrgence?: string;
  dateDeNaissance: Date | null;
  adresse: string;
  ville: string;
  codePostal: string;
  statutPaiement: string;
  remarques: string;
  warnings: string[];
}

interface ReadyToImportPerson extends PreviewPersonBase {
  courses: string[];
}

interface NeedsChoicePerson extends PreviewPersonBase {
  choiceMessage: string;
  courseOptions: string[];
}

export interface ExcelPreviewResult {
  totalRows: number;
  totalPeople: number;
  readyToImport: ReadyToImportPerson[];
  needsChoice: NeedsChoicePerson[];
}

export type CommitPerson = {
  nom: string
  prenom: string
  email: string
  telephone?: string
  telephoneUrgence?: string
  dateDeNaissance?: Date | string | null
  adresse?: string
  ville?: string
  codePostal?: string
  statutPaiement?: string
  remarques?: string
  courses: string[]
}

@Injectable()
export class CsvProcessorService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
  ) {}

  // ---------- Utils ----------
  private cleanTarif(tarif: string): string {
    if (!tarif) return '';
    return tarif.replace(/"\s+/g, '"').replace(/\s+"/g, '"').trim();
  }

  private cleanTelephone(telephone: string): string {
    if (!telephone) return '';
    let cleaned = telephone.replace(/\D/g, '');
    if (cleaned.startsWith('33') && cleaned.length === 11) {
      cleaned = '0' + cleaned.substring(2);
    }
    if (cleaned.length === 9) {
      cleaned = '0' + cleaned;
    }
    if (cleaned.length !== 10 || !cleaned.startsWith('0')) {
      return '0000000000';
    }
    return cleaned;
  }

  private cleanDate(dateString: string): Date {
    if (!dateString) return new Date();
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch {
      return new Date();
    }
  }

  private cleanString(str: string): string {
    return str ? str.trim() : '';
  }

  private analyzeNameCourseConflicts(rows: CleanedData[]): StudentImportGroup[] {
    const groups = new Map<string, CleanedData[]>();
  
    // Regroupement par nom et prénom
    for (const row of rows) {
      if (!row.nom || !row.prenom) continue;
      const key = `${row.nom}|${row.prenom}`;
      const list = groups.get(key) ?? [];
      list.push(row);
      groups.set(key, list);
    }
  
    const result: StudentImportGroup[] = [];
  
    // Analyse des cours et détection des doublons
    for (const [, personRows] of groups) {
      const sample = personRows[0];
      const counts = new Map<string, number>();
  
      for (const row of personRows) {
        const course = row.tarif?.trim();
        if (!course) continue;
        counts.set(course, (counts.get(course) ?? 0) + 1);
      }
  
      const uniqueCourses = Array.from(counts.keys());
      const duplicateCourseMessages: string[] = [];
  
      for (const [tarif, count] of counts) {
        if (count >= 2) {
          duplicateCourseMessages.push(
            `${sample.prenom} ${sample.nom} : le cours « ${tarif} » apparaît ${count} fois. Il ne sera gardé qu'une fois.`,
          );
        }
      }
  
      result.push({
        nom: sample.nom,
        prenom: sample.prenom,
        sample,
        uniqueCourses,
        duplicateCourseMessages,
        needsChoice: uniqueCourses.length >= 2,
      });
    }
  
    return result;
  }

  // ---------- Common helpers ----------
  private initResults(): ProcessingResult {
    return {
      totalRecords: 0,
      newRecords: 0,
      updatedRecords: 0,
      errors: [],
      summary: '',
      newStudents: [],
    };
  }

  private async upsertRecord(cleanedData: CleanedData, results: ProcessingResult) {
    if (!cleanedData.email) return;

    const existingRecord = await this.subscriptionModel.findOne({
      nom: cleanedData.nom,
      prenom: cleanedData.prenom,
    });

    if (existingRecord) {
      await this.subscriptionModel.findByIdAndUpdate(existingRecord._id, cleanedData, { new: true });
      results.updatedRecords++;
    } else {
      await this.subscriptionModel.create(cleanedData);
      results.newRecords++;
      results.newStudents.push({
        nom: cleanedData.nom,
        prenom: cleanedData.prenom,
        email: cleanedData.email,
      });
    }
  }

  private generateSummary(results: ProcessingResult): string {
    return `Processing completed: ${results.totalRecords} records processed, ${results.newRecords} new, ${results.updatedRecords} updated.`;
  }

  private async handleRecords(
    records: any[],
    mapper: (r: any) => CleanedData,
    results: ProcessingResult,
  ) {
    for (const record of records) {
      try {
        const cleanedData = mapper(record);
        await this.upsertRecord(cleanedData, results);
      } catch (error) {
        results.errors.push(
          `Error processing record: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  // ---------- Excel specific ----------
  private parseExcel(fileBuffer: Buffer): Record<string, string>[] {
    const workSheets = xlsx.parse(fileBuffer);
    const worksheet = workSheets[0];
    if (!worksheet || !worksheet.data) {
      throw new Error('Aucune feuille trouvée dans le fichier Excel');
    }

    const data = worksheet.data;
    const headers = data[0] as string[];
    const jsonData: Record<string, string>[] = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.length === 0) continue;
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
    return jsonData;
  }

  

  private mapExcelRecord(record: Record<string, any>) {
    return {
      nom: this.cleanString(
        String(record['Nom adhérent'] || record['nom adherent'] || record['nomadherent'] || ''),
      ).toUpperCase(),
      prenom: this.cleanString(
        String(record['Prénom adhérent'] || record['prénom adherent'] || record['prenomadherent'] || ''),
      ).toLowerCase(),
      email: this.cleanString(
        String(
          record['Email facilement joignable '] ||
            record['email facilement joignable'] ||
            record['emailfacilementjoignable'] ||
            '',
        ),
      ),
      telephone: this.cleanTelephone(
        String(record['Numéro de téléphone'] || record['telephone'] || record['numerodetelephone'] || ''),
      ),
      telephoneUrgence: this.cleanTelephone(
        String(record['TELEPHONE URGENCE '] || record['telephone urgence'] || record['telephoneurgence'] || ''),
      ),
      tarif: this.cleanTarif(String(record['Tarif'] || record['tarif'] || '')),
      dateDeNaissance: this.cleanDate(
        String(
          record['Date de naissance du pratiquants'] ||
            record['date de naissance du pratiquant'] ||
            record['datedenaissancedupratiquants'] ||
            '',
        ),
      ),
      adresse: this.cleanString(String(record['Adresse'] || record['adresse'] || '')),
      ville: this.cleanString(String(record['Ville'] || record['ville'] || ''))
        .replace(/[0-9()]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .toUpperCase(),
      codePostal: this.cleanString(
        String(record['Code Postal'] || record['code postal'] || record['codepostal'] || ''),
      ),
      dateInscription: new Date(),
      statutPaiement:
        String(record['Statut de la commande'] || record['statut de la commande'] || '').toLowerCase() ===
        'validé'
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
  }

  async previewExcelFile(fileBuffer: Buffer): Promise<ExcelPreviewResult> {
    const jsonData = this.parseExcel(fileBuffer);
    const cleaned = jsonData.map((r) => this.mapExcelRecord(r));
    const groups = this.analyzeNameCourseConflicts(cleaned);
  
    const readyToImport: ReadyToImportPerson[] = [];
    const needsChoice: NeedsChoicePerson[] = [];
  
    for (const g of groups) {
      const s = g.sample;
      const base = {
        personKey: `${g.nom}|${g.prenom}`,
        nom: g.nom,
        prenom: g.prenom,
        email: s.email,
        telephone: s.telephone,
        telephoneUrgence: s.telephoneUrgence,
        dateDeNaissance: s.dateDeNaissance,
        adresse: s.adresse,
        ville: s.ville,
        codePostal: s.codePostal,
        statutPaiement: s.statutPaiement,
        remarques: s.remarques,
        warnings: g.duplicateCourseMessages,
      };
  
      if (g.needsChoice) {
        needsChoice.push({
          ...base,
          choiceMessage: `${g.prenom} ${g.nom} apparaît sur ${g.uniqueCourses.length} cours différents. Assignez-le à 1 cours ou à plusieurs.`,
          courseOptions: g.uniqueCourses,
        });
      } else {
        readyToImport.push({
          ...base,
          courses: g.uniqueCourses,
        });
      }
    }
  
    return {
      totalRows: jsonData.length,
      totalPeople: groups.length,
      readyToImport,
      needsChoice,
    };
  }

  async commitExcel(people: CommitPerson[]): Promise<ProcessingResult> {
    const results = this.initResults()
    results.totalRecords = people.length
  
    for (const person of people) {
      if (!person.email || !person.nom || !person.prenom) {
        continue
      }
  
      const uniqueCourses = [
        ...new Set((person.courses ?? []).map((c) => c.trim()).filter(Boolean)),
      ]
  
      const payload = {
        nom: person.nom,
        prenom: person.prenom,
        email: person.email,
        telephone: person.telephone ?? '',
        telephoneUrgence: person.telephoneUrgence ?? '',
        dateDeNaissance: person.dateDeNaissance ? new Date(person.dateDeNaissance) : null,
        adresse: person.adresse ?? '',
        ville: person.ville ?? '',
        codePostal: person.codePostal ?? '',
        tarif: uniqueCourses,
        dateInscription: new Date(),
        statutPaiement: person.statutPaiement || 'en attente',
        remarques: person.remarques ?? '',
      }
  
      const existing = await this.subscriptionModel.findOne({
        nom: payload.nom,
        prenom: payload.prenom,
      })
  
      if (existing) {
        await this.subscriptionModel.findByIdAndUpdate(existing._id, payload, { new: true })
        results.updatedRecords++
      } else {
        await this.subscriptionModel.create(payload)
        results.newRecords++
        results.newStudents.push({
          nom: person.nom,
          prenom: person.prenom,
          email: person.email,
        })
      }
    }
  
    results.summary = this.generateSummary(results)
    return results
  }

  async processExcelFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results = this.initResults();
    try {
      const jsonData = this.parseExcel(fileBuffer);
      results.totalRecords = jsonData.length;
      await this.handleRecords(jsonData, this.mapExcelRecord.bind(this), results);
      results.summary = this.generateSummary(results);
    } catch (error) {
      results.errors.push(`General error: ${String(error)}`);
    }
    return results;
  }

  
  private async parseCsv(fileBuffer: Buffer): Promise<CSVRecord[]> {
    const csvData: CSVRecord[] = [];
    await new Promise<void>((resolve, reject) => {
      const stream = Readable.from(fileBuffer);
      stream
        .pipe(csv())
        .on('data', (data: CSVRecord) => csvData.push(data))
        .on('end', () => resolve())
        .on('error', reject);
    });
    return csvData;
  }

  private mapCsvRecord(record: CSVRecord) {
    return {
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
  }

  async processCSVFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results = this.initResults();
    try {
      const csvData = await this.parseCsv(fileBuffer);
      results.totalRecords = csvData.length;
      await this.handleRecords(csvData, this.mapCsvRecord.bind(this), results);
      results.summary = this.generateSummary(results);
    } catch (error) {
      results.errors.push(
        `General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
    return results;
  }
}
