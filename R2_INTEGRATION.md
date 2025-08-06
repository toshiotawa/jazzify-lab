# Cloudflare R2 Integration

This document describes the integration of Cloudflare R2 for file storage in the Jazz Learning Game application.

## Overview

The application now uses Cloudflare R2 instead of Supabase Storage for storing:
- User avatar images
- Diary entry images
- Song files (audio, XML, JSON)

## Environment Variables

The following environment variables are required for R2 integration:

```bash
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_ACCESS_KEY_ID=your_access_key_id
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_access_key
VITE_R2_BUCKET_NAME=your_bucket_name
VITE_R2_PUBLIC_URL=https://jazzify-cdn.com
```

## File Structure in R2

Files are organized in the following structure:

```
bucket/
├── avatars/
│   └── {userId}.{jpg|png}
├── diary-images/
│   └── {userId}/
│       └── {diaryId}.{jpg|jpeg|png|webp}
└── song-files/
    └── {songId}/
        ├── audio.mp3
        ├── xml.xml
        └── json.json
```

## Implementation Details

### 1. R2 Storage Service (`src/platform/r2Storage.ts`)

This service handles all R2 operations using the AWS SDK v3 (S3-compatible):
- `uploadAvatarToR2()` - Uploads user avatars
- `uploadDiaryImageToR2()` - Uploads diary images
- `uploadSongFileToR2()` - Uploads song files
- `deleteAvatarFromR2()` - Deletes user avatars
- `deleteDiaryImageFromR2()` - Deletes diary images
- `deleteSongFilesFromR2()` - Deletes all files for a song

### 2. Updated Storage Service (`src/platform/supabaseStorage.ts`)

The existing storage service has been updated to use R2 functions while maintaining the same API:
- All upload/delete functions now delegate to R2 storage
- Legacy Supabase functions are preserved but not used

### 3. Migration Script (`scripts/migrate-to-r2.ts`)

A migration script is provided to move existing files from Supabase to R2:

```bash
# Run the migration
npx ts-node scripts/migrate-to-r2.ts
```

The script:
1. Downloads all files from Supabase Storage
2. Uploads them to R2 with the correct structure
3. Optionally updates database URLs (commented out by default)

## Benefits of R2

1. **Cost-effective**: R2 offers generous free tier and lower costs
2. **Performance**: Global CDN through custom domain
3. **S3 Compatible**: Uses standard AWS SDK
4. **No egress fees**: Unlike traditional cloud storage

## Cache Control

Files are served with appropriate cache headers:
- Avatars: 1 year cache
- Diary images: 30 days cache
- Song files: 1 year cache

## Troubleshooting

### Common Issues

1. **Upload fails with credentials error**
   - Verify all environment variables are set correctly
   - Check R2 API token has correct permissions

2. **Files not accessible via public URL**
   - Ensure custom domain is configured in R2 dashboard
   - Verify bucket allows public access

3. **Migration script fails**
   - Check Supabase credentials are correct
   - Ensure R2 bucket exists
   - Verify network connectivity

### Testing R2 Connection

You can test the R2 connection by uploading a test file:

```typescript
import { uploadAvatarToR2 } from '@/platform/r2Storage';

const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
const url = await uploadAvatarToR2(testFile, 'test-user-id');
console.log('Uploaded to:', url);
```

## Security Considerations

1. **API Keys**: Never expose R2 credentials in client-side code
2. **CORS**: Configure appropriate CORS rules in R2 dashboard
3. **Access Control**: Use presigned URLs for sensitive content (if needed)

## Future Enhancements

1. Image optimization before upload
2. Automatic format conversion (e.g., to WebP)
3. Thumbnail generation for images
4. CDN cache purging API integration