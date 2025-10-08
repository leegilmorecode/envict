/**
 * Tests for runtime file loading with the load() method
 */

import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../src/envict';
import { FileError, ParseError, ValidationError } from '../src/types';

describe('Runtime File Loading with load() Method', () => {
  const testConfigPath1 = join(__dirname, 'test-config-1.json');
  const testConfigPath2 = join(__dirname, 'test-config-2.json');
  const testConfigPath3 = join(__dirname, 'test-config-3.json');

  // Clean up test files after each test
  afterEach(() => {
    for (const path of [testConfigPath1, testConfigPath2, testConfigPath3]) {
      if (existsSync(path)) {
        unlinkSync(path);
      }
    }
  });

  describe('basic runtime loading', () => {
    it('should load JSON file at runtime and merge with existing configuration', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          default: 'http://default.com',
        },
        port: {
          format: 'number',
          default: 3000,
        },
        debug: {
          format: 'boolean',
          default: false,
        },
      };

      // Create runtime config file
      const runtimeConfig = {
        apiUrl: 'http://runtime.com',
        port: 8080,
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema });

      // Verify initial defaults
      expect(envict.get('apiUrl')).toBe('http://default.com');
      expect(envict.get('port')).toBe(3000);
      expect(envict.get('debug')).toBe(false);

      // Load runtime configuration
      const result = envict.load(testConfigPath1);

      // Should return the same instance for chaining
      expect(result).toBe(envict);

      // Verify merged configuration
      expect(envict.get('apiUrl')).toBe('http://runtime.com');
      expect(envict.get('port')).toBe(8080);
      expect(envict.get('debug')).toBe(false); // Unchanged
    });

    it('should support method chaining', () => {
      const schema = {
        value1: {
          format: 'string',
          default: 'default1',
        },
        value2: {
          format: 'string',
          default: 'default2',
        },
        value3: {
          format: 'string',
          default: 'default3',
        },
      };

      // Create multiple config files
      writeFileSync(testConfigPath1, JSON.stringify({ value1: 'file1' }));
      writeFileSync(testConfigPath2, JSON.stringify({ value2: 'file2' }));
      writeFileSync(testConfigPath3, JSON.stringify({ value3: 'file3' }));

      const envict = new Envict({ schema });

      // Chain multiple load calls
      const result = envict
        .load(testConfigPath1)
        .load(testConfigPath2)
        .load(testConfigPath3);

      expect(result).toBe(envict);
      expect(envict.get('value1')).toBe('file1');
      expect(envict.get('value2')).toBe('file2');
      expect(envict.get('value3')).toBe('file3');
    });

    it('should handle nested configuration objects', () => {
      const schema = {
        database: {
          host: {
            format: 'string',
            default: 'localhost',
          },
          port: {
            format: 'number',
            default: 5432,
          },
        },
        api: {
          url: {
            format: 'string',
            default: 'http://api.com',
          },
        },
      };

      const runtimeConfig = {
        database: {
          host: 'runtime-db.com',
          port: 5433,
        },
        api: {
          url: 'http://runtime-api.com',
        },
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema });
      envict.load(testConfigPath1);

      expect(envict.get('database.host')).toBe('runtime-db.com');
      expect(envict.get('database.port')).toBe(5433);
      expect(envict.get('api.url')).toBe('http://runtime-api.com');

      const database = envict.get('database');
      expect(database).toEqual({
        host: 'runtime-db.com',
        port: 5433,
      });
    });
  });

  describe('merging behavior and precedence', () => {
    it('should merge runtime config with constructor file config', () => {
      const schema = {
        apiUrl: {
          format: 'string',
        },
        port: {
          format: 'number',
        },
        timeout: {
          format: 'number',
        },
      };

      // Constructor config file
      const constructorConfig = {
        apiUrl: 'http://constructor.com',
        port: 3000,
        timeout: 5000,
      };
      writeFileSync(testConfigPath1, JSON.stringify(constructorConfig));

      // Runtime config file
      const runtimeConfig = {
        apiUrl: 'http://runtime.com',
        port: 8080,
        // timeout not specified - should keep constructor value
      };
      writeFileSync(testConfigPath2, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema, file: testConfigPath1 });
      envict.load(testConfigPath2);

      expect(envict.get('apiUrl')).toBe('http://runtime.com'); // Overridden
      expect(envict.get('port')).toBe(8080); // Overridden
      expect(envict.get('timeout')).toBe(5000); // Kept from constructor
    });

    it('should ensure environment variables still take precedence after runtime loading', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          env: 'API_URL',
          default: 'http://default.com',
        },
        port: {
          format: 'number',
          env: 'PORT',
          default: 3000,
        },
      };

      const runtimeConfig = {
        apiUrl: 'http://runtime.com',
        port: 8080,
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const customEnv = {
        API_URL: 'http://env.com',
        // PORT not set in env
      };

      const envict = new Envict({ schema, env: customEnv });
      envict.load(testConfigPath1);

      expect(envict.get('apiUrl')).toBe('http://env.com'); // Env takes precedence
      expect(envict.get('port')).toBe(8080); // Runtime file value
    });

    it('should handle multiple runtime loads with proper precedence', () => {
      const schema = {
        value1: {
          format: 'string',
          default: 'default1',
        },
        value2: {
          format: 'string',
          default: 'default2',
        },
        value3: {
          format: 'string',
          default: 'default3',
        },
      };

      // First runtime config
      writeFileSync(
        testConfigPath1,
        JSON.stringify({
          value1: 'first-file',
          value2: 'first-file',
          value3: 'first-file',
        }),
      );

      // Second runtime config (should override first)
      writeFileSync(
        testConfigPath2,
        JSON.stringify({
          value1: 'second-file',
          value2: 'second-file',
          // value3 not specified - should keep first file value
        }),
      );

      const envict = new Envict({ schema });
      envict.load(testConfigPath1).load(testConfigPath2);

      expect(envict.get('value1')).toBe('second-file'); // Overridden by second
      expect(envict.get('value2')).toBe('second-file'); // Overridden by second
      expect(envict.get('value3')).toBe('first-file'); // Kept from first
    });

    it('should handle partial configuration updates', () => {
      const schema = {
        database: {
          host: {
            format: 'string',
            default: 'localhost',
          },
          port: {
            format: 'number',
            default: 5432,
          },
          ssl: {
            format: 'boolean',
            default: false,
          },
        },
      };

      // Runtime config only updates some properties
      const partialConfig = {
        database: {
          host: 'new-host.com',
          // port and ssl not specified
        },
      };
      writeFileSync(testConfigPath1, JSON.stringify(partialConfig));

      const envict = new Envict({ schema });
      envict.load(testConfigPath1);

      expect(envict.get('database.host')).toBe('new-host.com'); // Updated
      expect(envict.get('database.port')).toBe(5432); // Default preserved
      expect(envict.get('database.ssl')).toBe(false); // Default preserved
    });
  });

  describe('type conversion and validation', () => {
    it('should validate and convert loaded data according to schema', () => {
      const schema = {
        port: {
          format: 'number',
          default: 3000,
        },
        debug: {
          format: 'boolean',
          default: false,
        },
        config: {
          format: 'json',
          default: {},
        },
      };

      const runtimeConfig = {
        port: '8080', // String that should be converted to number
        debug: 'true', // String that should be converted to boolean
        config: '{"key": "value"}', // JSON string that should be parsed
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema });
      envict.load(testConfigPath1);

      expect(envict.get('port')).toBe(8080);
      expect(typeof envict.get('port')).toBe('number');

      expect(envict.get('debug')).toBe(true);
      expect(typeof envict.get('debug')).toBe('boolean');

      expect(envict.get('config')).toEqual({ key: 'value' });
      expect(typeof envict.get('config')).toBe('object');
    });

    it('should throw ValidationError for invalid data in loaded file', () => {
      const schema = {
        port: {
          format: 'number',
          default: 3000,
        },
        email: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          default: 'test@example.com',
        },
      };

      const invalidConfig = {
        port: 'not-a-number',
        email: 'invalid-email',
      };
      writeFileSync(testConfigPath1, JSON.stringify(invalidConfig));

      const envict = new Envict({ schema });

      expect(() => envict.load(testConfigPath1)).toThrow(ValidationError);
    });

    it('should re-validate entire configuration after loading', () => {
      const schema = {
        value1: {
          format: 'string',
          default: 'default1',
        },
        value2: {
          format: 'number',
          default: 42,
        },
      };

      // Create config with invalid data that should fail validation
      const invalidConfig = {
        value1: 'valid-string',
        value2: 'not-a-number', // This should fail number validation
      };
      writeFileSync(testConfigPath1, JSON.stringify(invalidConfig));

      const envict = new Envict({ schema });

      // Loading invalid data should throw ParseError during re-validation
      expect(() => envict.load(testConfigPath1)).toThrow(ParseError);
    });
  });

  describe('error handling', () => {
    it('should throw FileError for non-existent files', () => {
      const schema = {
        value: {
          format: 'string',
          default: 'default',
        },
      };

      const envict = new Envict({ schema });

      expect(() => envict.load('/non/existent/file.json')).toThrow(FileError);
    });

    it('should throw FileError for invalid JSON files', () => {
      const schema = {
        value: {
          format: 'string',
          default: 'default',
        },
      };

      // Create invalid JSON file
      writeFileSync(testConfigPath1, '{ invalid json }');

      const envict = new Envict({ schema });

      expect(() => envict.load(testConfigPath1)).toThrow(FileError);
    });

    it('should provide helpful error messages for file loading failures', () => {
      const schema = {
        value: {
          format: 'string',
          default: 'default',
        },
      };

      const envict = new Envict({ schema });

      try {
        envict.load('/non/existent/file.json');
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        expect((error as FileError).message).toContain(
          '/non/existent/file.json',
        );
        expect((error as FileError).filePath).toBe('/non/existent/file.json');
      }
    });

    it('should maintain configuration state if loading fails', () => {
      const schema = {
        value: {
          format: 'string',
          default: 'default',
        },
      };

      const envict = new Envict({ schema });
      const originalValue = envict.get('value');

      // Try to load non-existent file
      expect(() => envict.load('/non/existent/file.json')).toThrow(FileError);

      // Configuration should remain unchanged
      expect(envict.get('value')).toBe(originalValue);
    });
  });

  describe('integration with existing features', () => {
    it('should work with nested object access after runtime loading', () => {
      const schema = {
        database: {
          host: {
            format: 'string',
            default: 'localhost',
          },
          credentials: {
            username: {
              format: 'string',
              default: 'user',
            },
          },
        },
      };

      const runtimeConfig = {
        database: {
          host: 'runtime-host.com',
          credentials: {
            username: 'runtime-user',
          },
        },
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema });
      envict.load(testConfigPath1);

      const database = envict.get('database') as {
        host: string;
        credentials: { username: string };
      };
      expect(database.host).toBe('runtime-host.com');
      expect(database.credentials.username).toBe('runtime-user');

      // Test dot notation access
      expect(envict.get('database.host')).toBe('runtime-host.com');
      expect(envict.get('database.credentials.username')).toBe('runtime-user');
    });

    it('should work with multiple value retrieval after runtime loading', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          default: 'http://default.com',
        },
        port: {
          format: 'number',
          default: 3000,
        },
        debug: {
          format: 'boolean',
          default: false,
        },
      };

      const runtimeConfig = {
        apiUrl: 'http://runtime.com',
        port: 8080,
      };
      writeFileSync(testConfigPath1, JSON.stringify(runtimeConfig));

      const envict = new Envict({ schema });
      envict.load(testConfigPath1);

      const multipleValues = envict.get(['apiUrl', 'port', 'debug']);
      expect(multipleValues).toEqual({
        apiUrl: 'http://runtime.com',
        port: 8080,
        debug: false,
      });
    });

    it('should handle complex real-world configuration scenarios', () => {
      const schema = {
        app: {
          name: {
            format: 'string',
            default: 'MyApp',
          },
          version: {
            format: 'string',
            default: '1.0.0',
          },
        },
        database: {
          host: {
            format: 'string',
            env: 'DB_HOST',
            default: 'localhost',
          },
          port: {
            format: 'number',
            env: 'DB_PORT',
            default: 5432,
          },
        },
        features: {
          format: 'json',
          default: { auth: true, logging: false },
        },
      };

      // Base config from constructor
      const baseConfig = {
        app: {
          name: 'BaseApp',
        },
        database: {
          host: 'base-db.com',
        },
      };
      writeFileSync(testConfigPath1, JSON.stringify(baseConfig));

      // Runtime override config
      const overrideConfig = {
        app: {
          version: '2.0.0',
        },
        database: {
          port: 5433,
        },
        features: '{"auth": true, "logging": true, "metrics": true}',
      };
      writeFileSync(testConfigPath2, JSON.stringify(overrideConfig));

      const customEnv = {
        DB_HOST: 'env-db.com', // Should override both files
      };

      const envict = new Envict({
        schema,
        file: testConfigPath1,
        env: customEnv,
      });
      envict.load(testConfigPath2);

      // Verify final merged configuration
      expect(envict.get('app.name')).toBe('BaseApp'); // From base config
      expect(envict.get('app.version')).toBe('2.0.0'); // From runtime config
      expect(envict.get('database.host')).toBe('env-db.com'); // From environment
      expect(envict.get('database.port')).toBe(5433); // From runtime config
      expect(envict.get('features')).toEqual({
        auth: true,
        logging: true,
        metrics: true,
      }); // From runtime config (parsed JSON)
    });
  });
});
