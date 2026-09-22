/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Subscription,
  SubscriptionDocument,
} from './schemas/subscription.schema';
import * as csvParserModule from 'csv-parser';
import * as xlsx from 'node-xlsx';
import { Readable, Transform } from 'stream';
import { PhotoUploadService } from './photo-upload.service';

type CsvParserFn = (
  optionsOrHeaders?: unknown,
) => Transform;

const csvParser: CsvParserFn =
  typeof csvParserModule === 'function'
    ? (csvParserModule as CsvParserFn)
    : (csvParserModule as unknown as { default: CsvParserFn }).default;

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
  adultesSansDeuxCours: Array<{
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  }>;
  jeunesAdultesSansCours: Array<{
    _id: string;
    nom: string;
    prenom: string;
    email: string;
  }>;
  deletedRecords: number;
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
  tarif: string[];
  dateInscription: Date;
  statutPaiement: string;
  remarques: string;
  tailleTshirt?: string;
  dejaInscrit?: boolean;
}

const AF_COURS_VERS_TARIF: Record<string, string> = {
  'lundi 19h30': 'LUNDI 19h30 Bercy ADULTES',
  'jeudi 19h30': 'JEUDI 19h30 Paris Châtelet ADULTES',
  'sam 10h': 'SAMEDI 10h00 Paris Châtelet ADULTES',
  'samedi 10h': 'SAMEDI 10h00 Paris Châtelet ADULTES',
  'sam 16h30': 'SAMEDI 16h30 Choisy le Roi ADULTES',
  'samedi 16h30': 'SAMEDI 16h30 Choisy le Roi ADULTES',
  'sam 17h45': 'SAMEDI 17h45 Choisy le Roi ADULTES',
  'samedi 17h45': 'SAMEDI 17h45 Choisy le Roi ADULTES',
  'dim 10h': 'DIMANCHE 10h00 Choisy le Roi ADULTES',
  'dimanche 10h': 'DIMANCHE 10h00 Choisy le Roi ADULTES',
  'dim 11h30': 'DIMANCHE 11h30 Choisy le Roi ADULTES',
  'dimanche 11h30': 'DIMANCHE 11h30 Choisy le Roi ADULTES',
};


const TARIFS_JEUNES_ADULTES_CHOISY_WEEKEND = [
  'SAMEDI 16h30 Choisy le Roi ADULTES',
  'SAMEDI 17h45 Choisy le Roi ADULTES',
  'DIMANCHE 10h00 Choisy le Roi ADULTES',
  'DIMANCHE 11h30 Choisy le Roi ADULTES',
];

@Injectable()

export class CsvProcessorService {
  constructor(
    @InjectModel(Subscription.name)
    private subscriptionModel: Model<SubscriptionDocument>,
    private photoUploadService: PhotoUploadService,
  ) {}

  // ---------- Utils ----------
  private studentKey(nom: string, prenom: string): string {
    return `${nom.trim()}|${prenom.trim()}`;
  }
  private cleanTarif(tarif: string): string {
    if (!tarif) return '';
    return tarif.replace(/"\s+/g, '"').replace(/\s+"/g, '"').trim();
  }

  private toTarifArray(tarif: string): string[] {
    const t = tarif.trim();
    return t ? [t] : [];
  }
  
  private mergeTarifs(
    existing: string[] | string | undefined,
    incoming: string[],
  ): string[] {
    const prev = Array.isArray(existing)
      ? existing
      : existing
        ? [existing]
        : [];
    const merged = [...prev, ...incoming]
      .map((s) => s.trim())
      .filter(Boolean);
    return [...new Set(merged)];
  }

  private normaliserCoursAf(raw: string): string {
    return raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/h00/g, 'h')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  private parseCoursAf(cellule: string): string[] {
    return cellule
      .split(/[,;]+/)
      .map((part) => AF_COURS_VERS_TARIF[this.normaliserCoursAf(part)])
      .filter((tarif): tarif is string => Boolean(tarif));
  }

  private estForfaitJeunesAdultesChoisyWeekend(tarif: string): boolean {
    const s = this.normaliserCoursAf(tarif);
    const jeunes =
      s.includes('jeunes adultes') || s.includes('jeune adulte');
    const weekendChoisy =
      s.includes('choisy') &&
      (s.includes('sam') || s.includes('samedi')) &&
      (s.includes('dim') || s.includes('dimanche')) &&
      (s.includes('apres-midi') ||
        s.includes('aprem') ||
        s.includes('matin'));
    return jeunes && weekendChoisy;
  }

  private getCelluleAf(record: Record<string, any>): string {
    const key = Object.keys(record).find((k) =>
      String(k).toLowerCase().includes('2 cours aux choix'),
    );
    return key ? String(record[key] || '') : '';
  }

  private getCelluleCoursJeunesAdultes(record: Record<string, any>): string {
    const key = Object.keys(record).find((k) =>
      String(k)
        .toLowerCase()
        .includes('indiquer quel cours est choisi'),
    );
    return key ? String(record[key] || '') : '';
  }
  
  private resolveTarifsExcel(record: Record<string, any>): string[] {
    const brut = this.cleanTarif(
      String(record['Tarif'] || record['tarif'] || ''),
    );
    const depuisExcel = this.toTarifArray(brut);
  
    if (this.estForfaitJeunesAdultesChoisyWeekend(brut)) {
      const choisis = this.parseCoursAf(
        this.getCelluleCoursJeunesAdultes(record),
      );
      if (choisis.length > 0) {
        return [...new Set(choisis)];
      }
      return depuisExcel;
    }
  
    if (!brut.toUpperCase().includes('ADULTES 2 COURS/SEMAINE')) {
      return depuisExcel;
    }
    const depuisAf = this.parseCoursAf(this.getCelluleAf(record));
    if (depuisAf.length >= 2) {
      return [...new Set(depuisAf)];
    }
    return depuisExcel;
  }

  private doitRemplacerTarifs(incoming: string[]): boolean {
    if (incoming.length < 2) return false;
    if (incoming.some((t) => t.toUpperCase().includes('ADULTES 2 COURS/SEMAINE'))) {
      return false;
    }
    const canoniques = new Set(Object.values(AF_COURS_VERS_TARIF));
    return incoming.every((t) => canoniques.has(t));
  }

  private estUniquementCoursChoisyWeekend(incoming: string[]): boolean {
    if (incoming.length === 0) return false;
    const choisy = new Set(TARIFS_JEUNES_ADULTES_CHOISY_WEEKEND);
    return incoming.every((t) => choisy.has(t));
  }

  private estForfait2CoursSeul(incoming: string[]): boolean {
    return (
      incoming.length === 1 &&
      incoming[0].toUpperCase().includes('ADULTES 2 COURS/SEMAINE')
    );
  }
  
  private coursAdultesPrecis(
    tarifs: string[] | string | undefined,
  ): string[] {
    const canoniques = new Set(Object.values(AF_COURS_VERS_TARIF));
    const prev = Array.isArray(tarifs) ? tarifs : tarifs ? [tarifs] : [];
    return prev.filter((t) => canoniques.has(t));
  }

  private estForfaitJeunesAdultesSeul(incoming: string[]): boolean {
    return (
      incoming.length === 1 &&
      this.estForfaitJeunesAdultesChoisyWeekend(incoming[0])
    );
  }
  
  private coursChoisyWeekendPrecis(
    tarifs: string[] | string | undefined,
  ): string[] {
    const choisy = new Set(TARIFS_JEUNES_ADULTES_CHOISY_WEEKEND);
    const prev = Array.isArray(tarifs) ? tarifs : tarifs ? [tarifs] : [];
    return prev.filter((t) => choisy.has(t));
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

  private isPaidOrderStatus(raw: string | undefined): boolean {
    const s = String(raw || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  
    const negatives = [
      'non valide',
      'pas valide',
      'a valider',
      'invalide',
      'invalid',
    ];
    if (negatives.some((n) => s.includes(n))) {
      return false;
    }
  
    return /(^|[^a-z])valid(e|ee|es|er)?([^a-z]|$)/.test(s);  
  }

  private parseOuiNon(raw: string): boolean | undefined {
    const v = String(raw || '')
      .trim()
      .toLowerCase();
    if (v === 'oui') return true;
    if (v === 'non') return false;
    return undefined;
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
      deletedRecords: 0,
      adultesSansDeuxCours: [],
      jeunesAdultesSansCours: [],
    };
  }

  private async upsertRecord(
    cleanedData: CleanedData,
    results: ProcessingResult,
  ): Promise<string | undefined> {
    if (!cleanedData.email) return undefined;

    const existingRecord = await this.subscriptionModel.findOne({
      nom: cleanedData.nom,
      prenom: cleanedData.prenom,
    });

    if (existingRecord) {
      const { tarif, ...rest } = cleanedData;
      const updateData = {
        ...rest,
        dateInscription: existingRecord.dateInscription,
        tarif:
          this.doitRemplacerTarifs(tarif) ||
          this.estUniquementCoursChoisyWeekend(tarif)
            ? tarif
            : this.estForfait2CoursSeul(tarif) &&
                this.coursAdultesPrecis(existingRecord.tarif).length >= 2
              ? this.coursAdultesPrecis(existingRecord.tarif)
              : this.estForfaitJeunesAdultesSeul(tarif) &&
                  this.coursChoisyWeekendPrecis(existingRecord.tarif).length >= 1
                ? this.coursChoisyWeekendPrecis(existingRecord.tarif)
                : this.mergeTarifs(existingRecord.tarif, tarif),
      };
      await this.subscriptionModel.findByIdAndUpdate(
        existingRecord._id,
        updateData,
        { new: true },
      );
      results.updatedRecords++;
      return String(existingRecord._id);
    }

    const created = await this.subscriptionModel.create(cleanedData);
    results.newRecords++;
    results.newStudents.push({
      nom: cleanedData.nom,
      prenom: cleanedData.prenom,
      email: cleanedData.email,
    });
    return String(created._id);
  }

  private generateSummary(results: ProcessingResult): string {
    return `Processing completed: ${results.totalRecords} records processed, ${results.newRecords} new, ${results.updatedRecords} updated, ${results.deletedRecords} deleted.`;
  }

  private async handleRecords(
    records: any[],
    mapper: (r: any) => CleanedData,
    results: ProcessingResult,
    keysInFile: Set<string>,
  ) {
    for (const record of records) {
      try {
        const cleanedData = mapper(record);
        if (cleanedData.email) {
          keysInFile.add(this.studentKey(cleanedData.nom, cleanedData.prenom));
        }
        const subscriptionId = await this.upsertRecord(cleanedData, results);
        if (subscriptionId && this.estForfait2CoursSeul(cleanedData.tarif)) {
          const fiche = await this.subscriptionModel.findById(subscriptionId);
          const dejaEnBase =
            this.coursAdultesPrecis(fiche?.tarif).length >= 2;
          const dejaListe = results.adultesSansDeuxCours.some(
            (s) => s.nom === cleanedData.nom && s.prenom === cleanedData.prenom,
          );
          if (!dejaEnBase && !dejaListe) {
            results.adultesSansDeuxCours.push({
              _id: subscriptionId,
              nom: cleanedData.nom,
              prenom: cleanedData.prenom,
              email: cleanedData.email,
            });
          }
        }

        if (subscriptionId && this.estForfaitJeunesAdultesSeul(cleanedData.tarif)) {
          const ficheJa = await this.subscriptionModel.findById(subscriptionId);
          const dejaEnBaseJa =
            this.coursChoisyWeekendPrecis(ficheJa?.tarif).length >= 1;
          const dejaListeJa = results.jeunesAdultesSansCours.some(
            (s) => s.nom === cleanedData.nom && s.prenom === cleanedData.prenom,
          );
          if (!dejaEnBaseJa && !dejaListeJa) {
            results.jeunesAdultesSansCours.push({
              _id: subscriptionId,
              nom: cleanedData.nom,
              prenom: cleanedData.prenom,
              email: cleanedData.email,
            });
          }
        }
      } catch (error) {
        results.errors.push(
          `Error processing record: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        );
      }
    }
  }

  private async removeStudentsMissingFromImport(
    keysInFile: Set<string>,
    results: ProcessingResult,
  ): Promise<void> {
    if (keysInFile.size === 0) {
      return;
    }
  
    const allStudents = await this.subscriptionModel.find().exec();
  
    for (const student of allStudents) {
      const key = this.studentKey(student.nom, student.prenom);
      if (keysInFile.has(key)) {
        continue;
      }
  
      const publicId = (student as { photoPublicId?: string }).photoPublicId;
      if (publicId) {
        try {
          await this.photoUploadService.deleteStudentPhoto(publicId);
        } catch {
          results.errors.push(
            `Photo Cloudinary non supprimée pour ${student.prenom} ${student.nom}`,
          );
        }
      }
  
      await this.subscriptionModel.findByIdAndDelete(student._id);
      results.deletedRecords++;
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
      ),
      prenom: this.cleanString(
        String(record['Prénom adhérent'] || record['prénom adherent'] || record['prenomadherent'] || ''),
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
        String(record['Numéro de téléphone'] || record['telephone'] || record['numerodetelephone'] || ''),
      ),
      telephoneUrgence: this.cleanTelephone(
        String(record['TELEPHONE URGENCE '] || record['telephone urgence'] || record['telephoneurgence'] || ''),
      ),
      tarif: this.resolveTarifsExcel(record),
      dateDeNaissance: this.cleanDate(
        String(
          record['Date de naissance du pratiquants'] ||
            record['date de naissance du pratiquant'] ||
            record['datedenaissancedupratiquants'] ||
            '',
        ),
      ),
      adresse: this.cleanString(String(record['Adresse'] || record['adresse'] || '')),
      ville: this.cleanString(String(record['Ville'] || record['ville'] || '')),
      codePostal: this.cleanString(
        String(record['Code Postal'] || record['code postal'] || record['codepostal'] || ''),
      ),
      dateInscription: new Date(),
      statutPaiement: this.isPaidOrderStatus(
        String(record['Statut de la commande'] || record['statut de la commande'] || ''),
      )
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
      tailleTshirt: this.cleanString(
        String(
          record['Taille t-shirt'] ||
            record['taille t-shirt'] ||
            record['tailletshirt'] ||
            '',
        ),
      ),
      dejaInscrit: this.parseOuiNon(
        String(
          record['Etes vous déjà inscrit à Add academy Paris/Choisy'] ||
            record['etes vous déjà inscrit à add academy paris/choisy'] ||
            '',
        ),
      ),
    };
  }

  async processExcelFile(fileBuffer: Buffer): Promise<ProcessingResult> {
    const results = this.initResults();
    try {
      const jsonData = this.parseExcel(fileBuffer);
      results.totalRecords = jsonData.length;
      const keysInFile = new Set<string>();
      await this.handleRecords(jsonData, this.mapExcelRecord.bind(this), results, keysInFile);
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
        .pipe(csvParser())
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
      tarif: this.toTarifArray(this.cleanTarif(record['tarif'])),
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
      const keysInFile = new Set<string>();
      await this.handleRecords(csvData, this.mapCsvRecord.bind(this), results, keysInFile);
      results.summary = this.generateSummary(results);
    } catch (error) {
      results.errors.push(
        `General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
    return results;
  }
}
