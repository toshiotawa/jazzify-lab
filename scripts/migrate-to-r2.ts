import { createClient } from '@supabase/supabase-js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

// Configuration - You'll need to set these environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';
const R2_ACCOUNT_ID = process.env.VITE_CLOUDFLARE_ACCOUNT_ID || '';
const R2_ACCESS_KEY_ID = process.env.VITE_CLOUDFLARE_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = process.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = process.env.VITE_R2_BUCKET_NAME || '';

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

async function downloadFile(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

async function uploadToR2(key: string, data: Buffer, contentType: string): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: data,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000',
  });
  
  await s3Client.send(command);
  console.log(`Uploaded to R2: ${key}`);
}

async function migrateAvatars() {
  console.log('Starting avatar migration...');
  
  // Get all profiles with avatars
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .not('avatar_url', 'is', null);
    
  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }
  
  for (const profile of profiles || []) {
    if (!profile.avatar_url) continue;
    
    try {
      // Download from Supabase
      const fileData = await downloadFile(profile.avatar_url);
      
      // Determine file extension from URL
      const ext = profile.avatar_url.includes('.png') ? 'png' : 'jpg';
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';
      
      // Upload to R2
      await uploadToR2(`avatars/${profile.id}.${ext}`, fileData, contentType);
      
      console.log(`Migrated avatar for user ${profile.id}`);
    } catch (error) {
      console.error(`Failed to migrate avatar for user ${profile.id}:`, error);
    }
  }
}

async function migrateDiaryImages() {
  console.log('Starting diary image migration...');
  
  // Get all diary entries with images
  const { data: diaries, error } = await supabase
    .from('diaries')
    .select('id, user_id, image_url')
    .not('image_url', 'is', null);
    
  if (error) {
    console.error('Error fetching diaries:', error);
    return;
  }
  
  for (const diary of diaries || []) {
    if (!diary.image_url) continue;
    
    try {
      // Download from Supabase
      const fileData = await downloadFile(diary.image_url);
      
      // Extract extension from URL
      const urlParts = diary.image_url.split('.');
      const ext = urlParts[urlParts.length - 1] || 'webp';
      const contentType = `image/${ext === 'jpg' ? 'jpeg' : ext}`;
      
      // Upload to R2
      await uploadToR2(`diary-images/${diary.user_id}/${diary.id}.${ext}`, fileData, contentType);
      
      console.log(`Migrated diary image for diary ${diary.id}`);
    } catch (error) {
      console.error(`Failed to migrate diary image for diary ${diary.id}:`, error);
    }
  }
}

async function migrateSongFiles() {
  console.log('Starting song files migration...');
  
  // Get all songs with files
  const { data: songs, error } = await supabase
    .from('songs')
    .select('id, audio_url, xml_url, json_url');
    
  if (error) {
    console.error('Error fetching songs:', error);
    return;
  }
  
  for (const song of songs || []) {
    // Migrate audio file
    if (song.audio_url) {
      try {
        const fileData = await downloadFile(song.audio_url);
        await uploadToR2(`song-files/${song.id}/audio.mp3`, fileData, 'audio/mpeg');
        console.log(`Migrated audio file for song ${song.id}`);
      } catch (error) {
        console.error(`Failed to migrate audio file for song ${song.id}:`, error);
      }
    }
    
    // Migrate XML file
    if (song.xml_url) {
      try {
        const fileData = await downloadFile(song.xml_url);
        await uploadToR2(`song-files/${song.id}/xml.xml`, fileData, 'application/xml');
        console.log(`Migrated XML file for song ${song.id}`);
      } catch (error) {
        console.error(`Failed to migrate XML file for song ${song.id}:`, error);
      }
    }
    
    // Migrate JSON file
    if (song.json_url) {
      try {
        const fileData = await downloadFile(song.json_url);
        await uploadToR2(`song-files/${song.id}/json.json`, fileData, 'application/json');
        console.log(`Migrated JSON file for song ${song.id}`);
      } catch (error) {
        console.error(`Failed to migrate JSON file for song ${song.id}:`, error);
      }
    }
  }
}

async function updateDatabaseUrls() {
  console.log('Updating database URLs to point to R2...');
  const R2_PUBLIC_URL = process.env.VITE_R2_PUBLIC_URL || 'https://jazzify-cdn.com';
  
  // Update avatar URLs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, avatar_url')
    .not('avatar_url', 'is', null);
    
  for (const profile of profiles || []) {
    if (!profile.avatar_url) continue;
    const ext = profile.avatar_url.includes('.png') ? 'png' : 'jpg';
    const newUrl = `${R2_PUBLIC_URL}/avatars/${profile.id}.${ext}`;
    
    await supabase
      .from('profiles')
      .update({ avatar_url: newUrl })
      .eq('id', profile.id);
  }
  
  // Update diary image URLs
  const { data: diaries } = await supabase
    .from('diaries')
    .select('id, user_id, image_url')
    .not('image_url', 'is', null);
    
  for (const diary of diaries || []) {
    if (!diary.image_url) continue;
    const urlParts = diary.image_url.split('.');
    const ext = urlParts[urlParts.length - 1] || 'webp';
    const newUrl = `${R2_PUBLIC_URL}/diary-images/${diary.user_id}/${diary.id}.${ext}`;
    
    await supabase
      .from('diaries')
      .update({ image_url: newUrl })
      .eq('id', diary.id);
  }
  
  // Update song file URLs
  const { data: songs } = await supabase
    .from('songs')
    .select('id, audio_url, xml_url, json_url');
    
  for (const song of songs || []) {
    const updates: any = {};
    
    if (song.audio_url) {
      updates.audio_url = `${R2_PUBLIC_URL}/song-files/${song.id}/audio.mp3`;
    }
    if (song.xml_url) {
      updates.xml_url = `${R2_PUBLIC_URL}/song-files/${song.id}/xml.xml`;
    }
    if (song.json_url) {
      updates.json_url = `${R2_PUBLIC_URL}/song-files/${song.id}/json.json`;
    }
    
    if (Object.keys(updates).length > 0) {
      await supabase
        .from('songs')
        .update(updates)
        .eq('id', song.id);
    }
  }
  
  console.log('Database URLs updated successfully!');
}

async function main() {
  console.log('Starting migration from Supabase Storage to Cloudflare R2...');
  
  // Check if all required environment variables are set
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !R2_ACCOUNT_ID || 
      !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    console.error('Missing required environment variables!');
    console.error('Please ensure all these variables are set:');
    console.error('- VITE_SUPABASE_URL');
    console.error('- VITE_SUPABASE_ANON_KEY');
    console.error('- VITE_CLOUDFLARE_ACCOUNT_ID');
    console.error('- VITE_CLOUDFLARE_ACCESS_KEY_ID');
    console.error('- VITE_CLOUDFLARE_SECRET_ACCESS_KEY');
    console.error('- VITE_R2_BUCKET_NAME');
    console.error('- VITE_R2_PUBLIC_URL');
    process.exit(1);
  }
  
  try {
    // Step 1: Migrate files
    await migrateAvatars();
    await migrateDiaryImages();
    await migrateSongFiles();
    
    // Step 2: Update database URLs
    // Uncomment this line when you're ready to switch over to R2
    // await updateDatabaseUrls();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
if (require.main === module) {
  main();
}