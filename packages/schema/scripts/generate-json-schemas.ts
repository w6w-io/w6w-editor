#!/usr/bin/env tsx

/**
 * Generate JSON Schemas from Zod schemas
 *
 * This script converts all Zod schemas exported from src/index.ts
 * to JSON Schema 2020-12 format and saves them to the output directory.
 *
 * Usage: npm run generate-schemas
 */

import { toJSONSchema } from 'zod';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import * as schemas from '../src/index';
import packageJson from '../package.json';

const OUTPUT_DIR = join(__dirname, '..', 'dist');
const SCHEMA_VERSION = packageJson.version;

console.log('🔄 Generating JSON Schemas from Zod schemas\n');
console.log(`📦 Package version: ${SCHEMA_VERSION}\n`);

// Ensure output directory exists
mkdirSync(OUTPUT_DIR, { recursive: true });

let generatedCount = 0;
let errors: Array<{ schema: string; error: string }> = [];

// Get all exported schemas
const schemaEntries = Object.entries(schemas);

if (schemaEntries.length === 0) {
  console.log('⚠️  No schemas found in src/index.ts');
  process.exit(0);
}

console.log(`Found ${schemaEntries.length} schema(s):\n`);

// Process each schema
for (const [name, zodSchema] of schemaEntries) {
  try {
    // Skip non-schema exports
    if (typeof zodSchema !== 'object' || !zodSchema) {
      console.log(`⏭️  ${name} - Skipping (not a Zod schema)\n`);
      continue;
    }

    // Convert Zod schema to JSON Schema using native Zod v4 function
    const jsonSchema = toJSONSchema(zodSchema as any);

    // Add W6W metadata
    const enhancedSchema = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      $id: `https://w6w.io/schemas/${name.toLowerCase()}/v${SCHEMA_VERSION}`,
      ...jsonSchema,
    };

    // Generate filename (e.g., nodeSchema -> node.json)
    const fileName = name.replace(/Schema$/, '').toLowerCase() + '.json';
    const outputPath = join(OUTPUT_DIR, fileName);

    // Write to file
    writeFileSync(outputPath, JSON.stringify(enhancedSchema, null, 2) + '\n', 'utf8');

    console.log(`✅ ${name} → ${fileName}`);
    console.log(`   $id: ${enhancedSchema.$id}\n`);

    generatedCount++;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    errors.push({ schema: name, error: errorMessage });
    console.log(`❌ ${name}`);
    console.log(`   Error: ${errorMessage}\n`);
  }
}

// Summary
console.log('─'.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Generated: ${generatedCount}/${schemaEntries.length} schema(s)`);
console.log(`   Output directory: ${OUTPUT_DIR}`);

if (errors.length > 0) {
  console.log(`   Errors: ${errors.length}`);
  console.log(`\n❌ Failed schemas:`);
  errors.forEach(({ schema, error }) => {
    console.log(`   - ${schema}: ${error}`);
  });
  process.exit(1);
} else {
  console.log(`\n✨ All schemas generated successfully!`);
  process.exit(0);
}
