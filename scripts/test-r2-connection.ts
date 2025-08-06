import { 
  uploadAvatarToR2,
  uploadDiaryImageToR2,
  uploadSongFileToR2,
  deleteAvatarFromR2,
  deleteDiaryImageFromR2,
  deleteSongFilesFromR2
} from '../src/platform/r2Storage';

// Test data
const testUserId = 'test-user-123';
const testDiaryId = 'test-diary-456';
const testSongId = 'test-song-789';

async function createTestFile(content: string, filename: string, mimeType: string): Promise<File> {
  const blob = new Blob([content], { type: mimeType });
  return new File([blob], filename, { type: mimeType });
}

async function testAvatarUpload() {
  console.log('\n=== Testing Avatar Upload ===');
  try {
    const avatarFile = await createTestFile(
      'test avatar content',
      'avatar.jpg',
      'image/jpeg'
    );
    
    const url = await uploadAvatarToR2(avatarFile, testUserId);
    console.log('✓ Avatar uploaded successfully:', url);
    
    // Test deletion
    await deleteAvatarFromR2(testUserId);
    console.log('✓ Avatar deleted successfully');
    
    return true;
  } catch (error) {
    console.error('✗ Avatar test failed:', error);
    return false;
  }
}

async function testDiaryImageUpload() {
  console.log('\n=== Testing Diary Image Upload ===');
  try {
    const imageFile = await createTestFile(
      'test diary image content',
      'diary-image.webp',
      'image/webp'
    );
    
    const url = await uploadDiaryImageToR2(imageFile, testUserId, testDiaryId);
    console.log('✓ Diary image uploaded successfully:', url);
    
    // Test deletion
    await deleteDiaryImageFromR2(testUserId, testDiaryId);
    console.log('✓ Diary image deleted successfully');
    
    return true;
  } catch (error) {
    console.error('✗ Diary image test failed:', error);
    return false;
  }
}

async function testSongFilesUpload() {
  console.log('\n=== Testing Song Files Upload ===');
  try {
    // Test audio file
    const audioFile = await createTestFile(
      'test audio content',
      'song.mp3',
      'audio/mpeg'
    );
    const audioUrl = await uploadSongFileToR2(audioFile, testSongId, 'audio');
    console.log('✓ Audio file uploaded successfully:', audioUrl);
    
    // Test XML file
    const xmlFile = await createTestFile(
      '<?xml version="1.0"?><musicxml>test</musicxml>',
      'score.xml',
      'application/xml'
    );
    const xmlUrl = await uploadSongFileToR2(xmlFile, testSongId, 'xml');
    console.log('✓ XML file uploaded successfully:', xmlUrl);
    
    // Test JSON file
    const jsonFile = await createTestFile(
      '{"test": "data"}',
      'data.json',
      'application/json'
    );
    const jsonUrl = await uploadSongFileToR2(jsonFile, testSongId, 'json');
    console.log('✓ JSON file uploaded successfully:', jsonUrl);
    
    // Test deletion
    await deleteSongFilesFromR2(testSongId);
    console.log('✓ Song files deleted successfully');
    
    return true;
  } catch (error) {
    console.error('✗ Song files test failed:', error);
    return false;
  }
}

async function verifyEnvironmentVariables() {
  console.log('\n=== Verifying Environment Variables ===');
  const required = [
    'VITE_CLOUDFLARE_ACCOUNT_ID',
    'VITE_CLOUDFLARE_ACCESS_KEY_ID',
    'VITE_CLOUDFLARE_SECRET_ACCESS_KEY',
    'VITE_R2_BUCKET_NAME',
    'VITE_R2_PUBLIC_URL'
  ];
  
  let allPresent = true;
  for (const varName of required) {
    const value = process.env[varName];
    if (!value) {
      console.error(`✗ Missing: ${varName}`);
      allPresent = false;
    } else {
      console.log(`✓ Found: ${varName}`);
    }
  }
  
  return allPresent;
}

async function main() {
  console.log('Starting R2 Connection Test...');
  
  // Check environment variables
  if (!verifyEnvironmentVariables()) {
    console.error('\n❌ Missing required environment variables. Please check your .env file.');
    process.exit(1);
  }
  
  // Run tests
  const results = await Promise.all([
    testAvatarUpload(),
    testDiaryImageUpload(),
    testSongFilesUpload()
  ]);
  
  // Summary
  const allPassed = results.every(result => result);
  console.log('\n=== Test Summary ===');
  console.log(`Avatar Upload: ${results[0] ? '✓ Passed' : '✗ Failed'}`);
  console.log(`Diary Image Upload: ${results[1] ? '✓ Passed' : '✗ Failed'}`);
  console.log(`Song Files Upload: ${results[2] ? '✓ Passed' : '✗ Failed'}`);
  
  if (allPassed) {
    console.log('\n✅ All tests passed! R2 integration is working correctly.');
  } else {
    console.log('\n❌ Some tests failed. Please check the error messages above.');
    process.exit(1);
  }
}

// Run tests if this is the main module
if (require.main === module) {
  main().catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
}