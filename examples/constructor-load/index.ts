/**
 * Constructor Load Example - Loading configuration file in constructor
 *
 * This example demonstrates loading a configuration file directly
 * in the Envict constructor, which is the most straightforward approach.
 */

import { join } from 'path';
import { Envict } from '../../dist/envict';

// Define interface for type safety
interface AppConfig {
  service: {
    name: string;
    port: number;
  };
  database: {
    connectionString: string;
  };
  security: {
    jwtSecret: string;
    sessionTimeout: number;
  };
}

// Load configuration file in constructor
const configPath = join(__dirname, 'app-config.json');
console.log('🏗️  Constructor Load Example - File Loading in Constructor');
console.log('========================================================');
console.log(`Loading configuration from: ${configPath}`);
console.log('');

// Create configuration instance with file loaded in constructor
const config = new Envict<AppConfig>({
  file: configPath,
});

// Access configuration values
const serviceConfig = config.get('service');
const databaseConfig = config.get('database');
const securityConfig = config.get('security');

console.log('Configuration Loaded Successfully!');
console.log('');
console.log('Service Configuration:');
console.log(`  Name: ${serviceConfig.name}`);
console.log(`  Port: ${serviceConfig.port}`);
console.log('');
console.log('Database Configuration:');
console.log(`  Connection String: ${databaseConfig.connectionString}`);
console.log('');
console.log('Security Configuration:');
console.log(
  `  JWT Secret: ${securityConfig.jwtSecret.substring(
    0,
    8
  )}... (truncated for security)`
);
console.log(`  Session Timeout: ${securityConfig.sessionTimeout} seconds`);
