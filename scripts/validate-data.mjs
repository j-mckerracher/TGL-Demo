#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import Ajv from 'ajv';

/**
 * Data Validation Script for TGL Results Explorer
 *
 * Validates a manifest and all its referenced series files against
 * JSON schemas using Ajv.
 *
 * Usage:
 *   node scripts/validate-data.mjs [--manifest <path>] [--series-root <dir>] [--help]
 *
 * Examples:
 *   node scripts/validate-data.mjs
 *   node scripts/validate-data.mjs --manifest src/assets/data/manifest.json
 *   node scripts/validate-data.mjs --manifest /tmp/manifest.json --series-root /tmp/data
 *
 * Exit codes:
 *   0 = all validations passed
 *   1 = one or more validation errors found
 *   2 = usage error or missing file
 */

const args = process.argv.slice(2);
let manifestPath = 'src/assets/data/manifest.json';
let seriesRoot = null;
let failFast = false;

// Parse CLI arguments
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--help' || args[i] === '-h') {
    printHelp();
    process.exit(0);
  } else if (args[i] === '--manifest' && i + 1 < args.length) {
    manifestPath = args[++i];
  } else if (args[i] === '--series-root' && i + 1 < args.length) {
    seriesRoot = args[++i];
  } else if (args[i] === '--fail-fast') {
    failFast = true;
  } else {
    console.error(`Unknown option: ${args[i]}`);
    printHelp();
    process.exit(2);
  }
}

/**
 * Load and parse a JSON file
 */
function loadJsonFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in ${filePath}: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Load JSON schema from file and normalize $schema reference
 */
function loadSchema(schemaPath) {
  try {
    const schema = loadJsonFile(schemaPath);
    // Remove $schema reference to avoid Ajv requiring external schema resolution
    // We validate the structure locally, which is sufficient for our use case
    delete schema.$schema;
    return schema;
  } catch (error) {
    throw new Error(`Failed to load schema from ${schemaPath}: ${error.message}`);
  }
}

/**
 * Format validation errors for human readability
 */
function formatErrors(filePath, errors) {
  if (!errors || errors.length === 0) {
    return [];
  }

  return errors.map((err) => {
    const path = err.instancePath || '/';
    const keyword = err.keyword;
    const message = err.message || 'validation failed';
    const details =
      err.params && Object.keys(err.params).length > 0
        ? ` (${JSON.stringify(err.params)})`
        : '';
    return `  ${filePath}${path}: [${keyword}] ${message}${details}`;
  });
}

/**
 * Main validation routine
 */
async function validate() {
  try {
    // Load schemas
    console.log('Loading schemas...');
    const manifestSchema = loadSchema('docs/data/manifest.schema.json');
    const seriesSchema = loadSchema('docs/data/seriesfile.schema.json');

    // Initialize Ajv with permissive settings for forward compatibility
    const ajv = new Ajv({
      strict: false,
      allErrors: true,
      allowUnionTypes: true,
    });

    // Compile validators
    const validateManifest = ajv.compile(manifestSchema);
    const validateSeries = ajv.compile(seriesSchema);

    // Load and validate manifest
    console.log(`Loading manifest: ${manifestPath}`);
    let manifest;
    try {
      manifest = loadJsonFile(manifestPath);
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(2);
    }

    const manifestErrors = [];
    if (!validateManifest(manifest)) {
      manifestErrors.push(...formatErrors(manifestPath, validateManifest.errors));
    }

    if (manifestErrors.length > 0) {
      console.error('\n❌ Manifest validation failed:');
      manifestErrors.forEach((err) => console.error(err));
      if (failFast) {
        process.exit(1);
      }
    } else {
      console.log('✓ Manifest is valid');
    }

    // Determine series root directory
    if (!seriesRoot) {
      seriesRoot = dirname(manifestPath);
    }

    // Validate series files
    if (!manifest.seriesIndex || manifest.seriesIndex.length === 0) {
      console.log('⚠ No series index entries found in manifest.');
      if (manifestErrors.length === 0) {
        console.log('\n✓ All validations passed');
        process.exit(0);
      } else {
        process.exit(1);
      }
    }

    console.log(`\nValidating ${manifest.seriesIndex.length} series file(s)...`);
    const seriesErrors = [];
    const validSeriesCount = { count: 0 };

    for (const entry of manifest.seriesIndex) {
      const seriesFile = entry.file;
      const seriesPath = resolve(seriesRoot, seriesFile);

      try {
        const series = loadJsonFile(seriesPath);
        if (!validateSeries(series)) {
          seriesErrors.push(...formatErrors(seriesPath, validateSeries.errors));
          if (failFast) {
            break;
          }
        } else {
          validSeriesCount.count++;
        }
      } catch (error) {
        seriesErrors.push(`  ${seriesPath}: ${error.message}`);
        if (failFast) {
          break;
        }
      }
    }

    if (seriesErrors.length > 0) {
      console.error('\n❌ Series validation failed:');
      seriesErrors.forEach((err) => console.error(err));
    } else {
      console.log(`✓ All ${validSeriesCount.count} series file(s) are valid`);
    }

    // Summary
    const totalErrors = manifestErrors.length + seriesErrors.length;
    if (totalErrors === 0) {
      console.log('\n✓ All validations passed');
      process.exit(0);
    } else {
      console.error(`\n❌ Validation failed with ${totalErrors} error(s)`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`Fatal error: ${error.message}`);
    process.exit(2);
  }
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Usage: node scripts/validate-data.mjs [OPTIONS]

Validates a manifest and all its referenced series files against JSON schemas.

Options:
  --manifest <path>      Path to the manifest.json file
                         (default: src/assets/data/manifest.json)
  --series-root <dir>    Root directory for series files
                         (default: directory of manifest)
  --fail-fast            Exit on first error
  -h, --help             Show this help message

Exit Codes:
  0 = All validations passed
  1 = One or more validation errors found
  2 = Usage error or file not found

Examples:
  # Validate default manifest
  node scripts/validate-data.mjs

  # Validate specific manifest
  node scripts/validate-data.mjs --manifest ./data/manifest.json

  # Validate with custom series root
  node scripts/validate-data.mjs --series-root ./data/series
`);
}

// Run validation
validate();
