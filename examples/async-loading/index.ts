/**
 * Async Loading Example
 *
 * This example demonstrates using asyncLoad() for loading configuration from
 * two API sources and shows how they merge together.
 */

import { Envict } from '../../dist/envict';
import type { AsyncLoader } from '../../dist/types';

// Define interface for type safety
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  enableLogging: boolean;
}

// Define schema
const schema = {
  apiUrl: {
    format: 'string',
    default: 'http://localhost:3000',
  },
  timeout: {
    format: 'number',
    default: 5000,
  },
  retries: {
    format: 'number',
    default: 3,
  },
  enableLogging: {
    format: 'boolean',
    default: true,
  },
};

// Mock API responses for demonstration
const baseConfigResponse = {
  apiUrl: 'https://api.production.com',
  timeout: 10000,
};

const featureFlagsResponse = {
  retries: 5,
  enableLogging: false,
};

// Mock API loaders for demonstration
class MockApiLoader implements AsyncLoader {
  constructor(private url: string, private response: Record<string, unknown>) {}

  async load(): Promise<Record<string, unknown>> {
    console.log(`  🌐 Loading configuration from: ${this.url}`);

    // Simulate async API call
    await new Promise((resolve) => setTimeout(resolve, 100));

    console.log(`  ✅ Configuration loaded successfully`);
    return this.response;
  }
}

async function runExample() {
  console.log('🚀 Async Loading Example - Chained API Configuration');
  console.log('='.repeat(55));

  // Create Envict instance
  const envict = new Envict<AppConfig>({ schema });

  console.log('\n📋 Initial Configuration (from defaults):');
  console.log(`  API URL: ${envict.get('apiUrl')}`);
  console.log(`  Timeout: ${envict.get('timeout')}`);
  console.log(`  Retries: ${envict.get('retries')}`);
  console.log(`  Enable Logging: ${envict.get('enableLogging')}`);

  // Load from first API (base configuration)
  console.log('\n📋 Step 1: Loading base configuration from API');
  const baseConfigLoader = new MockApiLoader(
    'https://config-api.example.com/base',
    baseConfigResponse
  );

  await envict.asyncLoad(baseConfigLoader);

  console.log('\n📊 Configuration after base API:');
  console.log(`  API URL: ${envict.get('apiUrl')} (updated)`);
  console.log(`  Timeout: ${envict.get('timeout')} (updated)`);
  console.log(`  Retries: ${envict.get('retries')} (still default)`);
  console.log(
    `  Enable Logging: ${envict.get('enableLogging')} (still default)`
  );

  // Load from second API (feature flags)
  console.log('\n📋 Step 2: Loading feature flags from API');
  const featureFlagsLoader = new MockApiLoader(
    'https://flags-api.example.com/flags',
    featureFlagsResponse
  );

  await envict.asyncLoad(featureFlagsLoader);

  console.log('\n📊 Final Configuration (merged from both APIs):');
  console.log(`  API URL: ${envict.get('apiUrl')} (from base API)`);
  console.log(`  Timeout: ${envict.get('timeout')} (from base API)`);
  console.log(`  Retries: ${envict.get('retries')} (from flags API)`);
  console.log(
    `  Enable Logging: ${envict.get('enableLogging')} (from flags API)`
  );

  console.log('\n✨ Key Points:');
  console.log(
    '  • Each asyncLoad() call merges new data with existing configuration'
  );
  console.log('  • Later API calls can override values from earlier calls');
  console.log('  • Environment variables would still take highest precedence');
  console.log('  • All data is validated against your schema');
}

// Run the example
runExample().catch(console.error);
