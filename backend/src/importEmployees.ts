import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as XLSXNS from 'xlsx';

import { connectDb } from './mongo.js';
import { Employee } from './models.js';

function normalizeEmail(email: unknown) {
  return String(email || '').trim().toLowerCase();
}

function normalizeString(value: unknown) {
  return String(value ?? '').trim();
}

function pick(row: Record<string, unknown>, key: string) {
  return row[key] ?? row[key.trim()] ?? row[key.toLowerCase()] ?? row[key.toUpperCase()];
}

function readHeader(row: Record<string, unknown>, header: string) {
  const direct = pick(row, header);
  if (direct !== undefined) return direct;

  // fuzzy match (case-insensitive)
  const wanted = header.trim().toLowerCase();
  const foundKey = Object.keys(row).find((k) => k.trim().toLowerCase() === wanted);
  return foundKey ? row[foundKey] : undefined;
}

async function main() {
  const XLSX = (XLSXNS as unknown as { default?: any })?.default || (XLSXNS as unknown as any);
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Load server/.env reliably
  dotenv.config({ path: path.resolve(__dirname, '..', '.env') });
  dotenv.config();

  const excelPathArg = process.argv[2];
  const defaultExcelPath = path.resolve(__dirname, '..', 'Book20.xlsx');
  const excelPath = path.resolve(process.cwd(), excelPathArg || defaultExcelPath);

  console.log(`Importing employees from: ${excelPath}`);

  await connectDb();

  const workbook = XLSX.readFile(excelPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in Excel file');

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' }) as Record<string, unknown>[];

  let upserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const employeeNumber = normalizeString(readHeader(row, 'Employee Number'));
    const employeeName = normalizeString(readHeader(row, 'Employee Name'));
    const designation = normalizeString(readHeader(row, 'Curr.Designation'));
    const email = normalizeEmail(readHeader(row, 'Email'));
    const phone = normalizeString(readHeader(row, 'Phone'));
    const managerEmail = normalizeEmail(readHeader(row, 'Manager Email Id'));
    const managerEmployeeNo = normalizeString(readHeader(row, 'Manager Employee No'));
    const managerEmployeeName = normalizeString(readHeader(row, 'Manager Employee Name'));
    const impactLevel = normalizeString(readHeader(row, 'Impact Level'));

    if (!email || !employeeNumber || !employeeName) {
      skipped += 1;
      continue;
    }

    await Employee.findOneAndUpdate(
      { email },
      {
        employeeNumber,
        employeeName,
        designation,
        email,
        phone,
        managerEmail,
        managerEmployeeNo,
        managerEmployeeName,
        impactLevel,
      },
      { upsert: true, new: true }
    );

    upserted += 1;
  }

  console.log(`Done. Upserted=${upserted} Skipped=${skipped}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Import failed:', err);
  process.exit(1);
});
