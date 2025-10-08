/**
 * Detailed Example - Multi-environment configuration with TypeScript interfaces
 *
 * This example demonstrates advanced usage with environment-specific configurations
 * and comprehensive TypeScript typing.
 */

import { Envict } from '../../dist/envict';

// Define comprehensive interfaces for type safety
interface EnvironmentConfig {
  nodeEnv: string;
  awsAccountId: string;
  awsRegion: string;
  appName: string;
  logLevel: string;
}

// Define detailed schema
const schema = {
  nodeEnv: {
    description: 'Node.js environment',
    format: 'string',
    env: 'NODE_ENV',
    default: 'development',
  },
  awsAccountId: {
    description: 'AWS Account ID',
    format: 'string',
    env: 'AWS_ACCOUNT_ID',
    default: '123456789012',
  },
  awsRegion: {
    description: 'AWS Region',
    format: 'string',
    env: 'AWS_REGION',
    default: 'us-east-1',
  },
  appName: {
    description: 'Application name',
    format: 'string',
    env: 'APP_NAME',
    default: 'my-app',
  },
  logLevel: {
    description: 'Application log level',
    format: /^(DEBUG|INFO|WARN|ERROR)$/,
    env: 'LOG_LEVEL',
    default: 'INFO',
  },
};

// Create configuration instance
const config = new Envict<EnvironmentConfig>({ schema });

// Get all configuration values on one go
const allConfig = config.get([
  'nodeEnv',
  'awsAccountId',
  'awsRegion',
  'appName',
  'logLevel',
]);

// Display configuration
console.log('🏗️  Detailed Example - Multi-Environment Configuration');
console.log('=====================================================');
console.log('Current Configuration:');
console.log(`  Environment: ${allConfig.nodeEnv}`);
console.log(`  AWS Account: ${allConfig.awsAccountId}`);
console.log(`  AWS Region: ${allConfig.awsRegion}`);
console.log(`  App Name: ${allConfig.appName}`);
console.log(`  Log Level: ${allConfig.logLevel}`);
console.log('');

// Demonstrate environment-specific behavior
console.log('Environment-Specific Behavior:');
if (allConfig.nodeEnv === 'production') {
  console.log('  🔒 Production mode - Enhanced security enabled');
  console.log('  📊 Metrics collection enabled');
  console.log('  🚫 Debug logging disabled');
} else if (allConfig.nodeEnv === 'development') {
  console.log('  🛠️  Development mode - Debug features enabled');
  console.log('  📝 Verbose logging enabled');
  console.log('  🔄 Hot reload available');
} else {
  console.log('  ⚙️  Custom environment detected');
}

console.log('');
console.log('Environment Variables:');
console.log(`  NODE_ENV=${process.env.NODE_ENV || 'not set'}`);
console.log(`  AWS_ACCOUNT_ID=${process.env.AWS_ACCOUNT_ID || 'not set'}`);
console.log(`  AWS_REGION=${process.env.AWS_REGION || 'not set'}`);
console.log(`  APP_NAME=${process.env.APP_NAME || 'not set'}`);
console.log(`  LOG_LEVEL=${process.env.LOG_LEVEL || 'not set'}`);
