#!/usr/bin/env node

/**
 * Dashboard Pages Audit Report
 * Checks for common issues and patterns across all dashboard pages
 */

const fs = require('fs');
const path = require('path');

const DASHBOARD_DIR = 'web/app/dashboard';
const ISSUES = {
  missingArrayValidation: [],
  improperErrorLogging: [],
  inconsistentAPIHandling: [],
  missingFallbacks: [],
  missingTypeChecks: []
};

const issuePatterns = {
  // Missing array validation before .filter()
  filterWithoutValidation: /setData\(.*\.data\s*\|\|.*\);\s*const filtered.*\.filter/g,
  
  // Improper logger.error usage
  improperLoggerError: /logger\.error\([^,]+,\s*\{\s*error:/g,
  
  // Missing fallback arrays
  missingFallbackArray: /\.data\s*\|\|\s*\[\]/g,
  
  // Direct array operations without null check
  directArrayOps: /const\s+\w+\s*=\s*\w+\.data;\s*if\s*\(\s*\w+\s*\)\s*\{\s*\w+\.map/g
};

function scanDirectory(dir, ext = '.tsx') {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...scanDirectory(fullPath, ext));
    } else if (item.endsWith(ext)) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function checkFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = path.relative('.', filePath);
  
  let fileIssues = {};
  
  // Check for improper error logging
  const improperErrorMatches = content.match(/logger\.error\([^,]+,\s*\{[^}]*error:/g);
  if (improperErrorMatches) {
    fileIssues.improperErrorLogging = improperErrorMatches.length;
  }
  
  // Check for potential .filter() on non-array
  const filterCalls = content.match(/\.filter\s*\(/g) || [];
  const filterWithoutValidation = lines.filter(line => {
    const hasFilter = line.includes('.filter(');
    const isAfterDataFetch = lines.some(l => 
      l.includes('setData(') && l.includes('.data ||')
    );
    return hasFilter && isAfterDataFetch;
  });
  
  if (filterWithoutValidation.length > 0) {
    fileIssues.missingArrayValidation = filterWithoutValidation.length;
  }
  
  // Check for console.error without proper error handling
  const consoleErrors = (content.match(/console\.error/g) || []).length;
  const loggerErrors = (content.match(/logger\.error/g) || []).length;
  
  // Check for missing type guards
  if (content.includes('setData(') && !content.includes('Array.isArray')) {
    fileIssues.missingTypeChecks = 1;
  }
  
  return { filePath: relativePath, issues: fileIssues, filterCalls: filterCalls.length };
}

function main() {
  console.log('\n📋 Dashboard Pages Audit Report\n');
  console.log('='.repeat(70));
  
  const files = scanDirectory(DASHBOARD_DIR);
  let totalIssues = 0;
  const filesWithIssues = [];
  
  for (const file of files) {
    const result = checkFile(file);
    const issueCount = Object.values(result.issues).reduce((sum, v) => sum + (v || 0), 0);
    
    if (issueCount > 0) {
      totalIssues += issueCount;
      filesWithIssues.push(result);
    }
  }
  
  // Group by issue type
  console.log('\n🔍 Issues by Category:\n');
  
  const improperError = filesWithIssues.filter(f => f.issues.improperErrorLogging);
  const missingValidation = filesWithIssues.filter(f => f.issues.missingArrayValidation);
  const missingTypes = filesWithIssues.filter(f => f.issues.missingTypeChecks);
  
  if (improperError.length > 0) {
    console.log(`⚠️  IMPROPER ERROR LOGGING (${improperError.length} files):`);
    improperError.forEach(f => console.log(`   - ${f.filePath}`));
  }
  
  if (missingValidation.length > 0) {
    console.log(`\n⚠️  MISSING ARRAY VALIDATION (${missingValidation.length} files):`);
    missingValidation.forEach(f => console.log(`   - ${f.filePath}`));
  }
  
  if (missingTypes.length > 0) {
    console.log(`\n⚠️  MISSING TYPE CHECKS (${missingTypes.length} files):`);
    missingTypes.forEach(f => console.log(`   - ${f.filePath}`));
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`\n📊 Summary:`);
  console.log(`   • Total files scanned: ${files.length}`);
  console.log(`   • Files with issues: ${filesWithIssues.length}`);
  console.log(`   • Total issues found: ${totalIssues}\n`);
}

main();
