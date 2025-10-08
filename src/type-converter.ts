/**
 * Type conversion and validation utilities for Envict configuration management
 */

import { ParseError, type SchemaProperty, ValidationError } from './types';

/**
 * Detect circular references in an object using WeakSet for efficient tracking
 * @param obj - Object to check for circular references
 * @param property - Property name for error reporting
 * @param visited - WeakSet of already visited objects
 * @param path - Current path in the object for detailed error messages
 * @throws ParseError if circular reference is detected
 */
function detectCircularReferences(
  obj: unknown,
  property: string,
  visited: WeakSet<object> = new WeakSet(),
  path: string[] = [],
): void {
  // Only check objects and arrays
  if (obj === null || typeof obj !== 'object') {
    return;
  }

  // Check if we've already visited this object
  if (visited.has(obj)) {
    const pathStr = path.length > 0 ? ` at path: ${path.join('.')}` : '';
    throw new ParseError(
      `Circular reference detected in object${pathStr}. Cannot convert to string.`,
      property,
      obj,
    );
  }

  // Add current object to visited set
  visited.add(obj);

  try {
    // Recursively check all properties
    if (Array.isArray(obj)) {
      // Handle arrays
      for (let i = 0; i < obj.length; i++) {
        detectCircularReferences(obj[i], property, visited, [
          ...path,
          `[${i}]`,
        ]);
      }
    } else {
      // Handle objects
      for (const [key, value] of Object.entries(obj)) {
        detectCircularReferences(value, property, visited, [...path, key]);
      }

      // Also check symbol properties
      const symbolKeys = Object.getOwnPropertySymbols(obj);
      for (const symbolKey of symbolKeys) {
        const descriptor = Object.getOwnPropertyDescriptor(obj, symbolKey);
        if (descriptor?.enumerable) {
          detectCircularReferences(
            (obj as Record<symbol, unknown>)[symbolKey],
            property,
            visited,
            [...path, `[${String(symbolKey)}]`],
          );
        }
      }
    }
  } finally {
    // Remove current object from visited set to allow it to appear in other branches
    visited.delete(obj);
  }
}

/**
 * Convert a value to the specified format with validation
 * @param value - The value to convert
 * @param format - The target format or validation pattern
 * @param property - Property name for error reporting
 * @returns The converted and validated value
 * @throws {ParseError} When type conversion fails
 * @throws {ValidationError} When validation fails
 */
export function convertValue(
  value: unknown,
  format: SchemaProperty['format'],
  property: string,
): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  // Handle regex format validation
  if (format instanceof RegExp) {
    return validateRegex(value, format, property);
  }

  // Handle built-in type conversions
  switch (format) {
    case 'string':
      return convertToString(value, property);
    case 'number':
      return convertToNumber(value, property);
    case 'boolean':
      return convertToBoolean(value, property);
    case 'json':
      return convertToJSON(value, property);
    default:
      throw new ValidationError(
        `Unsupported format: ${String(format)}`,
        property,
        value,
      );
  }
}

/**
 * Convert value to string
 *
 * Handles conversion of various types to string format, including
 * primitive types, objects (via JSON.stringify), and arrays.
 *
 * @param value - Value to convert
 * @param property - Property name for error reporting
 * @returns String value
 * @private
 */
function convertToString(value: unknown, property: string): string {
  if (typeof value === 'string') {
    return value;
  }

  // Convert other primitive types to string
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  // Handle null and undefined
  if (value === null) {
    throw new ParseError(
      'Cannot convert null value to a string.',
      property,
      value,
    );
  }
  if (value === undefined) {
    throw new ParseError(
      'Cannot convert undefined value to a string.',
      property,
      value,
    );
  }

  // For objects and arrays, convert to JSON string
  if (typeof value === 'object') {
    try {
      // Check for circular references before attempting JSON.stringify
      detectCircularReferences(value, property);
      return JSON.stringify(value);
    } catch (error) {
      if (error instanceof ParseError) {
        throw error; // Re-throw our circular reference error
      }
      throw new ParseError(
        `Failed to convert object to string: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        property,
        value,
      );
    }
  }

  return String(value);
}

/**
 * Convert value to number
 *
 * Converts strings, booleans, and existing numbers to numeric values.
 * Provides detailed error messages for invalid conversions.
 *
 * @param value - Value to convert
 * @param property - Property name for error reporting
 * @returns Number value
 * @throws {ParseError} When conversion fails
 * @private
 */
function convertToNumber(value: unknown, property: string): number {
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      throw new ParseError(
        'Value is NaN and cannot be used as a number. Expected a valid numeric value.',
        property,
        value,
      );
    }
    return value;
  }

  if (typeof value === 'string') {
    // Handle empty strings
    if (value.trim() === '') {
      throw new ParseError(
        `Cannot convert empty string to number. Expected a numeric string like "123", "45.67", or "-89".`,
        property,
        value,
      );
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new ParseError(
        `Cannot convert "${value}" to number. Expected a valid numeric string like "123", "45.67", or "-89".`,
        property,
        value,
      );
    }
    return parsed;
  }

  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }

  throw new ParseError(
    `Cannot convert ${typeof value} to number. Expected a string, number, or boolean value.`,
    property,
    value,
  );
}

/**
 * Convert value to boolean
 *
 * Converts strings ('true', 'false', '1', '0'), numbers (1, 0),
 * and existing booleans to boolean values. Case-insensitive for strings.
 *
 * @param value - Value to convert
 * @param property - Property name for error reporting
 * @returns Boolean value
 * @throws {ParseError} When conversion fails
 * @private
 */
function convertToBoolean(value: unknown, property: string): boolean {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const lowercased = value.toLowerCase().trim();

    // Handle common truthy string values
    if (lowercased === 'true' || lowercased === '1') {
      return true;
    }

    // Handle common falsy string values
    if (lowercased === 'false' || lowercased === '0') {
      return false;
    }

    throw new ParseError(
      `Cannot convert "${value}" to boolean. Expected: true, false, 1, or 0 (case insensitive)`,
      property,
      value,
    );
  }

  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;

    throw new ParseError(
      `Cannot convert number ${value} to boolean. Expected: 1 (true) or 0 (false)`,
      property,
      value,
    );
  }

  throw new ParseError(
    `Cannot convert ${typeof value} to boolean`,
    property,
    value,
  );
}

/**
 * Parse JSON string to object
 * @param value - Value to parse as JSON
 * @param property - Property name for error reporting
 * @returns Parsed JSON object
 * @throws {ParseError} When JSON parsing fails
 */
function convertToJSON(value: unknown, property: string): unknown {
  if (typeof value !== 'string') {
    throw new ParseError(
      `JSON format expects a string value, got ${typeof value}. Expected a valid JSON string like '{"key": "value"}' or '[1, 2, 3]'.`,
      property,
      value,
    );
  }

  if (value.trim() === '') {
    throw new ParseError(
      `Cannot parse empty string as JSON. Expected a valid JSON string like '{"key": "value"}', '[1, 2, 3]', or '"string"'.`,
      property,
      value,
    );
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown parsing error';
    throw new ParseError(
      `Invalid JSON: ${errorMessage}. Expected valid JSON syntax like '{"key": "value"}', '[1, 2, 3]', or '"string"'.`,
      property,
      value,
    );
  }
}

/**
 * Validate value against regex pattern
 *
 * Converts the value to string and validates it against the provided
 * regular expression pattern. Returns the string value if valid.
 *
 * @param value - Value to validate
 * @param pattern - Regex pattern to validate against
 * @param property - Property name for error reporting
 * @returns The string value if validation passes
 * @throws {ValidationError} When validation fails
 * @private
 */
function validateRegex(
  value: unknown,
  pattern: RegExp,
  property: string,
): string {
  // Convert to string for regex validation
  const stringValue = convertToString(value, property);

  if (!pattern.test(stringValue)) {
    throw new ValidationError(
      `Value "${stringValue}" does not match required pattern: ${pattern.toString()}`,
      property,
      value,
    );
  }

  return stringValue;
}

/**
 * Check if a value can be converted to the specified format without throwing
 * @param value - Value to check
 * @param format - Target format
 * @returns True if conversion is possible, false otherwise
 */
export function canConvert(
  value: unknown,
  format: SchemaProperty['format'],
): boolean {
  try {
    convertValue(value, format, 'test');
    return true;
  } catch {
    return false;
  }
}
