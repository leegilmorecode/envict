/**
 * Chained Load Example - Loading and merging multiple configuration files
 *
 * This example demonstrates chaining multiple configuration file loads
 * to create layered configuration with base settings and environment overrides.
 */

import { join } from 'path';
import { Envict } from '../../dist/envict';

// Define interface for type safety
interface AppConfig {
  app: {
    name: string;
    version: string;
  };
  server: {
    port: number;
    timeout: number;
  };
  logging: {
    level: string;
  };
}

// Define schema
const schema = {
  app: {
    name: {
      description: 'Application name',
      format: 'string',
      env: 'APP_NAME',
      default: 'default-app',
    },
    version: {
      description: 'Application version',
      format: 'string',
      env: 'APP_VERSION',
      default: '0.0.1',
    },
  },
  server: {
    port: {
      description: 'Server port',
      format: 'number',
      env: 'SERVER_PORT',
      default: 3000,
    },
    timeout: {
      description: 'Server timeout in milliseconds',
      format: 'number',
      env: 'SERVER_TIMEOUT',
      default: 30000,
    },
  },
  logging: {
    level: {
      description: 'Logging level',
      format: /^(DEBUG|INFO|WARN|ERROR)$/,
      env: 'LOG_LEVEL',
      default: 'INFO',
    },
  },
};

// File paths
const baseConfigPath = join(__dirname, 'base-config.json');
const prodOverridePath = join(__dirname, 'prod-override.json');

// Create configuration instance and chain load files
console.log('🔗 Chained Load Example - Multiple Configuration Files');
console.log('====================================================');
console.log('');

// Start with base configuration
console.log('Step 1: Loading base configuration...');
const config = new Envict<AppConfig>({
  schema,
  file: baseConfigPath,
});

console.log('Base configuration loaded:');
// console.log(`  App Name: ${config.get('app').name}`);
console.log(`  App Name: ${config.get('app').name}`);
console.log(`  App Version: ${config.get('app').version}`);
console.log(`  Server Port: ${config.get('server').port}`);
console.log(`  Server Timeout: ${config.get('server').timeout}`);
console.log(`  Log Level: ${config.get('logging').level}`);
console.log('');

// Chain load production overrides
console.log('Step 2: Loading production overrides...');
config.load(prodOverridePath);

console.log('After loading production overrides:');
console.log(`  App Name: ${config.get('app').name} (unchanged)`);
console.log(`  App Version: ${config.get('app').version} (unchanged)`);
console.log(
  `  Server Port: ${config.get('server').port} (🔄 overridden: 3000 → 8080)`
);
console.log(
  `  Server Timeout: ${
    config.get('server').timeout
  } (🔄 overridden: 30000 → 60000)`
);
console.log(
  `  Log Level: ${config.get('logging').level} (🔄 overridden: INFO → ERROR)`
);
console.log('');

console.log('Configuration Merge Summary:');
console.log('  ✅ Base values preserved when not overridden');
console.log('  🔄 Production values override base values');
console.log('  🌍 Environment variables would still take highest precedence');
console.log('');
console.log('File Loading Order:');
console.log(`  1. Base: ${baseConfigPath}`);
console.log(`  2. Override: ${prodOverridePath}`);
console.log('  3. Environment Variables (highest precedence)');
