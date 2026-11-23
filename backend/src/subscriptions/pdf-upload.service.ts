import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf'
import * as path from 'path'
pdfjs.GlobalWorkerOptions.workerSrc = require.resolve(
  'pdfjs-dist/legacy/build/pdf.worker.js',
)
import 'multer';
const policesPdf =
  path.join(
    path.dirname(require.resolve('pdfjs-dist/package.json')),
    'standard_fonts',
  ) + path.sep

@Injectable()
export class PdfUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  private weekOfMonth(date: Date): number {
    return Math.ceil(date.getDate() / 7);
  }

  private readonly moisFr = [
    'janvier',
    'fevrier',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'aout',
    'septembre',
    'octobre',
    'novembre',
    'decembre',
  ] as const;

  private folderFor(date: Date): string {
    const year = date.getFullYear();
    const monthName = this.moisFr[date.getMonth()];
    return `feuilles-appel/${year}/${monthName}/semaine-${this.weekOfMonth(date)}`;
  }

  uploadAttendancePdf(
    file: Express.Multer.File,
    courseId: string,
    courseDate: Date,
  ): Promise<UploadApiResponse> {
    const publicId = `${courseId}-${courseDate.toISOString().slice(0, 10)}`;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: this.folderFor(courseDate),
          public_id: publicId,
          overwrite: true,
          resource_type: 'raw',
          format: 'pdf',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new InternalServerErrorException(
                    'Upload Cloudinary PDF échoué',
                  ),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });
  }

  async listAttendancePdfs() {
    type CloudinaryResource = {
      public_id: string;
      secure_url: string;
      created_at: string;
    };

    type CloudinaryListResponse = {
      resources?: CloudinaryResource[];
    };

    const [raw, images] = await Promise.all([
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: 'feuilles-appel/',
        max_results: 500,
      }) as Promise<CloudinaryListResponse>,
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: 'feuilles-appel/',
        max_results: 500,
      }) as Promise<CloudinaryListResponse>,
    ]);

    const resources = [...(raw.resources ?? []), ...(images.resources ?? [])];

    type PdfItem = {
      publicId: string;
      url: string;
      createdAt: string;
      year: string;
      month: string;
      week: string;
      label: string;
    };

    const items: PdfItem[] = resources.map((r) => {
      const parts = r.public_id.split('/');
      // feuilles-appel / 2026 / septembre / semaine-2 / samedi-16h30-2026-09-12
      const year = parts[1] ?? '';
      const month = parts[2] ?? '';
      const week = parts[3] ?? '';
      const filePart = parts[parts.length - 1] ?? r.public_id;
      return {
        publicId: r.public_id,
        url: r.secure_url,
        createdAt: r.created_at,
        year,
        month,
        week,
        label: filePart,
      };
    });

    return items;
  }
  pdfsDuMois(year: string, month: string) {
    return this.listAttendancePdfs().then((items) =>
      items.filter((item) => item.year === year && item.month === month),
    )
  }
  lignesDappel(marques: { texte: string; x: number; y: number; page: number }[]) {
    const lignes: { texte: string; x: number; y: number; page: number }[][] = []
    const tries = marques
      .filter((marque) => marque.texte.trim())
      .sort((a, b) => a.page - b.page || b.y - a.y)
  
    for (const marque of tries) {
      const derniere = lignes.at(-1)
      const memePage = derniere && derniere[0].page === marque.page
      if (memePage && Math.abs(derniere[0].y - marque.y) <= 8) {
        derniere.push({ ...marque, texte: marque.texte.trim() })
      } else {
        lignes.push([{ ...marque, texte: marque.texte.trim() }])
      }
    }
  
    const eleves: { prenom: string; nom: string; present: boolean; enPlus: boolean }[] = []
    let enPlus = false
    for (const ligne of lignes) {
      const textes = ligne
        .sort((a, b) => a.x - b.x)
        .map((marque) => marque.texte)
      const present = textes.includes('O')
      const absent = textes.includes('X')
      if (!present && !absent) {
        const titre = textes
          .join(' ')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (titre.includes('eleves en')) enPlus = true
        else if (titre === 'enfants' || titre === 'adolescents' || titre === 'adultes') enPlus = false
        continue
      }
      const noms = textes.filter((texte) => texte !== 'O' && texte !== 'X')
      if (noms.length < 2) continue
      eleves.push({
        prenom: noms[0],
        nom: noms.slice(1).join(' '),
        present,
        enPlus,
      })
    }
    return eleves
  }
async marquesDepuisPdf(buffer: Buffer) {
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    standardFontDataUrl: policesPdf,
  }).promise

  const marques: { texte: string; x: number; y: number; page: number }[] = []
  for (let page = 1; page <= doc.numPages; page++) {
    const contenu = await (await doc.getPage(page)).getTextContent()
    for (const item of contenu.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const transform = item.transform
      marques.push({
        texte: item.str,
        x: transform[4],
        y: transform[5],
        page,
      })
    }
  }
  return marques
}
async elevesDuMois(year: string, month: string) {
  const pdfs = await this.pdfsDuMois(year, month)
  const dejaLu = new Set<string>()
  const eleves: { prenom: string; nom: string; present: boolean; enPlus: boolean; cours: string }[] = []

  for (const pdf of pdfs) {
    if (dejaLu.has(pdf.label)) continue
    dejaLu.add(pdf.label)

    const reponse = await fetch(pdf.url)
    if (!reponse.ok) continue

    const buffer = Buffer.from(await reponse.arrayBuffer())
    const marques = await this.marquesDepuisPdf(buffer)
    for (const eleve of this.lignesDappel(marques)) {
      eleves.push({ ...eleve, cours: pdf.label })
    }
  }

  return eleves
}
}
