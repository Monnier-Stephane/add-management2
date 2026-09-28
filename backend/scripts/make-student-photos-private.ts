import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function listPublicPhotos(): Promise<string[]> {
  const ids: string[] = [];
  let nextCursor: string | undefined;

  do {
    const page = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'student-photos',
      resource_type: 'image',
      max_results: 100,
      next_cursor: nextCursor,
    });

    for (const resource of page.resources) {
      ids.push(resource.public_id);
    }

    nextCursor = page.next_cursor;
  } while (nextCursor);

  return ids;
}

async function main() {
  const ids = await listPublicPhotos();
  console.log(`${ids.length} photo(s) à basculer`);

  for (const publicId of ids) {
    await cloudinary.uploader.rename(publicId, publicId, {
      resource_type: 'image',
      type: 'upload',
      to_type: 'authenticated',
      overwrite: true,
      invalidate: true,
    });
    console.log('basculée :', publicId);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});