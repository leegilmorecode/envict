/**
 * Basic Example - Simple typed schema with environment variables
 *
 * This example demonstrates basic usage of Envict with a simple schema
 * that reads from environment variables with defaults.
 */

import { Envict } from '../../dist/envict';

// Define a simple interface for type safety
interface AppConfig {
  port: number;
  debug: boolean;
  appName: string;
}

// Define schema with basic types
const schema = {
  port: {
    description: 'Server port',
    format: 'number',
    env: 'PORT',
    default: 3000,
  },
  debug: {
    description: 'Enable debug mode',
    format: 'boolean',
    env: 'DEBUG',
    default: false,
  },
  appName: {
    description: 'Application name',
    format: 'string',
    env: 'APP_NAME',
    default: 'my-app',
  },
};

// Create configuration instance
const config = new Envict<AppConfig>({ schema });

// Display configuration values
console.log('🚀 Basic Example - Environment Variable Configuration');
console.log('================================================');
console.log(`Port: ${config.get('port')} (type: ${typeof config.get('port')})`);
console.log(
  `Debug: ${config.get('debug')} (type: ${typeof config.get('debug')})`
);
console.log(
  `App Name: ${config.get('appName')} (type: ${typeof config.get('appName')})`
);
console.log('');
console.log('Environment variables used:');
console.log(`- PORT=${process.env.PORT || 'not set (using default)'}`);
console.log(`- DEBUG=${process.env.DEBUG || 'not set (using default)'}`);
console.log(`- APP_NAME=${process.env.APP_NAME || 'not set (using default)'}`);
