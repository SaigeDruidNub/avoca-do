#!/usr/bin/env node

/**
 * Utility script to help with Next.js chunk loading issues
 * Run this script when you encounter ChunkLoadError
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Next.js Chunk Error Fix Utility');
console.log('==================================');

const projectRoot = process.cwd();
const nextDir = path.join(projectRoot, '.next');

// 1. Clear Next.js build cache
console.log('1. Clearing Next.js build cache...');
try {
  if (fs.existsSync(nextDir)) {
    fs.rmSync(nextDir, { recursive: true, force: true });
    console.log('✅ .next directory cleared');
  } else {
    console.log('ℹ️  .next directory not found');
  }
} catch (error) {
  console.log('❌ Error clearing .next directory:', error.message);
}

// 2. Clear npm cache
console.log('\n2. Clearing npm cache...');
try {
  execSync('npm cache clean --force', { stdio: 'inherit' });
  console.log('✅ npm cache cleared');
} catch (error) {
  console.log('❌ Error clearing npm cache:', error.message);
}

// 3. Clear browser cache instructions
console.log('\n3. Browser Cache Instructions:');
console.log('📋 For Chrome:');
console.log('   - Press F12 to open DevTools');
console.log('   - Right-click the refresh button');
console.log('   - Select "Empty Cache and Hard Reload"');
console.log('\n📋 For Firefox:');
console.log('   - Press Ctrl+Shift+R (hard refresh)');
console.log('   - Or go to about:preferences#privacy and clear data');

// 4. Restart development server
console.log('\n4. Restarting development server...');
try {
  console.log('⚡ Starting Next.js development server...');
  execSync('npm run dev', { stdio: 'inherit' });
} catch (error) {
  console.log('❌ Error starting development server:', error.message);
  console.log('\n🔧 Manual steps to restart:');
  console.log('   1. Stop any running processes: taskkill /F /IM node.exe');
  console.log('   2. Start development server: npm run dev');
}

console.log('\n🎉 Chunk error fix complete!');
console.log('\n💡 If you still see chunk errors:');
console.log('   - Try incognito/private browsing mode');
console.log('   - Check if ngrok URL has changed');
console.log('   - Restart your browser completely');
console.log('   - Check for JavaScript errors in browser console');