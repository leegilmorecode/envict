import { readFileSync } from 'node:fs';
import { FileError } from './types';

/**
 * Interface for data loading implementations
 */
export interface DataLoader {
  /**
   * Load configuration data from the data source
   * @returns Record of configuration key-value pairs
   */
  // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
  load(): Record<string, any>;
}

/**
 * Loads configuration data from environment variables
 *
 * This loader reads from process.env by default, making it ideal for:
 * - AWS Lambda functions where environment variables are set at runtime
 * - Docker containers with environment variable injection
 * - Server deployments where config is provided via environment variables
 * - Any scenario where runtime environment variables should take precedence
 *
 * @example
 * ```typescript
 * const envMappings = new Map([
 *   ['database.host', 'DB_HOST'],
 *   ['database.port', 'DB_PORT']
 * ]);
 * const loader = new EnvironmentLoader(envMappings);
 * const config = loader.load(); // Reads from process.env.DB_HOST and process.env.DB_PORT
 * ```
 */
export class EnvironmentLoader implements DataLoader {
  private readonly envMappings: Map<string, string>;
  private readonly env: Record<string, string>;

  /**
   * Create an EnvironmentLoader instance
   * @param envMappings Map of property paths to environment variable names
   * @param env Environment variables object (defaults to process.env for runtime environment access)
   */
  constructor(
    envMappings: Map<string, string>,
    env: Record<string, string> = process.env as Record<string, string>,
  ) {
    this.envMappings = envMappings;
    this.env = env;
  }

  /**
   * Load configuration values from environment variables
   * @returns Record of property paths to values
   */
  // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
  load(): Record<string, any> {
    // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
    const config: Record<string, any> = {};

    for (const [propertyPath, envVarName] of this.envMappings) {
      const value = this.env[envVarName];
      if (value !== undefined) {
        config[propertyPath] = value;
      }
    }

    return config;
  }
}

/**
 * Loads configuration data from JSON files
 *
 * This loader reads and parses JSON configuration files, automatically flattening
 * nested objects to dot notation for consistent property access. Supports both
 * flat and deeply nested JSON structures.
 *
 * @example
 * ```typescript
 * // For a JSON file: { "database": { "host": "localhost", "port": 5432 } }
 * const loader = new FileLoader('./config.json');
 * const config = loader.load();
 * // Returns: { "database.host": "localhost", "database.port": 5432 }
 * ```
 */
export class FileLoader implements DataLoader {
  private readonly filePath: string;

  /**
   * Create a FileLoader instance
   * @param filePath Path to the JSON configuration file
   */
  constructor(filePath: string) {
    this.filePath = filePath;
  }

  /**
   * Load and parse JSON configuration file
   * @returns Record of configuration key-value pairs
   * @throws FileError when file cannot be read or parsed
   */
  // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
  load(): Record<string, any> {
    try {
      const fileContent = readFileSync(this.filePath, 'utf-8');

      try {
        const parsedData = JSON.parse(fileContent);

        // Flatten nested objects to dot notation for consistent access
        return this.flattenObject(parsedData);
      } catch (parseError) {
        throw new FileError(
          `Failed to parse JSON from file '${this.filePath}': ${
            parseError instanceof Error ? parseError.message : 'Invalid JSON'
          }`,
          this.filePath,
        );
      }
    } catch (error) {
      if (error instanceof FileError) {
        throw error;
      }

      throw new FileError(
        `Failed to read configuration file '${this.filePath}': ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        this.filePath,
      );
    }
  }

  /**
   * Flatten nested object to dot notation keys
   *
   * Converts nested objects like { a: { b: { c: 1 } } } to { "a.b.c": 1 }
   * Arrays and primitive values are preserved as-is.
   *
   * @param obj Object to flatten
   * @param prefix Current key prefix for recursive calls
   * @returns Flattened object with dot notation keys
   * @private
   */
  // biome-ignore lint/suspicious/noExplicitAny: Object structure is unknown and can contain any values
  private flattenObject(obj: any, prefix = ''): Record<string, any> {
    // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
    const flattened: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (
        value !== null &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        // Recursively flatten nested objects
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else {
        // Store primitive values and arrays as-is
        flattened[newKey] = value;
      }
    }

    return flattened;
  }
}

/**
 * Merge configuration data with environment variables taking precedence
 *
 * This function ensures that any environment variable (from process.env) will
 * override the corresponding value from JSON configuration files, making it
 * safe to use in serverless and containerised environments.
 *
 * @param fileData Configuration data from JSON files
 * @param envData Configuration data from environment variables (typically from process.env)
 * @returns Merged configuration with env vars overriding file values
 *
 * @example
 * ```typescript
 * const fileData = { "database.host": "localhost", "database.port": 5432 };
 * const envData = { "database.host": "prod-server" };
 * const merged = mergeConfig(fileData, envData);
 * // Result: { "database.host": "prod-server", "database.port": 5432 }
 * ```
 */
export function mergeConfig(
  fileData: Record<string, unknown>,
  envData: Record<string, unknown>,
): Record<string, unknown> {
  // Start with file data as base
  const merged = { ...fileData };

  // Override with environment variable values
  for (const [key, value] of Object.entries(envData)) {
    merged[key] = value;
  }

  return merged;
}
