import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import 'multer';

@Injectable()
export class PhotoUploadService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  uploadStudentPhoto(
    file: Express.Multer.File,
    studentId: string,
  ): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'student-photos',
          public_id: studentId,
          overwrite: true,
          resource_type: 'image',
          type: 'authenticated',
        },
        (error, result) => {
          if (error || !result) {
            reject(
              error instanceof Error
                ? error
                : new InternalServerErrorException('Upload Cloudinary échoué'),
            );
            return;
          }
          resolve(result);
        },
      );
      stream.end(file.buffer);
    });
  }
  async deleteStudentPhoto(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId, { type: 'authenticated' });
  }

  signedPhotoUrl(publicId: string, size = 400, version?: number): string {
    const expiresAt = Math.floor(Date.now() / 1000) + 3 * 60 * 60;
  
    return cloudinary.url(publicId, {
      type: 'authenticated',
      sign_url: true,
      secure: true,
      expires_at: expiresAt,
      version,
      transformation: [
        {
          width: size,
          height: size,
          crop: 'fill',
          gravity: 'face',
          fetch_format: 'auto',
          quality: 'auto',
        },
      ],
    });
  }
}
