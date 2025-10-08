/**
 * Async Partial Write Example
 *
 * This example demonstrates selective writing of configuration portions
 * using the select and fallback options in asyncWrite().
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../../dist/envict';

// Define schema with multiple environments and services
const schema = {
  environments: {
    production: {
      database: {
        host: {
          format: 'string',
          env: 'PROD_DB_HOST',
          default: 'prod-db.example.com',
        },
        port: { format: 'number', env: 'PROD_DB_PORT', default: 5432 },
        ssl: { format: 'boolean', default: true },
      },
      api: {
        url: { format: 'string', default: 'https://api.production.com' },
        timeout: { format: 'number', default: 30000 },
        retries: { format: 'number', default: 3 },
      },
    },
    staging: {
      database: {
        host: {
          format: 'string',
          env: 'STAGING_DB_HOST',
          default: 'staging-db.example.com',
        },
        port: { format: 'number', env: 'STAGING_DB_PORT', default: 5432 },
        ssl: { format: 'boolean', default: true },
      },
      api: {
        url: { format: 'string', default: 'https://api.staging.com' },
        timeout: { format: 'number', default: 15000 },
        retries: { format: 'number', default: 2 },
      },
    },
    development: {
      database: {
        host: { format: 'string', env: 'DEV_DB_HOST', default: 'localhost' },
        port: { format: 'number', env: 'DEV_DB_PORT', default: 5432 },
        ssl: { format: 'boolean', default: false },
      },
      api: {
        url: { format: 'string', default: 'http://localhost:3000' },
        timeout: { format: 'number', default: 5000 },
        retries: { format: 'number', default: 1 },
      },
    },
  },
  services: {
    auth: {
      enabled: { format: 'boolean', env: 'AUTH_ENABLED', default: true },
      provider: { format: 'string', env: 'AUTH_PROVIDER', default: 'oauth2' },
      timeout: { format: 'number', default: 10000 },
    },
    metrics: {
      enabled: { format: 'boolean', env: 'METRICS_ENABLED', default: false },
      endpoint: { format: 'string', default: '/metrics' },
      interval: { format: 'number', default: 60000 },
    },
  },
};

async function runExample() {
  console.log(
    '🚀 Async Partial Write Example - Selective Configuration Writing'
  );
  console.log('='.repeat(65));

  const outputDir = join(__dirname, 'output');

  // Create Envict instance
  const envict = new Envict({ schema });

  console.log('\\n📋 Phase 1: Writing selected configuration portions');
  console.log('-'.repeat(50));

  // Example 1: Select specific environment and write as JSON
  const targetEnv = process.env.TARGET_ENV || 'staging';
  console.log(`Writing ${targetEnv} environment configuration...`);

  await envict.asyncWrite({
    path: outputDir,
    fileName: `${targetEnv}-config.json`,
    format: 'json',
    select: `environments.${targetEnv}`,
  });
  console.log(`✅ ${targetEnv} config written to ${targetEnv}-config.json`);

  // Example 2: Select with fallback and write as ENV file
  const serviceEnv = process.env.SERVICE_ENV || 'nonexistent';
  console.log(
    `\\nTrying to write ${serviceEnv} environment (with fallback to development)...`
  );

  await envict.asyncWrite({
    path: outputDir,
    fileName: `.env.${serviceEnv}`,
    format: 'env',
    select: `environments.${serviceEnv}`,
    fallback: 'environments.development',
  });
  console.log(
    `✅ Service environment config written to .env.services (used fallback: development)`
  );

  console.log('\\n📋 Phase 2: Verifying written files');
  console.log('-'.repeat(50));

  // Verify JSON file
  const jsonPath = join(outputDir, `${targetEnv}-config.json`);
  if (existsSync(jsonPath)) {
    const jsonContent = readFileSync(jsonPath, 'utf8');
    const parsedConfig = JSON.parse(jsonContent);

    console.log(`\\n📄 ${targetEnv} Configuration (JSON):`);
    console.log(JSON.stringify(parsedConfig, null, 2));
  }

  // Verify ENV file
  const envPath = join(outputDir, '.env.services');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');

    console.log('\\n📄 Service Environment Variables (.env):');
    console.log(envContent);
  }

  console.log('\\n📋 Phase 3: Demonstrating environment variable overrides');
  console.log('-'.repeat(50));

  // Show how environment variables override defaults
  console.log('\\n🔧 Environment Variable Overrides:');
  if (process.env.PROD_DB_HOST) {
    console.log(
      `  PROD_DB_HOST: ${process.env.PROD_DB_HOST} (overriding default)`
    );
  }
  if (process.env.AUTH_ENABLED) {
    console.log(
      `  AUTH_ENABLED: ${process.env.AUTH_ENABLED} (overriding default)`
    );
  }
  if (process.env.METRICS_ENABLED) {
    console.log(
      `  METRICS_ENABLED: ${process.env.METRICS_ENABLED} (overriding default)`
    );
  }

  console.log('\\n✨ Key Features Demonstrated:');
  console.log('  • Selective configuration writing with select option');
  console.log(`  • Fallback mechanism when selected path doesnt exist`);
  console.log(
    '  • Multiple output formats (JSON for apps, ENV for containers)'
  );
  console.log('  • Environment variable overrides for specific values');
  console.log('  • Clean separation of environments and services');

  console.log('\\n🎯 Use Cases:');
  console.log('  • Write environment-specific configs for deployment');
  console.log('  • Generate .env files for Docker containers');
  console.log('  • Create service-specific configuration files');
  console.log('  • Provide fallback configurations for unknown environments');

  console.log('\\n🎉 Partial configuration writing completed successfully!');
  console.log(`📁 Output files available in: ${outputDir}`);

  // Clean up any existing output files
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }
}

// Run the example
runExample().catch(console.error);
