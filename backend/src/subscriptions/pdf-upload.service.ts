import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import 'multer';

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
                : new InternalServerErrorException('Upload Cloudinary PDF échoué'),
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
    const [raw, images] = await Promise.all([
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'raw',
        prefix: 'feuilles-appel/',
        max_results: 500,
      }),
      cloudinary.api.resources({
        type: 'upload',
        resource_type: 'image',
        prefix: 'feuilles-appel/',
        max_results: 500,
      }),
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
}