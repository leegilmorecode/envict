/**
 * Schema parsing and validation utilities for Envict configuration management
 */

import {
  type ParsedSchema,
  type Schema,
  type SchemaProperty,
  ValidationError,
} from './types';

/**
 * Parse a schema into an internal format for efficient processing
 *
 * Converts a nested schema definition into flattened maps for efficient
 * property lookup, environment variable mapping, and default value handling.
 *
 * @param schema - The schema to parse
 * @returns Parsed schema with flattened properties and mappings
 * @throws {ValidationError} When schema validation fails
 *
 * @example
 * ```typescript
 * const schema = {
 *   port: { format: 'number', default: 3000, env: 'PORT' },
 *   database: {
 *     host: { format: 'string', default: 'localhost' }
 *   }
 * };
 * const parsed = parseSchema(schema);
 * // Returns maps for efficient property access and validation
 * ```
 */
export function parseSchema(schema: Schema): ParsedSchema {
  // First validate the schema structure
  validateSchema(schema);

  const properties = new Map<string, SchemaProperty>();
  const envMappings = new Map<string, string>();
  const defaults = new Map<string, unknown>();

  // Recursively process the schema
  processSchemaRecursive(schema, '', properties, envMappings, defaults);

  return {
    properties,
    envMappings,
    defaults,
  };
}

/**
 * Validate schema structure and catch invalid schema definitions
 *
 * Performs comprehensive validation of schema structure, property definitions,
 * format specifications, and environment variable mappings.
 *
 * @param schema - The schema to validate
 * @throws {ValidationError} When schema is invalid
 *
 * @example
 * ```typescript
 * const validSchema = { port: { format: 'number', default: 3000 } };
 * validateSchema(validSchema); // Passes validation
 *
 * const invalidSchema = { port: { format: 'invalid' } };
 * validateSchema(invalidSchema); // Throws ValidationError
 * ```
 */
export function validateSchema(schema: Schema): void {
  if (!schema || typeof schema !== 'object') {
    throw new ValidationError(
      'Schema must be a non-null object',
      'schema',
      schema,
    );
  }

  validateSchemaRecursive(schema, '');
}

/**
 * Extract environment variable mappings from schema
 *
 * Creates a mapping from environment variable names to their corresponding
 * property paths in the configuration. Only includes properties that have
 * explicit `env` mappings defined.
 *
 * @param schema - The schema to extract mappings from
 * @returns Map of environment variable names to property paths
 *
 * @example
 * ```typescript
 * const schema = {
 *   port: { format: 'number', env: 'PORT' },
 *   host: { format: 'string', env: 'HOST' }
 * };
 * const mappings = extractEnvMappings(schema);
 * // Returns: Map { 'PORT' => 'port', 'HOST' => 'host' }
 * ```
 */
export function extractEnvMappings(schema: Schema): Map<string, string> {
  const envMappings = new Map<string, string>();
  extractEnvMappingsRecursive(schema, '', envMappings);
  return envMappings;
}

/**
 * Recursively process schema to build flattened property maps
 *
 * @param schema - Current schema level to process
 * @param prefix - Current property path prefix
 * @param properties - Map to store flattened property definitions
 * @param envMappings - Map to store environment variable mappings
 * @param defaults - Map to store default values
 * @private
 */
function processSchemaRecursive(
  schema: Schema,
  prefix: string,
  properties: Map<string, SchemaProperty>,
  envMappings: Map<string, string>,
  defaults: Map<string, unknown>,
): void {
  for (const [key, value] of Object.entries(schema)) {
    const propertyPath = prefix ? `${prefix}.${key}` : key;

    if (isSchemaProperty(value)) {
      // This is a leaf property
      properties.set(propertyPath, value);

      // Set up environment variable mapping only when explicitly defined
      if (value.env) {
        envMappings.set(value.env, propertyPath);
      }

      // Store default value if provided
      if (value.default !== undefined) {
        defaults.set(propertyPath, value.default);
      }
    } else {
      // This is a nested object, recurse
      processSchemaRecursive(
        value,
        propertyPath,
        properties,
        envMappings,
        defaults,
      );
    }
  }
}

/**
 * Recursively validate schema structure
 *
 * @param schema - Current schema level to validate
 * @param path - Current property path for error reporting
 * @private
 */
function validateSchemaRecursive(schema: Schema, path: string): void {
  for (const [key, value] of Object.entries(schema)) {
    const currentPath = path ? `${path}.${key}` : key;

    if (!key || typeof key !== 'string') {
      throw new ValidationError(
        'Schema keys must be non-empty strings',
        currentPath,
        key,
      );
    }

    if (isSchemaProperty(value)) {
      validateSchemaProperty(value, currentPath);
    } else if (value && typeof value === 'object') {
      // Nested schema object
      validateSchemaRecursive(value, currentPath);
    } else {
      throw new ValidationError(
        'Schema values must be either SchemaProperty objects or nested Schema objects',
        currentPath,
        value,
      );
    }
  }
}

/**
 * Validate individual schema property
 *
 * @param property - Schema property to validate
 * @param path - Property path for error reporting
 * @private
 */
function validateSchemaProperty(property: SchemaProperty, path: string): void {
  if (!property.format) {
    throw new ValidationError(
      'Schema property must have a format specified',
      path,
      property,
    );
  }

  // Validate format type
  const validFormats = ['string', 'number', 'boolean', 'json'];
  if (
    typeof property.format === 'string' &&
    !validFormats.includes(property.format)
  ) {
    throw new ValidationError(
      `Invalid format "${property.format}". Must be one of: ${validFormats.join(
        ', ',
      )} or a RegExp`,
      path,
      property.format,
    );
  }

  if (
    !(property.format instanceof RegExp) &&
    typeof property.format !== 'string'
  ) {
    throw new ValidationError(
      'Format must be a string or RegExp',
      path,
      property.format,
    );
  }

  // Validate env property if provided
  if (property.env !== undefined) {
    if (typeof property.env !== 'string' || property.env.trim() === '') {
      throw new ValidationError(
        'Environment variable name must be a non-empty string',
        path,
        property.env,
      );
    }
  }

  // Validate description if provided
  if (
    property.description !== undefined &&
    typeof property.description !== 'string'
  ) {
    throw new ValidationError(
      'Description must be a string',
      path,
      property.description,
    );
  }
}

/**
 * Extract environment variable mappings recursively
 *
 * @param schema - Current schema level to process
 * @param prefix - Current property path prefix
 * @param envMappings - Map to store environment variable mappings
 * @private
 */
function extractEnvMappingsRecursive(
  schema: Schema,
  prefix: string,
  envMappings: Map<string, string>,
): void {
  for (const [key, value] of Object.entries(schema)) {
    const propertyPath = prefix ? `${prefix}.${key}` : key;

    if (isSchemaProperty(value)) {
      // Only create environment variable mappings when explicitly defined
      if (value.env) {
        envMappings.set(value.env, propertyPath);
      }
    } else {
      extractEnvMappingsRecursive(value, propertyPath, envMappings);
    }
  }
}

/**
 * Type guard to check if a value is a SchemaProperty
 *
 * @param value - Value to check
 * @returns True if value is a SchemaProperty, false otherwise
 * @private
 */
function isSchemaProperty(value: unknown): value is SchemaProperty {
  return (
    value !== null &&
    typeof value === 'object' &&
    'format' in value &&
    value.format !== undefined
  );
}

/**
 * Get all property paths from a schema
 *
 * Returns all property paths in dot notation format, useful for
 * introspection and validation purposes.
 *
 * @param schema - The schema to extract paths from
 * @returns Array of all property paths in dot notation
 *
 * @example
 * ```typescript
 * const schema = {
 *   port: { format: 'number' },
 *   database: {
 *     host: { format: 'string' },
 *     port: { format: 'number' }
 *   }
 * };
 * const paths = getPropertyPaths(schema);
 * // Returns: ['port', 'database.host', 'database.port']
 * ```
 */
export function getPropertyPaths(schema: Schema): string[] {
  const paths: string[] = [];
  getPropertyPathsRecursive(schema, '', paths);
  return paths;
}

/**
 * Recursively collect property paths
 *
 * @param schema - Current schema level to process
 * @param prefix - Current property path prefix
 * @param paths - Array to collect property paths
 * @private
 */
function getPropertyPathsRecursive(
  schema: Schema,
  prefix: string,
  paths: string[],
): void {
  for (const [key, value] of Object.entries(schema)) {
    const propertyPath = prefix ? `${prefix}.${key}` : key;

    if (isSchemaProperty(value)) {
      paths.push(propertyPath);
    } else {
      getPropertyPathsRecursive(value, propertyPath, paths);
    }
  }
}

/**
 * Check if a property path exists in the schema
 *
 * Validates whether a given dot-notation property path exists
 * in the schema definition.
 *
 * @param schema - The schema to check
 * @param path - The property path to check (supports dot notation)
 * @returns True if the path exists, false otherwise
 *
 * @example
 * ```typescript
 * const schema = { database: { host: { format: 'string' } } };
 * hasProperty(schema, 'database.host'); // Returns: true
 * hasProperty(schema, 'database.port'); // Returns: false
 * ```
 */
export function hasProperty(schema: Schema, path: string): boolean {
  const parts = path.split('.');
  let current: Schema | SchemaProperty = schema;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return false;
    }
    const next: Schema | SchemaProperty | undefined = (current as Schema)[part];
    if (next === undefined) {
      return false;
    }
    current = next;
  }

  return isSchemaProperty(current);
}

/**
 * Get a specific property definition from the schema
 *
 * Retrieves the SchemaProperty definition for a given property path,
 * supporting dot notation for nested properties.
 *
 * @param schema - The schema to search
 * @param path - The property path to get (supports dot notation)
 * @returns The schema property or undefined if not found
 *
 * @example
 * ```typescript
 * const schema = { database: { host: { format: 'string', default: 'localhost' } } };
 * const property = getProperty(schema, 'database.host');
 * // Returns: { format: 'string', default: 'localhost' }
 * ```
 */
export function getProperty(
  schema: Schema,
  path: string,
): SchemaProperty | undefined {
  const parts = path.split('.');
  let current: Schema | SchemaProperty = schema;

  for (const part of parts) {
    if (!current || typeof current !== 'object' || !(part in current)) {
      return undefined;
    }
    const next: Schema | SchemaProperty | undefined = (current as Schema)[part];
    if (next === undefined) {
      return undefined;
    }
    current = next;
  }

  return isSchemaProperty(current) ? current : undefined;
}
