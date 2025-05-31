#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up n8n MCP Server...');

try {
  // Install dependencies
  console.log('📦 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });
  
  // Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
    console.log('✅ Created dist directory');
  }
  
  // Check if .env file exists
  const envFile = path.join(__dirname, '.env');
  const envExample = path.join(__dirname, 'env.example');
  
  if (!fs.existsSync(envFile) && fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envFile);
    console.log('✅ Created .env file from example');
    console.log('⚠️  Please edit .env with your n8n instance details');
  } else if (!fs.existsSync(envFile)) {
    console.log('⚠️  Please create .env file with your n8n configuration');
  }
  
  // Build the project
  console.log('🔨 Building TypeScript...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('✅ Setup completed successfully!');
  console.log('');
  console.log('Next steps:');
  console.log('1. Edit .env file with your n8n instance details');
  console.log('2. Run: npm start');
  console.log('3. Or use Docker: docker-compose up');

} catch (error) {
  console.error('❌ Setup failed:', error.message);
  console.log('');
  console.log('Manual setup steps:');
  console.log('1. npm install');
  console.log('2. npm run build');
  console.log('3. Copy env.example to .env and configure');
  process.exit(1);
} 