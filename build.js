#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building n8n MCP Server...');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

try {
  // Check if TypeScript is installed
  try {
    execSync('npx tsc --version', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ TypeScript not found. Installing...');
    execSync('npm install typescript', { stdio: 'inherit' });
  }

  // Compile TypeScript
  console.log('📦 Compiling TypeScript...');
  execSync('npx tsc', { stdio: 'inherit' });
  
  console.log('✅ Build completed successfully!');
  console.log('📁 Output directory: ./dist/');
  
  // List built files
  const files = fs.readdirSync(distDir);
  console.log('📄 Built files:');
  files.forEach(file => {
    console.log(`   - ${file}`);
  });

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Create a simple JavaScript version of the server for immediate use
const serverJs = `#!/usr/bin/env node

// Simple JavaScript version of the n8n MCP Server
// This is a fallback version that can be used without TypeScript compilation

console.log('🚀 Starting n8n MCP Server (JavaScript version)...');
console.log('⚠️  For full functionality, please run: npm run build && npm start');

// Check for required environment variables
require('dotenv').config();

const requiredEnvVars = ['N8N_BASE_URL', 'N8N_API_KEY'];
const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

console.log('✅ Environment variables configured');
console.log('📡 n8n Instance:', process.env.N8N_BASE_URL);
console.log('');
console.log('To use the full MCP server:');
console.log('1. Run: npm install');
console.log('2. Run: npm run build');
console.log('3. Run: npm start');
console.log('');
console.log('Or for development: npm run dev');

// Keep the process running
setInterval(() => {
  // This is just a placeholder - the real server is in TypeScript
}, 1000);
`;

const serverJsPath = path.join(distDir, 'server.js');
fs.writeFileSync(serverJsPath, serverJs);
fs.chmodSync(serverJsPath, '755');
console.log('✅ Created fallback server.js');

console.log('');
console.log('🎉 Setup complete!');
console.log('');
console.log('Next steps:');
console.log('1. Edit .env with your n8n instance details');
console.log('2. Run: npm install');
console.log('3. Run: npm run build');
console.log('4. Run: npm start');
console.log('');
console.log('For development: npm run dev'); 