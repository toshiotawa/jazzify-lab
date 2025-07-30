// PIXIのインポートをテスト
console.log('Testing PIXI imports...\n');

try {
  const PIXI = await import('pixi.js');
  console.log('✅ Default import works');
  console.log('Available exports:', Object.keys(PIXI).slice(0, 10).join(', '), '...');
} catch (e) {
  console.error('❌ Default import failed:', e.message);
}

try {
  const { Application, Container, Graphics } = await import('pixi.js');
  console.log('\n✅ Named imports work');
  console.log('Application:', typeof Application);
  console.log('Container:', typeof Container);
  console.log('Graphics:', typeof Graphics);
} catch (e) {
  console.error('\n❌ Named imports failed:', e.message);
}

// FantasyPIXIRendererのインポートをテスト
console.log('\n\nTesting FantasyPIXIRenderer imports...');
try {
  const module = await import('./src/components/fantasy/FantasyPIXIRenderer.tsx');
  console.log('✅ FantasyPIXIRenderer imports successfully');
} catch (e) {
  console.error('❌ FantasyPIXIRenderer import failed:', e.message);
}