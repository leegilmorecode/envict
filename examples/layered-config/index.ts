/**
 * Layered Config Example - Multi-layer configuration loading
 *
 * This example demonstrates loading multiple configuration layers
 * to build up a comprehensive configuration from multiple sources.
 */

import { join } from 'path';
import { Envict } from '../../dist/envict';

// Define interface for type safety
interface AppConfig {
  database: {
    host: string;
    port: number;
  };
  cache: {
    ttl: number;
    enabled: boolean;
  };
  api: {
    timeout: number;
  };
}

// Define schema
const schema = {
  database: {
    host: {
      description: 'Database host',
      format: 'string',
      env: 'DB_HOST',
      default: 'localhost',
    },
    port: {
      description: 'Database port',
      format: 'number',
      env: 'DB_PORT',
      default: 5432,
    },
  },
  cache: {
    ttl: {
      description: 'Cache TTL in seconds',
      format: 'number',
      env: 'CACHE_TTL',
      default: 3600,
    },
    enabled: {
      description: 'Enable caching',
      format: 'boolean',
      env: 'CACHE_ENABLED',
      default: true,
    },
  },
  api: {
    timeout: {
      description: 'API timeout in milliseconds',
      format: 'number',
      env: 'API_TIMEOUT',
      default: 5000,
    },
  },
};

// File paths
const defaultsPath = join(__dirname, 'defaults.json');
const teamConfigPath = join(__dirname, 'team-config.json');
const localOverridesPath = join(__dirname, 'local-overrides.json');

console.log('🏗️  Layered Config Example - Multi-Layer Configuration');
console.log('===================================================');
console.log('');

// Create configuration with layered loading using method chaining
const config = new Envict<AppConfig>({ schema })
  .load(defaultsPath) // Base configuration
  .load(teamConfigPath) // Team-specific settings
  .load(localOverridesPath); // Local development overrides

// Get final configuration
const dbConfig = config.get('database');
const cacheConfig = config.get('cache');
const apiConfig = config.get('api');

console.log('Final Layered Configuration:');
console.log('');
console.log('Database Configuration:');
console.log(`  Host: ${dbConfig.host}`);
console.log(`  Port: ${dbConfig.port}`);
console.log('');
console.log('Cache Configuration:');
console.log(`  TTL: ${cacheConfig.ttl} seconds`);
console.log(`  Enabled: ${cacheConfig.enabled}`);
console.log('');
console.log('API Configuration:');
console.log(`  Timeout: ${apiConfig.timeout} milliseconds`);
console.log('');

console.log('Configuration Layer Analysis:');
console.log('');
console.log('🏠 defaults.json (Layer 1):');
console.log('  - database.host: localhost');
console.log('  - database.port: 5432');
console.log('  - cache.ttl: 3600');
console.log('  - cache.enabled: true');
console.log('  - api.timeout: 5000');
console.log('');
console.log('👥 team-config.json (Layer 2):');
console.log('  - database.host: team-db.internal (overrides defaults)');
console.log('  - cache.ttl: 7200 (overrides defaults)');
console.log('  - Other values: inherited from defaults');
console.log('');
console.log('💻 local-overrides.json (Layer 3):');
console.log('  - database.port: 5433 (overrides defaults)');
console.log('  - cache.enabled: false (overrides defaults)');
console.log('  - api.timeout: 10000 (overrides defaults)');
console.log('  - Other values: inherited from previous layers');
console.log('');
console.log('🌍 Environment Variables (Layer 4 - Highest Priority):');
console.log(`  - DB_HOST: ${process.env.DB_HOST || 'not set'}`);
console.log(`  - DB_PORT: ${process.env.DB_PORT || 'not set'}`);
console.log(`  - CACHE_TTL: ${process.env.CACHE_TTL || 'not set'}`);
console.log(`  - CACHE_ENABLED: ${process.env.CACHE_ENABLED || 'not set'}`);
console.log(`  - API_TIMEOUT: ${process.env.API_TIMEOUT || 'not set'}`);
