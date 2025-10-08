/**
 * Async Write Example
 *
 * This example demonstrates loading configuration from async sources
 * and then writing it to files for synchronous consumption (e.g., CDK).
 */

import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../../dist/envict';
import type { AsyncLoader } from '../../dist/types';

// Define interface for type safety
interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  database: {
    host: string;
    port: number;
  };
  features: {
    enableAuth: boolean;
    enableMetrics: boolean;
  };
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
  database: {
    host: {
      format: 'string',
      default: 'localhost',
    },
    port: {
      format: 'number',
      default: 5432,
    },
  },
  features: {
    enableAuth: {
      format: 'boolean',
      default: false,
    },
    enableMetrics: {
      format: 'boolean',
      default: false,
    },
  },
};

// Mock API responses for demonstration
const baseConfigResponse = {
  apiUrl: 'https://api.production.com',
  timeout: 10000,
  database: {
    host: 'prod-db.example.com',
    port: 5432,
  },
};

const featureFlagsResponse = {
  retries: 5,
  features: {
    enableAuth: true,
    enableMetrics: true,
  },
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
  console.log('🚀 Async Write Example - Load from APIs, Write to Files');
  console.log('='.repeat(60));

  const outputDir = join(__dirname, 'output');

  // Clean up any existing output files
  if (existsSync(outputDir)) {
    rmSync(outputDir, { recursive: true, force: true });
  }

  // Create Envict instance
  const envict = new Envict<AppConfig>({ schema });

  console.log('\\n📋 Phase 1: Loading configuration from async sources');
  console.log('-'.repeat(50));

  // Load from base configuration API
  const baseConfigLoader = new MockApiLoader(
    'https://config-api.example.com/base',
    baseConfigResponse
  );

  await envict.asyncLoad(baseConfigLoader);
  console.log('✅ Base configuration loaded');

  // Load from feature flags API
  const featureFlagsLoader = new MockApiLoader(
    'https://flags-api.example.com/flags',
    featureFlagsResponse
  );

  await envict.asyncLoad(featureFlagsLoader);
  console.log('✅ Feature flags loaded');

  console.log('\\n📋 Phase 2: Writing configuration to files');
  console.log('-'.repeat(50));

  // Write configuration as JSON (perfect for CDK)
  await envict.asyncWrite({
    path: outputDir,
    fileName: 'cdk-config.json',
    format: 'json',
  });
  console.log('✅ JSON configuration written to ./output/cdk-config.json');

  // Write configuration as ENV file (perfect for containers)
  await envict.asyncWrite({
    path: outputDir,
    fileName: '.env.example',
    format: 'env',
  });
  console.log('✅ ENV configuration written to ./output/.env.example');

  console.log('\\n📋 Phase 3: Verifying written files');
  console.log('-'.repeat(50));

  // Read and display JSON file
  const jsonPath = join(outputDir, 'cdk-config.json');
  if (existsSync(jsonPath)) {
    const jsonContent = readFileSync(jsonPath, 'utf8');
    const parsedConfig = JSON.parse(jsonContent);

    console.log('\\n📄 Generated JSON file (cdk-config.json):');
    console.log(JSON.stringify(parsedConfig, null, 2));

    console.log('\\n🎯 CDK Usage Example:');
    console.log('```typescript');
    console.log('// In your CDK app');
    console.log(
      'const config = JSON.parse(fs.readFileSync("./output/cdk-config.json", "utf8"));'
    );
    console.log(
      'const apiUrl = config.apiUrl; // "https://api.production.com"'
    );
    console.log(
      'const dbHost = config.database.host; // "prod-db.example.com"'
    );
    console.log('```');
  }

  // Read and display ENV file
  const envPath = join(outputDir, '.env.example');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');

    console.log('\\n📄 Generated ENV file (.env.example):');
    console.log(envContent);

    console.log('\\n🐳 Docker Usage Example:');
    console.log('```dockerfile');
    console.log('# In your Dockerfile');
    console.log('COPY ./output/.env.example /app/.env');
    console.log('# Or use with docker-compose:');
    console.log('# env_file: ./output/.env.example');
    console.log('```');
  }

  console.log('\\n✨ Key Benefits:');
  console.log(
    '  • Load configuration from any async source (APIs, databases, etc.)'
  );
  console.log(
    '  • Write to files for synchronous consumption (CDK, Docker, etc.)'
  );
  console.log('  • Support multiple output formats (JSON, ENV)');
  console.log('  • Perfect for CI/CD pipelines and build-time configuration');
  console.log('  • Enables async-to-sync configuration workflows');

  console.log('\\n🎉 Configuration successfully loaded and written to files!');
  console.log(`📁 Output files available in: ${outputDir}`);
}

// Run the example
runExample().catch(console.error);
