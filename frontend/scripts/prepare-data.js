#!/usr/bin/env node

/**
 * Script to prepare Full Scale dataset for the frontend dashboard.
 * Copies the 12 generated JSON entity files and validation report
 * from output/ into frontend/public/data/full/ and validates integrity.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect whether running from root or frontend directory
let projectRoot = path.resolve(__dirname, '..', '..');
if (!fs.existsSync(path.join(projectRoot, 'output'))) {
  projectRoot = path.resolve(__dirname, '..');
}

const sourceJsonDir = path.join(projectRoot, 'output', 'json');
const sourceReportPath = path.join(projectRoot, 'output', 'validation_report.json');
const targetDir = path.join(projectRoot, 'frontend', 'public', 'data', 'full');

const REQUIRED_ENTITY_FILES = [
  'applicants.json',
  'employments.json',
  'income_records.json',
  'credit_facilities.json',
  'loan_products.json',
  'loan_applications.json',
  'documents.json',
  'affordability_checks.json',
  'decisions.json',
  'repayment_schedules.json',
  'application_events.json',
  'ground_truth.json',
];

console.log('=== YottaFlex Full Scale Data Preparation ===');
console.log(`Project Root: ${projectRoot}`);
console.log(`Source JSON Dir: ${sourceJsonDir}`);
console.log(`Target Dir: ${targetDir}`);

// 1. Validate source directory exists
if (!fs.existsSync(sourceJsonDir)) {
  console.error('\n[ERROR] Full Scale dataset directory not found at:');
  console.error(sourceJsonDir);
  console.error('\nPlease generate the Full Scale dataset first using:');
  console.error('  python -m src.cli generate --scale full --seed 20261022 --out-dir output --format all');
  process.exit(1);
}

// 2. Validate all 12 required entity files exist in source
const missingFiles = REQUIRED_ENTITY_FILES.filter(
  (f) => !fs.existsSync(path.join(sourceJsonDir, f))
);

if (missingFiles.length > 0) {
  console.error('\n[ERROR] Incomplete Full Scale dataset. Missing expected files:');
  missingFiles.forEach((f) => console.error(`  - ${f}`));
  console.error('\nPlease re-run the generator:');
  console.error('  python -m src.cli generate --scale full --seed 20261022 --out-dir output --format all');
  process.exit(1);
}

// 3. Ensure target directory exists
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// 4. Copy all 12 entity files
let totalBytes = 0;
for (const file of REQUIRED_ENTITY_FILES) {
  const src = path.join(sourceJsonDir, file);
  const dst = path.join(targetDir, file);
  fs.copyFileSync(src, dst);
  const stat = fs.statSync(dst);
  totalBytes += stat.size;
  console.log(`  [OK] Copied ${file} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
}

// 5. Copy validation report if present
if (fs.existsSync(sourceReportPath)) {
  const dstReport = path.join(targetDir, 'validation_report.json');
  fs.copyFileSync(sourceReportPath, dstReport);
  console.log(`  [OK] Copied validation_report.json`);
}

// 6. Verify target directory completeness
const targetFiles = fs.readdirSync(targetDir);
const verifiedCount = REQUIRED_ENTITY_FILES.filter((f) => targetFiles.includes(f)).length;

if (verifiedCount !== 12) {
  console.error(`\n[ERROR] Verification failed: only ${verifiedCount}/12 required entity files present in target.`);
  process.exit(1);
}

console.log('\n[SUCCESS] Full Scale dataset successfully prepared and verified:');
console.log(`  - 12/12 entity JSON files verified`);
console.log(`  - Total dataset payload: ${(totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`  - Target directory: ${targetDir}`);
