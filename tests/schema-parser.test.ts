/**
 * Unit tests for SchemaParser class
 */

import {
  extractEnvMappings,
  getProperty,
  getPropertyPaths,
  hasProperty,
  parseSchema,
  validateSchema,
} from '../src/schema-parser';
import { type Schema, ValidationError } from '../src/types';

describe('Schema Parser Functions', () => {
  describe('parse()', () => {
    it('should parse a simple flat schema', () => {
      const schema: Schema = {
        apiUrl: {
          description: 'API base URL',
          format: 'string',
          env: 'API_URL',
          default: 'http://localhost:3000',
        },
        port: {
          description: 'Server port',
          format: 'number',
          default: 3000,
        },
      };

      const result = parseSchema(schema);

      expect(result.properties.size).toBe(2);
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      expect(result.properties.get('apiUrl')).toEqual(schema['apiUrl']);
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      expect(result.properties.get('port')).toEqual(schema['port']);

      expect(result.envMappings.size).toBe(1); // Only apiUrl has explicit env mapping
      expect(result.envMappings.get('API_URL')).toBe('apiUrl');

      expect(result.defaults.size).toBe(2);
      expect(result.defaults.get('apiUrl')).toBe('http://localhost:3000');
      expect(result.defaults.get('port')).toBe(3000);
    });

    it('should parse nested schema objects', () => {
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
          },
          timeout: {
            description: 'API timeout',
            format: 'number',
            default: 5000,
          },
        },
      };

      const result = parseSchema(schema);

      expect(result.properties.size).toBe(4);
      expect(result.properties.get('database.host')).toEqual(
        // biome-ignore lint/complexity/useLiteralKeys: custom implementation
        (schema['database'] as Schema)['host'],
      );
      expect(result.properties.get('database.port')).toEqual(
        // biome-ignore lint/complexity/useLiteralKeys: custom implementation
        (schema['database'] as Schema)['port'],
      );
      expect(result.properties.get('api.url')).toEqual(
        // biome-ignore lint/complexity/useLiteralKeys: custom implementation
        (schema['api'] as Schema)['url'],
      );
      expect(result.properties.get('api.timeout')).toEqual(
        // biome-ignore lint/complexity/useLiteralKeys: custom implementation
        (schema['api'] as Schema)['timeout'],
      );

      expect(result.envMappings.size).toBe(2); // Only database properties have explicit env mappings
      expect(result.envMappings.get('DB_HOST')).toBe('database.host');
      expect(result.envMappings.get('DB_PORT')).toBe('database.port');

      expect(result.defaults.size).toBe(3);
      expect(result.defaults.get('database.host')).toBe('localhost');
      expect(result.defaults.get('database.port')).toBe(5432);
      expect(result.defaults.get('api.timeout')).toBe(5000);
    });

    it('should handle deeply nested schemas', () => {
      const schema: Schema = {
        app: {
          server: {
            http: {
              port: {
                format: 'number',
                default: 8080,
              },
            },
          },
        },
      };

      const result = parseSchema(schema);

      expect(result.properties.size).toBe(1);
      expect(result.properties.get('app.server.http.port')).toEqual(
        // biome-ignore lint/complexity/useLiteralKeys: custom implementation
        (((schema['app'] as Schema)['server'] as Schema)['http'] as Schema)[
          // biome-ignore lint/complexity/useLiteralKeys: custom implementation
          'port'
        ],
      );
      expect(result.envMappings.size).toBe(0); // No explicit env mappings
      expect(result.defaults.get('app.server.http.port')).toBe(8080);
    });

    it('should handle schema with regex format', () => {
      const schema: Schema = {
        email: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          description: 'Email address',
        },
      };

      const result = parseSchema(schema);

      expect(result.properties.size).toBe(1);
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      expect(result.properties.get('email')).toEqual(schema['email']);
    });

    it('should throw ValidationError for invalid schema', () => {
      expect(() => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
        parseSchema(null as any);
      }).toThrow(ValidationError);

      expect(() => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
        parseSchema('invalid' as any);
      }).toThrow(ValidationError);
    });
  });

  describe('validateSchema()', () => {
    it('should validate a correct schema without throwing', () => {
      const schema: Schema = {
        apiUrl: {
          format: 'string',
          description: 'API URL',
        },
        nested: {
          value: {
            format: 'number',
          },
        },
      };

      expect(() => validateSchema(schema)).not.toThrow();
    });

    it('should throw ValidationError for null or undefined schema', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(null as any)).toThrow(ValidationError);
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(undefined as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for non-object schema', () => {
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema('string' as any)).toThrow(ValidationError);
      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(123 as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for empty key names', () => {
      const schema = {
        '': {
          format: 'string',
        },
      };

      expect(() => validateSchema(schema)).toThrow(ValidationError);
    });

    it('should throw ValidationError for missing format', () => {
      const schema = {
        apiUrl: {
          description: 'API URL',
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(schema as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid format type', () => {
      const schema = {
        apiUrl: {
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid format
          format: 'invalid-format' as any,
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(schema as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid env property', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          env: '',
        },
      };

      expect(() => validateSchema(schema)).toThrow(ValidationError);

      const schema2 = {
        apiUrl: {
          format: 'string',
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid env type
          env: 123 as any,
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(schema2 as any)).toThrow(ValidationError);
    });

    it('should throw ValidationError for invalid description', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid description type
          description: 123 as any,
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => validateSchema(schema as any)).toThrow(ValidationError);
    });

    it('should validate all supported formats', () => {
      const schema: Schema = {
        stringProp: { format: 'string' },
        numberProp: { format: 'number' },
        booleanProp: { format: 'boolean' },
        jsonProp: { format: 'json' },
        regexProp: { format: /^test/ },
      };

      expect(() => validateSchema(schema)).not.toThrow();
    });
  });

  describe('extractEnvMappings()', () => {
    it('should extract environment variable mappings from flat schema', () => {
      const schema: Schema = {
        apiUrl: {
          format: 'string',
          env: 'API_URL',
        },
        port: {
          format: 'number',
          // No env specified, should use uppercase key
        },
      };

      const mappings = extractEnvMappings(schema);

      expect(mappings.size).toBe(1); // Only apiUrl has explicit env mapping
      expect(mappings.get('API_URL')).toBe('apiUrl');
    });

    it('should extract environment variable mappings from nested schema', () => {
      const schema: Schema = {
        database: {
          host: {
            format: 'string',
            env: 'DB_HOST',
          },
          port: {
            format: 'number',
            env: 'DB_PORT',
          },
        },
        api: {
          url: {
            format: 'string',
            // Should use uppercase key path
          },
        },
      };

      const mappings = extractEnvMappings(schema);

      expect(mappings.size).toBe(2); // Only database properties have explicit env mappings
      expect(mappings.get('DB_HOST')).toBe('database.host');
      expect(mappings.get('DB_PORT')).toBe('database.port');
    });
  });

  describe('getPropertyPaths()', () => {
    it('should return all property paths from flat schema', () => {
      const schema: Schema = {
        apiUrl: { format: 'string' },
        port: { format: 'number' },
        debug: { format: 'boolean' },
      };

      const paths = getPropertyPaths(schema);

      expect(paths).toHaveLength(3);
      expect(paths).toContain('apiUrl');
      expect(paths).toContain('port');
      expect(paths).toContain('debug');
    });

    it('should return all property paths from nested schema', () => {
      const schema: Schema = {
        database: {
          host: { format: 'string' },
          port: { format: 'number' },
        },
        api: {
          url: { format: 'string' },
          timeout: { format: 'number' },
        },
      };

      const paths = getPropertyPaths(schema);

      expect(paths).toHaveLength(4);
      expect(paths).toContain('database.host');
      expect(paths).toContain('database.port');
      expect(paths).toContain('api.url');
      expect(paths).toContain('api.timeout');
    });
  });

  describe('hasProperty()', () => {
    const schema: Schema = {
      apiUrl: { format: 'string' },
      database: {
        host: { format: 'string' },
        port: { format: 'number' },
      },
    };

    it('should return true for existing properties', () => {
      expect(hasProperty(schema, 'apiUrl')).toBe(true);
      expect(hasProperty(schema, 'database.host')).toBe(true);
      expect(hasProperty(schema, 'database.port')).toBe(true);
    });

    it('should return false for non-existing properties', () => {
      expect(hasProperty(schema, 'nonExistent')).toBe(false);
      expect(hasProperty(schema, 'database.nonExistent')).toBe(false);
      expect(hasProperty(schema, 'database')).toBe(false); // This is a nested object, not a property
    });
  });

  describe('getProperty()', () => {
    const schema: Schema = {
      apiUrl: {
        format: 'string',
        description: 'API URL',
        default: 'http://localhost',
      },
      database: {
        host: {
          format: 'string',
          env: 'DB_HOST',
        },
        port: {
          format: 'number',
          default: 5432,
        },
      },
    };

    it('should return property definition for existing properties', () => {
      const apiUrlProp = getProperty(schema, 'apiUrl');
      expect(apiUrlProp).toEqual({
        format: 'string',
        description: 'API URL',
        default: 'http://localhost',
      });

      const dbHostProp = getProperty(schema, 'database.host');
      expect(dbHostProp).toEqual({
        format: 'string',
        env: 'DB_HOST',
      });
    });

    it('should return undefined for non-existing properties', () => {
      expect(getProperty(schema, 'nonExistent')).toBeUndefined();
      expect(getProperty(schema, 'database.nonExistent')).toBeUndefined();
      expect(getProperty(schema, 'database')).toBeUndefined(); // Nested object, not a property
    });
  });

  describe('edge cases', () => {
    it('should handle empty schema', () => {
      const schema: Schema = {};
      const result = parseSchema(schema);

      expect(result.properties.size).toBe(0);
      expect(result.envMappings.size).toBe(0);
      expect(result.defaults.size).toBe(0);
    });

    it('should handle schema with only nested objects', () => {
      const schema: Schema = {
        level1: {
          level2: {
            prop: {
              format: 'string',
            },
          },
        },
      };

      const result = parseSchema(schema);

      expect(result.properties.size).toBe(1);
      expect(result.properties.get('level1.level2.prop')).toEqual({
        format: 'string',
      });
    });

    it('should handle properties without defaults', () => {
      const schema: Schema = {
        required: {
          format: 'string',
        },
      };

      const result = parseSchema(schema);

      expect(result.defaults.size).toBe(0);
      expect(result.properties.size).toBe(1);
    });

    it('should handle complex default values', () => {
      const schema: Schema = {
        config: {
          format: 'json',
          default: { key: 'value', nested: { prop: 123 } },
        },
      };

      const result = parseSchema(schema);

      expect(result.defaults.get('config')).toEqual({
        key: 'value',
        nested: { prop: 123 },
      });
    });
  });
});
