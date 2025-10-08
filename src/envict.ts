/**
 * Main Envict class for type-safe configuration management
 */

import { EnvironmentLoader, FileLoader } from './data-loaders';
import { parseSchema } from './schema-parser';
import { convertValue } from './type-converter';
import type {
  AsyncLoader,
  AsyncWriteOptions,
  ConfigStore,
  EnvictOptions,
  NestedConfigObject,
  ParsedSchema,
  Schema,
  SchemaProperty,
} from './types';
import { ParseError, ValidationError } from './types';

export class Envict<T = Record<string, unknown>> {
  private config: ConfigStore;
  private schema: Schema;
  private parsedSchema: ParsedSchema;
  private env: Record<string, string> | undefined;
  private asyncLoadMutex: Promise<void> = Promise.resolve();
  private asyncWriteMutex: Map<string, Promise<void>> = new Map();
  private nestedObjectCache: Map<string, NestedConfigObject> = new Map();

  /**
   * Clear the nested object cache to prevent serving stale cached objects
   * Called whenever configuration data changes
   */
  private clearNestedObjectCache(): void {
    this.nestedObjectCache.clear();
  }

  /**
   * Create a new Envict instance with optional configuration
   * @param options Configuration options including schema and file path
   */
  constructor(options?: EnvictOptions) {
    // Initialize with empty schema if none provided
    this.schema = options?.schema || {};
    this.config = new Map();
    this.env = options?.env;

    // Parse and validate the schema
    this.parsedSchema = parseSchema(this.schema);

    // Load configuration data during initialisation
    this.loadConfiguration(options);
  }

  /**
   * Load configuration data from various sources during initialisation
   * @param options Configuration options
   */
  private loadConfiguration(options?: EnvictOptions): void {
    // Start with default values from schema
    this.applyDefaults();

    // Load from JSON file if provided
    if (options?.file) {
      this.loadFromFile(options.file);
    }

    // Load from environment variables (takes precedence over file values)
    this.loadFromEnvironment(options?.env);

    // Validate and convert all loaded configuration
    this.validateAndConvertConfiguration();

    // Clear nested object cache after initial configuration loading
    this.clearNestedObjectCache();
  }

  /**
   * Apply default values from schema to configuration
   */
  private applyDefaults(): void {
    for (const [propertyPath, defaultValue] of this.parsedSchema.defaults) {
      this.config.set(propertyPath, defaultValue);
    }
  }

  /**
   * Load configuration from JSON file
   * @param filePath Path to JSON configuration file
   */
  private loadFromFile(filePath: string): void {
    const fileLoader = new FileLoader(filePath);
    const fileData = fileLoader.load();

    // Merge file data with existing configuration (file data takes precedence over defaults)
    for (const [key, value] of Object.entries(fileData)) {
      this.config.set(key, value);
    }
  }

  /**
   * Load configuration from environment variables
   * @param env Custom environment variables (defaults to process.env)
   */
  private loadFromEnvironment(env?: Record<string, string>): void {
    // Invert the mapping from envVar->propertyPath to propertyPath->envVar
    const invertedMappings = new Map<string, string>();
    for (const [envVar, propertyPath] of this.parsedSchema.envMappings) {
      invertedMappings.set(propertyPath, envVar);
    }

    const envLoader = new EnvironmentLoader(invertedMappings, env);
    const envData = envLoader.load();

    // Environment variables take precedence over all other sources
    for (const [key, value] of Object.entries(envData)) {
      this.config.set(key, value);
    }
  }

  /**
   * Validate and convert all configuration values according to schema
   */
  private validateAndConvertConfiguration(): void {
    const errors: (ValidationError | ParseError)[] = [];

    // Process each property defined in the schema
    for (const [propertyPath, schemaProperty] of this.parsedSchema.properties) {
      const rawValue = this.config.get(propertyPath);

      // Check if required property is missing
      if (rawValue === undefined && schemaProperty.default === undefined) {
        errors.push(
          new ValidationError(
            `Required property '${propertyPath}' is missing and has no default value`,
            propertyPath,
            undefined,
          ),
        );
        continue;
      }

      // Skip validation if value is undefined and has default (already applied)
      if (rawValue === undefined) {
        continue;
      }

      try {
        // Special handling for JSON format with default values
        // If the value is from a default and the format is JSON, and the value is already an object,
        // don't try to parse it as JSON string
        if (
          schemaProperty.format === 'json' &&
          schemaProperty.default !== undefined &&
          rawValue === schemaProperty.default &&
          typeof rawValue === 'object'
        ) {
          // Default JSON values are already parsed objects, no conversion needed
          this.config.set(propertyPath, rawValue);
        } else {
          // Convert and validate the value according to schema format
          const convertedValue = convertValue(
            rawValue,
            schemaProperty.format,
            propertyPath,
          );
          this.config.set(propertyPath, convertedValue);
        }
      } catch (error) {
        // Preserve original error types (ParseError, ValidationError)
        if (error instanceof ValidationError || error instanceof ParseError) {
          errors.push(error);
        } else {
          errors.push(
            new ValidationError(
              `Failed to process property '${propertyPath}': ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
              propertyPath,
              rawValue,
            ),
          );
        }
      }
    }

    // Handle error throwing based on number and type of errors
    if (errors.length === 1) {
      // If there's only one error, throw it directly to preserve its type
      throw errors[0];
    }
    if (errors.length > 0) {
      // If there are multiple errors, aggregate them in a ValidationError
      const errorMessages = errors
        .map((err) => {
          // Include property name in aggregated error messages for better debugging
          const propertyName = 'property' in err ? err.property : 'unknown';
          return `- ${propertyName}: ${err.message}`;
        })
        .join('\n');
      throw new ValidationError(
        `Configuration validation failed:\n${errorMessages}`,
        'configuration',
        errors,
      );
    }
  }

  /**
   * Get all configuration as a nested object
   * @returns Complete configuration object with all values
   */
  get(): T;
  /**
   * Get a single configuration value by key
   * Supports dot notation for nested object access (e.g., 'database.host')
   * @param key The configuration key to retrieve
   * @returns The typed configuration value
   * @throws ValidationError if the key doesn't exist and has no default
   */
  get<K extends keyof T>(key: K): T[K];
  get(key: string): unknown;
  /**
   * Get multiple configuration values by array of keys
   * @param keys Array of configuration keys to retrieve
   * @returns Object containing the requested properties with their values
   * @throws ValidationError if any key doesn't exist and has no default
   */
  get<K extends keyof T>(keys: K[]): Pick<T, K>;
  get(keys: string[]): Record<string, unknown>;
  get(keyOrKeys?: string | string[]): unknown {
    // Handle case where no parameters are provided - return all configuration
    if (keyOrKeys === undefined) {
      return this.getAllConfigurationData() as T;
    }

    // Handle array of keys for multiple value retrieval
    if (Array.isArray(keyOrKeys)) {
      return this.getMultipleValues(keyOrKeys);
    }

    // Handle single key retrieval
    return this.getSingleValue(keyOrKeys);
  }

  /**
   * Get a single configuration value by key
   * @param key The configuration key to retrieve
   * @returns The configuration value
   * @throws ValidationError if the key doesn't exist and has no default
   */
  private getSingleValue(key: string): unknown {
    // First check for direct property access
    const directValue = this.config.get(key);
    if (directValue !== undefined) {
      return directValue;
    }

    // Check if this is a nested object (parent key)
    const nestedObject = this.buildNestedObject(key);
    if (nestedObject !== null) {
      return nestedObject;
    }

    // Handle dot notation for nested object access
    if (key.includes('.')) {
      return this.getNestedValue(key);
    }

    // Property not found - handle error cases
    this.handlePropertyNotFound(key);
  }

  /**
   * Handle error cases when a property is not found
   * @param key The configuration key that was not found
   * @throws ValidationError with appropriate error message and suggestions
   */
  private handlePropertyNotFound(key: string): never {
    // Check if this property exists in the schema but has no value
    const schemaProperty = this.parsedSchema.properties.get(key);
    if (schemaProperty) {
      this.throwMissingValueError(key, schemaProperty);
    }

    // Property not defined in schema - provide suggestions
    this.throwUndefinedPropertyError(key);
  }

  /**
   * Throw error for property that exists in schema but has no value
   * @param key The configuration key
   * @param schemaProperty The schema property definition
   * @throws ValidationError with environment variable suggestion
   */
  private throwMissingValueError(
    key: string,
    schemaProperty: SchemaProperty,
  ): never {
    const envVar = schemaProperty.env || key.toUpperCase();
    throw new ValidationError(
      `Property '${key}' is not set and has no default value. ` +
        `Try setting the environment variable '${envVar}' or providing a default value in the schema.`,
      key,
      undefined,
    );
  }

  /**
   * Throw error for property that is not defined in schema with suggestions
   * @param key The configuration key that was not found
   * @throws ValidationError with property suggestions
   */
  private throwUndefinedPropertyError(key: string): never {
    const availableProperties = Array.from(this.parsedSchema.properties.keys());
    const suggestions = this.generatePropertySuggestions(
      key,
      availableProperties,
    );

    const suggestionText =
      suggestions.length > 0
        ? ` Did you mean: ${suggestions.map((s) => `'${s}'`).join(', ')}?`
        : '';

    const availableText =
      availableProperties
        .slice(0, 5)
        .map((p) => `'${p}'`)
        .join(', ') + (availableProperties.length > 5 ? '...' : '');

    throw new ValidationError(
      `Property '${key}' is not defined in the schema.${suggestionText} Available properties: ${availableText}.`,
      key,
      undefined,
    );
  }

  /**
   * Generate property name suggestions based on similarity
   * @param key The key to find suggestions for
   * @param availableProperties List of available property names
   * @returns Array of suggested property names
   */
  private generatePropertySuggestions(
    key: string,
    availableProperties: string[],
  ): string[] {
    return availableProperties
      .filter(
        (prop) =>
          prop.toLowerCase().includes(key.toLowerCase()) ||
          key.toLowerCase().includes(prop.toLowerCase()),
      )
      .slice(0, 3);
  }

  /**
   * Get a nested configuration value using dot notation
   * @param path The dot-separated path to the nested value
   * @returns The nested configuration value
   * @throws ValidationError if the path doesn't exist
   */
  private getNestedValue(path: string): unknown {
    const parts = path.split('.');

    // Check if the full path exists as a flattened key first
    const flatValue = this.config.get(path);
    if (flatValue !== undefined) {
      return flatValue;
    }

    // Try to construct nested object from individual parts
    const current: Record<string, unknown> = {};
    let foundAnyPart = false;

    // Build the nested structure by checking all possible sub-paths
    for (const [i] of parts.entries()) {
      const subPath = parts.slice(0, i + 1).join('.');
      const value = this.config.get(subPath);

      if (value !== undefined) {
        foundAnyPart = true;
        // Set the value at the appropriate nested location
        this.setNestedValue(current, parts.slice(0, i + 1), value);
      }
    }

    if (!foundAnyPart) {
      throw new ValidationError(
        `Property '${path}' is not defined in the configuration`,
        path,
        undefined,
      );
    }

    // Navigate to the requested path in the constructed object
    let result: unknown = current;
    for (const part of parts) {
      if (
        result &&
        typeof result === 'object' &&
        !Array.isArray(result) &&
        part in (result as Record<string, unknown>)
      ) {
        result = (result as Record<string, unknown>)[part];
      } else {
        throw new ValidationError(
          `Property '${path}' is not defined in the configuration`,
          path,
          undefined,
        );
      }
    }

    return result;
  }

  /**
   * Set a value at a nested path in an object
   * @param obj The object to modify
   * @param path Array of path parts
   * @param value The value to set
   */
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string[],
    value: unknown,
  ): void {
    let current: Record<string, unknown> = obj;

    // Navigate to the parent of the target location
    for (let i = 0; i < path.length - 1; i++) {
      const part = path[i];
      if (!part) continue; // Skip undefined parts

      if (
        !(part in current) ||
        typeof current[part] !== 'object' ||
        current[part] === null
      ) {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }

    // Set the final value
    const finalKey = path[path.length - 1];
    if (finalKey) {
      current[finalKey] = value;
    }
  }

  /**
   * Get multiple configuration values by array of keys
   * @param keys Array of configuration keys to retrieve
   * @returns Object containing the requested properties with their values
   * @throws ValidationError if any key doesn't exist and has no default
   */
  private getMultipleValues(keys: string[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    const errors: ValidationError[] = [];

    for (const key of keys) {
      try {
        result[key] = this.get(key);
      } catch (error) {
        if (error instanceof ValidationError) {
          errors.push(error);
        } else {
          errors.push(
            new ValidationError(
              `Failed to retrieve property '${key}': ${
                error instanceof Error ? error.message : 'Unknown error'
              }`,
              key,
              undefined,
            ),
          );
        }
      }
    }

    // If any errors occurred, throw aggregated error
    if (errors.length > 0) {
      const errorMessages = errors.map((err) => `- ${err.message}`).join('\n');
      throw new ValidationError(
        `Failed to retrieve multiple properties:\n${errorMessages}`,
        'multiple_properties',
        keys,
      );
    }

    return result;
  }

  /**
   * Build a nested object for a given parent key by collecting all child properties
   * @param parentKey The parent key to build nested object for
   * @returns The nested object with dot notation support or null if no child properties exist
   */
  private buildNestedObject(parentKey: string): NestedConfigObject | null {
    // Check if we already have a cached nested object for this key
    const cachedObject = this.nestedObjectCache.get(parentKey);
    if (cachedObject) {
      return cachedObject;
    }

    const nestedData: Record<string, unknown> = {};
    let hasNestedProperties = false;

    // Look for all properties that start with the parent key followed by a dot
    const prefix = `${parentKey}.`;

    for (const [configKey, value] of this.config.entries()) {
      if (configKey.startsWith(prefix)) {
        hasNestedProperties = true;
        const relativePath = configKey.substring(prefix.length);
        const pathParts = relativePath.split('.');

        // Set the value at the appropriate nested location
        this.setNestedValue(nestedData, pathParts, value);
      }
    }

    if (!hasNestedProperties) {
      return null;
    }

    // Create a proxy to support dot notation chaining
    const nestedObject = this.createNestedConfigProxy(nestedData, parentKey);

    // Cache the nested object for future use
    this.nestedObjectCache.set(parentKey, nestedObject);

    return nestedObject;
  }

  /**
   * Create a proxy object that supports dot notation access for nested configuration
   * @param data The nested data object
   * @param basePath The base path for error reporting
   * @returns Proxy object with dot notation support
   */
  private createNestedConfigProxy(
    data: Record<string, unknown>,
    basePath: string,
  ): NestedConfigObject {
    const self = this;

    return new Proxy(data, {
      get(target: Record<string, unknown>, prop: string | symbol): unknown {
        if (typeof prop !== 'string') {
          return (target as Record<string | symbol, unknown>)[prop];
        }

        // Handle direct property access
        if (prop in target) {
          const value = target[prop];

          // If the value is an object, wrap it in a proxy for chaining
          if (value && typeof value === 'object' && !Array.isArray(value)) {
            return self.createNestedConfigProxy(
              value as Record<string, unknown>,
              `${basePath}.${prop}`,
            );
          }

          return value;
        }

        // Handle undefined properties gracefully
        return undefined;
      },

      has(target: Record<string, unknown>, prop: string | symbol): boolean {
        return typeof prop === 'string' && prop in target;
      },

      ownKeys(target: Record<string, unknown>): ArrayLike<string | symbol> {
        return Object.keys(target);
      },

      getOwnPropertyDescriptor(
        target: Record<string, unknown>,
        prop: string | symbol,
      ) {
        if (typeof prop === 'string' && prop in target) {
          return {
            enumerable: true,
            configurable: true,
            value: target[prop],
          };
        }
        return undefined;
      },
    }) as NestedConfigObject;
  }

  /**
   * Try to get a configuration value, falling back to another key if the first doesn't exist
   * @param primaryKey The primary configuration key to try first
   * @param fallbackKey The fallback configuration key to use if primary fails
   * @returns The configuration value from either primary or fallback key
   * @throws ValidationError if both keys fail
   */
  tryGet(primaryKey: string, fallbackKey: string): unknown {
    try {
      return this.get(primaryKey);
    } catch (error) {
      // If primary key fails, try the fallback key
      if (error instanceof ValidationError) {
        try {
          return this.get(fallbackKey);
        } catch (fallbackError) {
          // If both fail, throw an error indicating both attempts failed
          throw new ValidationError(
            `Both primary key '${primaryKey}' and fallback key '${fallbackKey}' failed. ` +
              `Primary error: ${error.message}. Fallback error: ${
                fallbackError instanceof ValidationError
                  ? fallbackError.message
                  : 'Unknown error'
              }.`,
            primaryKey,
            undefined,
          );
        }
      }
      // Re-throw non-ValidationError errors
      throw error;
    }
  }

  /**
   * Load configuration from a JSON file at runtime
   * Merges the loaded data with existing configuration, with environment variables taking precedence
   * @param filePath Path to JSON configuration file to load
   * @returns This Envict instance for method chaining
   * @throws FileError when file cannot be read or parsed
   */
  load(filePath: string): this {
    // Load new file data
    const fileLoader = new FileLoader(filePath);
    const newFileData = fileLoader.load();

    // Merge new file data with existing configuration
    // New file data overwrites existing values for matching keys
    for (const [key, value] of Object.entries(newFileData)) {
      this.config.set(key, value);
    }

    // Re-apply environment variables to ensure they still take precedence
    this.loadFromEnvironment(this.env);

    // Re-validate the merged configuration
    this.validateAndConvertConfiguration();

    // Clear nested object cache since configuration has changed
    this.clearNestedObjectCache();

    return this;
  }

  /**
   * Load configuration from async loaders at runtime
   * Merges the loaded data with existing configuration, with environment variables taking precedence
   * Uses a mutex to prevent race conditions when multiple asyncLoad calls are made concurrently
   * @param loaders One or more async loaders to execute
   * @returns Promise that resolves to this Envict instance for method chaining
   * @throws Error when any loader fails (fail-fast behavior)
   */
  async asyncLoad(...loaders: AsyncLoader[]): Promise<this> {
    // Chain this operation after any previous async operations to prevent race conditions
    this.asyncLoadMutex = this.asyncLoadMutex.then(async () => {
      for (const loader of loaders) {
        // Load data from the async loader
        const newData = await loader.load();

        // Merge new data with existing configuration
        // New data overwrites existing values for matching keys
        for (const [key, value] of Object.entries(newData)) {
          this.config.set(key, value);
        }

        // Re-apply environment variables to ensure they still take precedence
        this.loadFromEnvironment(this.env);
      }

      // Re-validate the merged configuration after all loaders complete
      this.validateAndConvertConfiguration();

      // Clear nested object cache since configuration has changed
      this.clearNestedObjectCache();
    });

    // Wait for the operation to complete and return this for chaining
    await this.asyncLoadMutex;
    return this;
  }

  /**
   * Write current configuration to a file on the file system
   * Uses atomic writes and file-level locking to prevent race conditions
   * @param options Write options including path, filename, format, and optional selection
   * @returns Promise that resolves when file is written successfully
   * @throws Error when file writing fails
   */
  async asyncWrite(options: AsyncWriteOptions): Promise<void> {
    const { path, fileName, format = 'json', select, fallback } = options;

    try {
      // Import fs/promises dynamically to avoid issues in environments without file system
      const { writeFile, mkdir } = await import('node:fs/promises');
      const { join } = await import('node:path');

      // Create unique file path for mutex key
      const filePath = join(path, fileName);

      // Get or create mutex for this specific file path
      const existingMutex =
        this.asyncWriteMutex.get(filePath) || Promise.resolve();

      // Chain this write operation after any previous writes to the same file
      const writeOperation = existingMutex.then(async () => {
        // Ensure directory exists
        await mkdir(path, { recursive: true });

        // Get configuration data (either selected portion or all)
        let configData: unknown;

        if (select) {
          // Try to get the selected portion with optional fallback
          if (fallback) {
            configData = this.tryGet(select, fallback);
          } else {
            try {
              configData = this.get(select);
            } catch (error) {
              throw new Error(
                `Failed to select configuration path '${select}': ${
                  error instanceof Error ? error.message : 'Unknown error'
                }`,
              );
            }
          }
        } else {
          // Get all configuration data
          configData = this.getAllConfigurationData();
        }

        // Format the data based on requested format
        let fileContent: string;

        if (format === 'env') {
          // For ENV format, ensure we have an object to flatten
          const dataToFormat =
            typeof configData === 'object' && configData !== null
              ? (configData as Record<string, unknown>)
              : { value: configData };
          fileContent = this.formatAsEnvFile(dataToFormat);
        } else {
          fileContent = JSON.stringify(configData, null, 2);
        }

        // Atomic write: write to temporary file first, then rename
        const tempFilePath = `${filePath}.tmp.${Date.now()}.${Math.random().toString(36).substr(2, 9)}`;

        try {
          // Write to temporary file
          await writeFile(tempFilePath, fileContent, 'utf8');

          // Atomic rename (this is atomic on most file systems)
          const { rename } = await import('node:fs/promises');
          await rename(tempFilePath, filePath);
        } catch (error) {
          // Clean up temporary file if it exists
          try {
            const { unlink } = await import('node:fs/promises');
            await unlink(tempFilePath);
          } catch {
            // Ignore cleanup errors
          }
          throw error;
        }
      });

      // Store the operation promise for this file path
      this.asyncWriteMutex.set(filePath, writeOperation);

      // Wait for the operation to complete
      await writeOperation;

      // Clean up completed operation from mutex map to prevent memory leaks
      this.asyncWriteMutex.delete(filePath);
    } catch (error) {
      throw new Error(
        `Failed to write configuration to file: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    }
  }

  /**
   * Get all current configuration data as a plain object
   * @returns Object containing all configuration values
   */
  private getAllConfigurationData(): Record<string, unknown> {
    const result: Record<string, unknown> = {};

    // Convert the flat Map structure back to nested objects
    for (const [key, value] of this.config.entries()) {
      if (key.includes('.')) {
        // Handle nested properties
        const parts = key.split('.');
        this.setNestedValue(result, parts, value);
      } else {
        // Handle flat properties
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Format configuration data as environment variable file content
   * @param data Configuration data to format
   * @returns String content for .env file
   */
  private formatAsEnvFile(data: Record<string, unknown>): string {
    const envLines: string[] = [];

    // Flatten nested objects to dot notation for env vars
    const flattenObject = (obj: Record<string, unknown>, prefix = ''): void => {
      for (const [key, value] of Object.entries(obj)) {
        const envKey = prefix ? `${prefix}.${key}` : key;

        if (value && typeof value === 'object' && !Array.isArray(value)) {
          // Recursively flatten nested objects
          flattenObject(value as Record<string, unknown>, envKey);
        } else {
          // Convert to environment variable format (UPPER_CASE with underscores)
          const envVarName = envKey.toUpperCase().replace(/\./g, '_');
          const envValue = this.formatEnvValue(value);
          envLines.push(`${envVarName}=${envValue}`);
        }
      }
    };

    flattenObject(data);

    return envLines.sort().join('\n');
  }

  /**
   * Format a value for environment variable file
   * @param value The value to format
   * @returns Formatted string value
   */
  private formatEnvValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'string') {
      // Check if the string contains spaces or quotes
      if (value.includes(' ') || value.includes('"') || value.includes("'")) {
        // Escape quotes and wrap in quotes
        return `"${value.replace(/"/g, '\\"')}"`;
      }
      return value;
    }

    // For non-string values, convert to JSON string
    return JSON.stringify(value);
  }
}
