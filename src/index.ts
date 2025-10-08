/**
 * @fileoverview Envict - Zero-dependency TypeScript configuration management package
 *
 * Envict provides type-safe configuration management with support for:
 * - Environment variables with automatic type conversion
 * - JSON configuration files with nested object support
 * - Async configuration loading from APIs and other sources
 * - Configuration validation with comprehensive error reporting
 * - File writing for CI/CD and build-time configuration generation
 *
 * @example Basic Usage
 * ```typescript
 * import { Envict } from '@serverless-advocate/envict';
 *
 * const config = new Envict({
 *   schema: {
 *     port: { format: 'number', env: 'PORT', default: 3000 },
 *     host: { format: 'string', env: 'HOST', default: 'localhost' }
 *   }
 * });
 *
 * const port = config.get('port'); // Type-safe number
 * const host = config.get('host'); // Type-safe string
 * ```
 *
 */

export * from './async-loaders';
export * from './data-loaders';
export * from './envict';
export * from './schema-parser';
export * from './type-converter';
export * from './types';
