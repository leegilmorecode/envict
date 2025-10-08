/**
 * Load Config Example - Loading configuration from JSON files
 *
 * This example demonstrates loading configuration from a JSON file
 * with environment variable overrides.
 */

import { join } from 'path';
import { Envict } from '../../dist/envict';

// Define interface for type safety
interface AppConfig {
  server: {
    port: number;
    host: string;
  };
  database: {
    url: string;
    maxConnections: number;
  };
  features: {
    enableMetrics: boolean;
  };
}

// Define schema for nested configuration
const schema = {
  server: {
    port: {
      description: 'Server port',
      format: 'number',
      env: 'SERVER_PORT',
      default: 3000,
    },
    host: {
      description: 'Server host',
      format: 'string',
      env: 'SERVER_HOST',
      default: 'localhost',
    },
  },
  database: {
    url: {
      description: 'Database connection URL',
      format: 'string',
      env: 'DATABASE_URL',
      default: 'postgresql://localhost:5432/defaultdb',
    },
    maxConnections: {
      description: 'Maximum database connections',
      format: 'number',
      env: 'DB_MAX_CONNECTIONS',
      default: 5,
    },
  },
  features: {
    enableMetrics: {
      description: 'Enable application metrics',
      format: 'boolean',
      env: 'ENABLE_METRICS',
      default: false,
    },
  },
};

// Create configuration instance with JSON file
const configPath = join(__dirname, 'config.json');
const config = new Envict<AppConfig>({
  schema,
  file: configPath,
});

// Access nested configuration
const serverConfig = config.get('server');
const databaseConfig = config.get('database');
const featuresConfig = config.get('features');

// Display configuration
console.log('📁 Load Config Example - JSON File Configuration');
console.log('===============================================');
console.log(`Config file: ${configPath}`);
console.log('');
console.log('Server Configuration:');
console.log(`  Port: ${serverConfig.port} (type: ${typeof serverConfig.port})`);
console.log(`  Host: ${serverConfig.host} (type: ${typeof serverConfig.host})`);
console.log('');
console.log('Database Configuration:');
console.log(`  URL: ${databaseConfig.url}`);
console.log(
  `  Max Connections: ${
    databaseConfig.maxConnections
  } (type: ${typeof databaseConfig.maxConnections})`
);
console.log('');
console.log('Features Configuration:');
console.log(
  `  Enable Metrics: ${
    featuresConfig.enableMetrics
  } (type: ${typeof featuresConfig.enableMetrics})`
);
console.log('');
console.log('Environment Variable Overrides:');
console.log(
  `  SERVER_PORT=${process.env.SERVER_PORT || 'not set (using JSON/default)'}`
);
console.log(
  `  SERVER_HOST=${process.env.SERVER_HOST || 'not set (using JSON/default)'}`
);
console.log(
  `  DATABASE_URL=${process.env.DATABASE_URL || 'not set (using JSON/default)'}`
);
console.log(
  `  DB_MAX_CONNECTIONS=${
    process.env.DB_MAX_CONNECTIONS || 'not set (using JSON/default)'
  }`
);
console.log(
  `  ENABLE_METRICS=${
    process.env.ENABLE_METRICS || 'not set (using JSON/default)'
  }`
);
