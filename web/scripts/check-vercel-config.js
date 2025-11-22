#!/usr/bin/env node

/**
 * Vercel Environment Variables Setup Checker
 * 
 * This script checks if all required environment variables are properly configured
 * and provides instructions for setting them up in Vercel.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('\n🔍 Checking Vercel Deployment Configuration...\n');

// Check .env file
const envPath = join(__dirname, '..', '.env');
const envExists = existsSync(envPath);

if (!envExists) {
  console.log('❌ .env file not found!');
  console.log('   Create a .env file with the following variables:\n');
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://[your-project].supabase.co');
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]\n');
  process.exit(1);
}

// Read .env file
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim();
    if (key && value) {
      envVars[key] = value;
    }
  }
});

console.log('✅ .env file found\n');

// Check required variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
];

let allPresent = true;
const varsToCopy = [];

console.log('📋 Environment Variables Status:\n');

requiredVars.forEach(varName => {
  if (envVars[varName]) {
    console.log(`   ✅ ${varName}`);
    const maskedValue = envVars[varName].substring(0, 20) + '...';
    console.log(`      Value: ${maskedValue}\n`);
    varsToCopy.push({ name: varName, value: envVars[varName] });
  } else {
    console.log(`   ❌ ${varName} - MISSING!\n`);
    allPresent = false;
  }
});

if (!allPresent) {
  console.log('⚠️  Some required variables are missing from .env file\n');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('📝 NEXT STEP: Add these to Vercel Dashboard\n');
console.log('   1. Go to: https://vercel.com/[your-username]/[project]/settings/environment-variables\n');
console.log('   2. Add each variable below for ALL environments:');
console.log('      - ✅ Production');
console.log('      - ✅ Preview');
console.log('      - ✅ Development\n');
console.log('   3. Copy and paste these exact values:\n');

varsToCopy.forEach(({ name, value }) => {
  console.log(`   Variable Name: ${name}`);
  console.log(`   Variable Value: ${value}\n`);
});

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('🚀 After adding variables to Vercel:\n');
console.log('   Option 1: Re-run the GitHub Actions workflow');
console.log('   Option 2: Deploy manually with: npx vercel --prod\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Check vercel.json
const vercelJsonPath = join(__dirname, '..', 'vercel.json');
if (existsSync(vercelJsonPath)) {
  console.log('✅ vercel.json found and configured\n');
} else {
  console.log('⚠️  vercel.json not found (optional but recommended)\n');
}

console.log('✨ Configuration check complete!\n');
