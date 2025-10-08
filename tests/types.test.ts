/**
 * Tests for core type definitions and error classes
 */

import {
  EnvictError,
  type EnvictOptions,
  FileError,
  ParseError,
  type Schema,
  type SchemaProperty,
  ValidationError,
} from '../src/types';

describe('Core Types', () => {
  describe('SchemaProperty interface', () => {
    it('should allow valid schema property definitions', () => {
      const stringProperty: SchemaProperty = {
        description: 'A string property',
        format: 'string',
        env: 'STRING_VAR',
        default: 'default-value',
      };

      const numberProperty: SchemaProperty = {
        description: 'A number property',
        format: 'number',
        default: 42,
      };

      const booleanProperty: SchemaProperty = {
        format: 'boolean',
      };

      const regexProperty: SchemaProperty = {
        format: /^https?:\/\/.+/,
        description: 'URL validation',
      };

      expect(stringProperty.format).toBe('string');
      expect(numberProperty.format).toBe('number');
      expect(booleanProperty.format).toBe('boolean');
      expect(regexProperty.format).toBeInstanceOf(RegExp);
    });
  });

  describe('Schema interface', () => {
    it('should allow nested schema definitions', () => {
      const schema: Schema = {
        database: {
          host: {
            description: 'Database host',
            format: 'string',
            env: 'DB_HOST',
            default: 'localhost',
          },
          port: {
            description: 'Database port',
            format: 'number',
            env: 'DB_PORT',
            default: 5432,
          },
        },
        api: {
          url: {
            description: 'API URL',
            format: /^https?:\/\/.+/,
            env: 'API_URL',
          },
        },
      };

      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      expect(schema['database']).toBeDefined();
      // biome-ignore lint/complexity/useLiteralKeys: TypeScript requires bracket notation for index signatures
      expect(schema['api']).toBeDefined();
    });
  });

  describe('EnvictOptions interface', () => {
    it('should allow valid options configurations', () => {
      const options: EnvictOptions = {
        schema: {
          test: {
            format: 'string',
            default: 'test',
          },
        },
        file: './config.json',
        env: { TEST_VAR: 'test-value' },
      };

      expect(options.schema).toBeDefined();
      expect(options.file).toBe('./config.json');
      expect(options.env).toEqual({ TEST_VAR: 'test-value' });
    });
  });
});

describe('Error Classes', () => {
  describe('EnvictError', () => {
    it('should create error with message and code', () => {
      const error = new EnvictError('Test error', 'TEST_ERROR');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvictError);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.name).toBe('EnvictError');
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with property and value', () => {
      const error = new ValidationError(
        'Invalid value',
        'testProperty',
        'invalid',
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvictError);
      expect(error).toBeInstanceOf(ValidationError);
      expect(error.message).toBe('Invalid value');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.property).toBe('testProperty');
      expect(error.value).toBe('invalid');
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('ParseError', () => {
    it('should create parse error with property and value', () => {
      const error = new ParseError(
        'Parse failed',
        'numberProperty',
        'not-a-number',
      );

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvictError);
      expect(error).toBeInstanceOf(ParseError);
      expect(error.message).toBe('Parse failed');
      expect(error.code).toBe('PARSE_ERROR');
      expect(error.property).toBe('numberProperty');
      expect(error.value).toBe('not-a-number');
      expect(error.name).toBe('ParseError');
    });
  });

  describe('FileError', () => {
    it('should create file error with file path', () => {
      const error = new FileError('File not found', '/path/to/config.json');

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(EnvictError);
      expect(error).toBeInstanceOf(FileError);
      expect(error.message).toBe('File not found');
      expect(error.code).toBe('FILE_ERROR');
      expect(error.filePath).toBe('/path/to/config.json');
      expect(error.name).toBe('FileError');
    });
  });
});
