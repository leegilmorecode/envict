/**
 * Get All Configuration Example
 *
 * This example demonstrates how to retrieve all configuration values
 * at once using the get() method without parameters, while maintaining
 * full type safety and nested object structure.
 */

import { Envict } from '../../dist/envict';

// Define the configuration interface for type safety
interface AppConfig {
  port: number;
  host: string;
  database: {
    url: string;
    name: string;
    maxConnections: number;
  };
  features: {
    enableLogging: boolean;
    enableMetrics: boolean;
  };
}

// Define schema with nested structure using dot notation
const schema = {
  port: {
    description: 'Server port',
    format: 'number',
    default: 3000,
    env: 'PORT',
  },
  host: {
    description: 'Server host',
    format: 'string',
    default: 'localhost',
    env: 'HOST',
  },
  'database.url': {
    description: 'Database connection URL',
    format: 'string',
    default: 'mongodb://localhost:27017',
    env: 'DATABASE_URL',
  },
  'database.name': {
    description: 'Database name',
    format: 'string',
    default: 'myapp',
    env: 'DATABASE_NAME',
  },
  'database.maxConnections': {
    description: 'Maximum database connections',
    format: 'number',
    default: 10,
    env: 'DATABASE_MAX_CONNECTIONS',
  },
  'features.enableLogging': {
    description: 'Enable application logging',
    format: 'boolean',
    default: true,
    env: 'ENABLE_LOGGING',
  },
  'features.enableMetrics': {
    description: 'Enable metrics collection',
    format: 'boolean',
    default: false,
    env: 'ENABLE_METRICS',
  },
};

// Create Envict instance with schema and mock environment variables
const config = new Envict<AppConfig>({
  schema,
  env: {
    PORT: '8080',
    HOST: 'production.example.com',
    DATABASE_URL: 'mongodb://prod-db:27017',
    ENABLE_METRICS: 'true',
  },
});

console.log('🚀 Get All Configuration Example');
console.log('='.repeat(50));

console.log('\n📋 Phase 1: Retrieve Complete Configuration');
console.log('-'.repeat(40));

// Get all configuration at once
const allConfig = config.get();

console.log('✅ Complete configuration retrieved:');
console.log(JSON.stringify(allConfig, null, 2));

console.log('\n📋 Phase 2: Type-Safe Access to Nested Values');
console.log('-'.repeat(40));

// The returned object maintains type safety
console.log('🎯 Type-safe access examples:');
console.log(`  🌐 Server: ${allConfig.host}:${allConfig.port}`);
console.log(
  `  🗄️  Database: ${allConfig.database.url}/${allConfig.database.name}`
);
console.log(`  🔗 Max connections: ${allConfig.database.maxConnections}`);
console.log(`  📝 Logging enabled: ${allConfig.features.enableLogging}`);
console.log(`  📊 Metrics enabled: ${allConfig.features.enableMetrics}`);

console.log('\n📋 Phase 3: Individual Value Access Still Works');
console.log('-'.repeat(40));

console.log('🔍 Individual value access:');
console.log(
  `  Port: ${config.get('port')} (type: ${typeof config.get('port')})`
);
console.log(`  Database config:`);
console.log(`    ${JSON.stringify(config.get('database'), null, 4)}`);

console.log('\n📋 Phase 4: Multiple Value Access');
console.log('-'.repeat(40));

const serverConfig = config.get(['port', 'host']);
console.log('🎯 Multiple value access (server config):');
console.log(`  ${JSON.stringify(serverConfig, null, 2)}`);

console.log('\n✨ Key Benefits:');
console.log('  • 🎯 Get all configuration with a single call: config.get()');
console.log('  • 🔒 Full TypeScript type safety maintained');
console.log('  • 🏗️  Nested object structure preserved from dot notation');
console.log('  • 🔄 Individual and multiple value access still available');
console.log('  • 📦 Perfect for passing complete config to other modules');

console.log('\n🎉 All configuration successfully retrieved and accessed!');
