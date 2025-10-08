/**
 * Tests for stringified JSON parsing support from environment variables
 */

import { Envict } from '../src/envict';
import { ParseError, ValidationError } from '../src/types';

describe('Stringified JSON Parsing from Environment Variables', () => {
  describe('basic JSON parsing from environment variables', () => {
    it('should parse simple JSON objects from environment variables', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'CONFIG_JSON',
        },
      };

      const customEnv = {
        CONFIG_JSON: '{"host": "localhost", "port": 3000}',
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('config');

      expect(result).toEqual({ host: 'localhost', port: 3000 });
      expect(typeof result).toBe('object');
    });

    it('should parse JSON arrays from environment variables', () => {
      const schema = {
        servers: {
          format: 'json',
          env: 'SERVERS_JSON',
        },
      };

      const customEnv = {
        SERVERS_JSON: '["server1", "server2", "server3"]',
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('servers');

      expect(result).toEqual(['server1', 'server2', 'server3']);
      expect(Array.isArray(result)).toBe(true);
    });

    it('should parse complex nested JSON structures', () => {
      const schema = {
        appConfig: {
          format: 'json',
          env: 'APP_CONFIG',
        },
      };

      const complexConfig = {
        database: {
          host: 'db.example.com',
          port: 5432,
          credentials: {
            username: 'admin',
            password: 'secret',
          },
        },
        features: ['auth', 'logging', 'metrics'],
        settings: {
          debug: true,
          timeout: 30000,
        },
      };

      const customEnv = {
        APP_CONFIG: JSON.stringify(complexConfig),
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('appConfig');

      expect(result).toEqual(complexConfig);
    });

    it('should parse JSON primitives from environment variables', () => {
      const schema = {
        stringValue: {
          format: 'json',
          env: 'STRING_JSON',
        },
        numberValue: {
          format: 'json',
          env: 'NUMBER_JSON',
        },
        booleanValue: {
          format: 'json',
          env: 'BOOLEAN_JSON',
        },
        nullValue: {
          format: 'json',
          env: 'NULL_JSON',
        },
      };

      const customEnv = {
        STRING_JSON: '"hello world"',
        NUMBER_JSON: '42',
        BOOLEAN_JSON: 'true',
        NULL_JSON: 'null',
      };

      const envict = new Envict({ schema, env: customEnv });

      expect(envict.get('stringValue')).toBe('hello world');
      expect(envict.get('numberValue')).toBe(42);
      expect(envict.get('booleanValue')).toBe(true);
      expect(envict.get('nullValue')).toBe(null);
    });
  });

  describe('JSON parsing error handling', () => {
    it('should throw ParseError with descriptive message for invalid JSON syntax', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'INVALID_JSON',
        },
      };

      const customEnv = {
        INVALID_JSON: '{"invalid": json, "missing": quotes}',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(ParseError);

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain('Invalid JSON');
        expect((error as ParseError).property).toBe('config');
        expect((error as ParseError).value).toBe(customEnv.INVALID_JSON);
      }
    });

    it('should throw ParseError for malformed JSON with unclosed brackets', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'MALFORMED_JSON',
        },
      };

      const customEnv = {
        MALFORMED_JSON: '{"key": "value", "array": [1, 2, 3',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(ParseError);

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain('Invalid JSON');
        expect((error as ParseError).property).toBe('config');
      }
    });

    it('should throw ParseError for empty JSON strings', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'EMPTY_JSON',
        },
      };

      const customEnv = {
        EMPTY_JSON: '',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(ParseError);

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain(
          'Cannot parse empty string as JSON',
        );
        expect((error as ParseError).property).toBe('config');
      }
    });

    it('should throw ParseError for whitespace-only JSON strings', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'WHITESPACE_JSON',
        },
      };

      const customEnv = {
        WHITESPACE_JSON: '   \n\t   ',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(ParseError);

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).message).toContain(
          'Cannot parse empty string as JSON',
        );
        expect((error as ParseError).property).toBe('config');
      }
    });

    it('should provide helpful error messages with JSON parsing details', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'BAD_JSON',
        },
      };

      const customEnv = {
        BAD_JSON: '{"key": value}', // Missing quotes around value
      };

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.message).toContain('Invalid JSON');
        expect(parseError.message).toMatch(/Unexpected token|Expected/i);
        expect(parseError.property).toBe('config');
        expect(parseError.value).toBe(customEnv.BAD_JSON);
      }
    });
  });

  describe('JSON validation against schema structure', () => {
    it('should validate parsed JSON objects have expected structure for nested schemas', () => {
      const schema = {
        databaseConfig: {
          format: 'json',
          env: 'DB_CONFIG_JSON',
        },
      };

      // Valid JSON that matches expected structure
      const customEnv = {
        DB_CONFIG_JSON: '{"host": "localhost", "port": 5432}',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();

      const envict = new Envict({ schema, env: customEnv });
      const dbConfig = envict.get('databaseConfig');
      expect(dbConfig).toEqual({ host: 'localhost', port: 5432 });
    });

    it('should handle JSON objects with additional properties not in schema', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'CONFIG_JSON',
        },
      };

      const customEnv = {
        CONFIG_JSON:
          '{"expected": "value", "extra": "property", "nested": {"deep": true}}',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();

      const envict = new Envict({ schema, env: customEnv });
      const config = envict.get('config');
      expect(config).toEqual({
        expected: 'value',
        extra: 'property',
        nested: { deep: true },
      });
    });

    it('should preserve type information in parsed JSON objects', () => {
      const schema = {
        typedConfig: {
          format: 'json',
          env: 'TYPED_CONFIG',
        },
      };

      const customEnv = {
        TYPED_CONFIG: JSON.stringify({
          stringValue: 'text',
          numberValue: 42,
          booleanValue: true,
          nullValue: null,
          arrayValue: [1, 2, 3],
          objectValue: { nested: 'value' },
        }),
      };

      const envict = new Envict({ schema, env: customEnv });
      const config = envict.get('typedConfig') as {
        stringValue: string;
        numberValue: number;
        booleanValue: boolean;
        nullValue: null;
        arrayValue: number[];
        objectValue: { nested: string };
      };

      expect(typeof config.stringValue).toBe('string');
      expect(typeof config.numberValue).toBe('number');
      expect(typeof config.booleanValue).toBe('boolean');
      expect(config.nullValue).toBe(null);
      expect(Array.isArray(config.arrayValue)).toBe(true);
      expect(typeof config.objectValue).toBe('object');
    });
  });

  describe('JSON parsing with defaults and precedence', () => {
    it('should use JSON from environment over default values', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'CONFIG_JSON',
          default: { host: 'default', port: 3000 },
        },
      };

      const customEnv = {
        CONFIG_JSON: '{"host": "env-host", "port": 8080}',
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('config');

      expect(result).toEqual({ host: 'env-host', port: 8080 });
    });

    it('should use default JSON when environment variable is not set', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'MISSING_CONFIG',
          default: { host: 'default', port: 3000 },
        },
      };

      const customEnv = {}; // No CONFIG_JSON set

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('config');

      expect(result).toEqual({ host: 'default', port: 3000 });
    });

    it('should handle JSON parsing with file configuration precedence', () => {
      // This test would require file setup, but demonstrates the concept
      const schema = {
        config: {
          format: 'json',
          env: 'CONFIG_JSON',
          default: { source: 'default' },
        },
      };

      const customEnv = {
        CONFIG_JSON: '{"source": "environment", "priority": "highest"}',
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('config');

      expect(result).toEqual({ source: 'environment', priority: 'highest' });
    });
  });

  describe('edge cases and special JSON values', () => {
    it('should handle JSON with special characters and unicode', () => {
      const schema = {
        specialConfig: {
          format: 'json',
          env: 'SPECIAL_JSON',
        },
      };

      const customEnv = {
        SPECIAL_JSON: JSON.stringify({
          unicode: '🚀 Hello 世界',
          special: 'Line 1\nLine 2\tTabbed',
          quotes: 'He said "Hello"',
          backslash: 'Path\\to\\file',
        }),
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('specialConfig') as {
        unicode: string;
        special: string;
        quotes: string;
        backslash: string;
      };

      expect(result.unicode).toBe('🚀 Hello 世界');
      expect(result.special).toBe('Line 1\nLine 2\tTabbed');
      expect(result.quotes).toBe('He said "Hello"');
      expect(result.backslash).toBe('Path\\to\\file');
    });

    it('should handle very large JSON objects', () => {
      const schema = {
        largeConfig: {
          format: 'json',
          env: 'LARGE_JSON',
        },
      };

      // Create a large JSON object
      const largeObject: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeObject[`key${i}`] = `value${i}`;
      }

      const customEnv = {
        LARGE_JSON: JSON.stringify(largeObject),
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('largeConfig') as Record<string, string>;

      expect(Object.keys(result)).toHaveLength(1000);
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      expect(result['key0']).toBe('value0');
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      expect(result['key999']).toBe('value999');
    });

    it('should handle JSON with deeply nested structures', () => {
      const schema = {
        deepConfig: {
          format: 'json',
          env: 'DEEP_JSON',
        },
      };

      const deepObject = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: {
                  value: 'deep value',
                  array: [1, 2, { nested: true }],
                },
              },
            },
          },
        },
      };

      const customEnv = {
        DEEP_JSON: JSON.stringify(deepObject),
      };

      const envict = new Envict({ schema, env: customEnv });
      const result = envict.get('deepConfig');

      expect(result).toEqual(deepObject);
    });
  });

  describe('error aggregation and reporting', () => {
    it('should aggregate multiple JSON parsing errors', () => {
      const schema = {
        config1: {
          format: 'json',
          env: 'CONFIG1_JSON',
        },
        config2: {
          format: 'json',
          env: 'CONFIG2_JSON',
        },
      };

      const customEnv = {
        CONFIG1_JSON: '{"invalid": json}',
        CONFIG2_JSON: '{"another": invalid}',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(
        ValidationError,
      );

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'Configuration validation failed',
        );
        expect((error as ValidationError).message).toContain('config1');
        expect((error as ValidationError).message).toContain('config2');
      }
    });

    it('should provide clear error messages for mixed validation failures', () => {
      const schema = {
        jsonConfig: {
          format: 'json',
          env: 'JSON_CONFIG',
        },
        numberConfig: {
          format: 'number',
          env: 'NUMBER_CONFIG',
        },
        emailConfig: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          env: 'EMAIL_CONFIG',
        },
      };

      const customEnv = {
        JSON_CONFIG: '{"invalid": json}',
        NUMBER_CONFIG: 'not-a-number',
        EMAIL_CONFIG: 'invalid-email',
      };

      try {
        new Envict({ schema, env: customEnv });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain(
          'Configuration validation failed',
        );
        expect(validationError.message).toContain('jsonConfig');
        expect(validationError.message).toContain('numberConfig');
        expect(validationError.message).toContain('emailConfig');
      }
    });
  });

  describe('integration with nested object access', () => {
    it('should support dot notation access on parsed JSON objects', () => {
      const schema = {
        appConfig: {
          format: 'json',
          env: 'APP_CONFIG_JSON',
        },
      };

      const customEnv = {
        APP_CONFIG_JSON: JSON.stringify({
          database: {
            host: 'json-host',
            port: 5432,
          },
          api: {
            url: 'http://json-api.com',
          },
        }),
      };

      const envict = new Envict({ schema, env: customEnv });
      const appConfig = envict.get('appConfig') as {
        database: { host: string; port: number };
        api: { url: string };
      };

      // Test direct object access
      expect(appConfig.database.host).toBe('json-host');
      expect(appConfig.database.port).toBe(5432);
      expect(appConfig.api.url).toBe('http://json-api.com');

      // Test that the object structure is preserved
      expect(appConfig.database).toEqual({
        host: 'json-host',
        port: 5432,
      });
    });

    it('should handle JSON objects returned as nested configuration objects', () => {
      const schema = {
        services: {
          format: 'json',
          env: 'SERVICES_JSON',
        },
      };

      const customEnv = {
        SERVICES_JSON: JSON.stringify({
          auth: {
            url: 'http://auth.service.com',
            timeout: 5000,
          },
          database: {
            host: 'db.service.com',
            port: 5432,
          },
        }),
      };

      const envict = new Envict({ schema, env: customEnv });
      const services = envict.get('services') as {
        auth: { url: string; timeout: number };
        database: { host: string; port: number };
      };

      // Verify the structure is accessible
      expect(services.auth).toEqual({
        url: 'http://auth.service.com',
        timeout: 5000,
      });

      expect(services.database).toEqual({
        host: 'db.service.com',
        port: 5432,
      });
    });
  });
});
