/**
 * Core type definitions for Envict configuration management package
 */

/**
 * Schema property definition for configuration validation
 */
export interface SchemaProperty {
  /** Human-readable description of the configuration property */
  description?: string;
  /** Data type or validation format for the property */
  format: string | RegExp;
  /** Environment variable name to read from (defaults to property key if not specified) */
  env?: string;
  /** Default value to use when no environment variable or file value is provided */
  // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
  default?: any;
}

/**
 * Configuration schema definition supporting nested objects
 */
export interface Schema {
  [key: string]: SchemaProperty | Schema;
}

/**
 * Interface for async configuration loaders
 */
export interface AsyncLoader {
  /**
   * Load configuration data asynchronously
   * @returns Promise that resolves to configuration data
   */
  load(): Promise<Record<string, unknown>>;
}

/**
 * Options for async configuration writing
 */
export interface AsyncWriteOptions {
  /** Directory path where the file should be written */
  path: string;
  /** Name of the file to write */
  fileName: string;
  /** Output format for the configuration file */
  format?: 'json' | 'env';
  /** Optional path to select a specific portion of the configuration to write */
  select?: string;
  /** Optional fallback path if the select path doesn't exist */
  fallback?: string;
}

/**
 * Options for initializing Envict instance
 */
export interface EnvictOptions {
  /** Configuration schema defining structure and validation rules */
  schema?: Schema;
  /** Path to JSON configuration file to load */
  file?: string;
  /** Custom environment variables object (defaults to process.env) */
  env?: Record<string, string>;
}

/**
 * Internal parsed schema structure for efficient processing
 */
export interface ParsedSchema {
  /** Flattened property definitions with dot notation keys */
  properties: Map<string, SchemaProperty>;
  /** Environment variable to property key mappings */
  envMappings: Map<string, string>;
  /** Default values for properties */
  // biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
  defaults: Map<string, any>;
}

/**
 * Result of validation operations
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Array of validation errors if any */
  errors: ValidationError[];
}

/**
 * Internal configuration storage structure
 */
// biome-ignore lint/suspicious/noExplicitAny: Configuration values can be of any type
export type ConfigStore = Map<string, any>;

/**
 * Nested configuration object that supports dot notation access
 */
export interface NestedConfigObject {
  [key: string]: unknown;
}

/**
 * Utility type for extracting nested property paths
 */
export type PropertyPath<T> = T extends object
  ? {
      [K in keyof T]: K extends string
        ? T[K] extends object
          ? K | `${K}.${PropertyPath<T[K]>}`
          : K
        : never;
    }[keyof T]
  : never;

/**
 * Utility type for getting nested property value types
 */
export type PropertyValue<T, P extends string> = P extends keyof T
  ? T[P]
  : P extends `${infer K}.${infer Rest}`
    ? K extends keyof T
      ? PropertyValue<T[K], Rest>
      : never
    : never;

/**
 * Base error class for all Envict-related errors
 */
export class EnvictError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'EnvictError';
    this.code = code;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, EnvictError.prototype);
  }
}

/**
 * Error thrown when configuration validation fails
 */
export class ValidationError extends EnvictError {
  public readonly property: string;
  // biome-ignore lint/suspicious/noExplicitAny: Error values can be of any type
  public readonly value: any;

  // biome-ignore lint/suspicious/noExplicitAny: Error values can be of any type
  constructor(message: string, property: string, value: any) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.property = property;
    this.value = value;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Error thrown when type parsing or conversion fails
 */
export class ParseError extends EnvictError {
  public readonly property: string;
  // biome-ignore lint/suspicious/noExplicitAny: Error values can be of any type
  public readonly value: any;

  // biome-ignore lint/suspicious/noExplicitAny: Error values can be of any type
  constructor(message: string, property: string, value: any) {
    super(message, 'PARSE_ERROR');
    this.name = 'ParseError';
    this.property = property;
    this.value = value;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

/**
 * Error thrown when file operations fail
 */
export class FileError extends EnvictError {
  public readonly filePath: string;

  constructor(message: string, filePath: string) {
    super(message, 'FILE_ERROR');
    this.name = 'FileError';
    this.filePath = filePath;

    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, FileError.prototype);
  }
}
