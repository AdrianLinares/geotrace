#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const schemaPath = resolve(process.cwd(), 'sql/schema.sql');
const schema = await readFile(schemaPath, 'utf8');
const forbidden = [
  /\bauth\.users\b/i,
  /\bauth\.uid\s*\(/i,
  /\bauth\.jwt\s*\(/i,
  /\bto\s+authenticated\b/i,
  /\bsupabase_admin\b/i,
  /\bauth_user_id\b/i,
];

const violations = forbidden.flatMap((pattern) => {
  const matches = schema.match(new RegExp(pattern.source, `${pattern.flags.replace('g', '')}g`)) ?? [];
  return matches.map((match) => `${pattern}: ${match}`);
});

if (!/CREATE TABLE public\.PERSONA\s*\(/i.test(schema) || !/\bcorreo\s+varchar\s*\(/i.test(schema)) {
  violations.push('PERSONA must keep correo as the application/AD identifier');
}

if (violations.length > 0) {
  console.error('Local schema check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log('Local schema check passed: sql/schema.sql has no Supabase Auth dependencies.');
