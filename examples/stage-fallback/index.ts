/**
 * Stage Fallback Example
 *
 * This example demonstrates using tryGet() for dynamic stage-based configuration
 * with ephemeral fallbacks. Simple and clear demonstration of the core functionality.
 */

import { Envict } from '../../dist/envict';

// Define simple interface for type safety
interface StageConfig {
  stage: string;
  serviceName: string;
  logLevel: 'DEBUG' | 'INFO' | 'ERROR';
}

// Define schema with nested objects for stages
const schema = {
  stages: {
    prod: {
      stage: {
        format: 'string',
        default: 'prod',
      },
      serviceName: {
        format: 'string',
        default: 'order-service-prod',
      },
      logLevel: {
        format: 'string',
        default: 'INFO',
      },
    },
    ephemeral: {
      stage: {
        format: 'string',
        default: 'ephemeral',
      },
      serviceName: {
        format: 'string',
        default: 'order-service-ephemeral',
      },
      logLevel: {
        format: 'string',
        default: 'DEBUG',
      },
    },
  },
};

// Create Envict instance
const envict = new Envict({ schema });

console.log('🚀 Stage Fallback Example - tryGet() Method Demonstration');
console.log('='.repeat(60));

// Example 1: Try to get 'prod' stage (exists)
console.log('\n📋 Example 1: Getting existing stage');
console.log("envict.tryGet('stages.prod', 'stages.ephemeral')");

const prodConfig = envict.tryGet(
  'stages.prod',
  'stages.ephemeral'
) as StageConfig;
console.log('✅ Result: Found prod configuration');
console.log(`   Stage: ${prodConfig.stage}`);
console.log(`   Service: ${prodConfig.serviceName}`);
console.log(`   Log Level: ${prodConfig.logLevel}`);

// Example 2: Try to get 'pr-123' stage (doesn't exist, falls back to ephemeral)
console.log('\n📋 Example 2: Getting non-existent stage');
console.log("envict.tryGet('stages.pr-123', 'stages.ephemeral')");

const featureConfig = envict.tryGet(
  'stages.pr-123',
  'stages.ephemeral'
) as StageConfig;
console.log('🔄 Result: Stage not found, using ephemeral fallback');
console.log(`   Stage: ${featureConfig.stage}`);
console.log(`   Service: ${featureConfig.serviceName}`);
console.log(`   Log Level: ${featureConfig.logLevel}`);

console.log('\n✨ Key Points:');
console.log('  • tryGet() tries the primary key first');
console.log('  • If primary fails, it tries the fallback key');
console.log('  • Perfect for dynamic configuration with templates');
console.log('  • No manual error handling needed for missing stages');
