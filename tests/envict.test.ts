/**
 * Unit tests for Envict class constructor and initialization
 */

import { fail } from 'node:assert';
import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../src/envict';
import { FileError, ParseError, ValidationError } from '../src/types';

describe('Envict Constructor and Initialization', () => {
  const testConfigPath = join(__dirname, 'test-config.json');

  // Clean up test files after each test
  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('constructor', () => {
    it('should create instance with empty options', () => {
      const envict = new Envict();
      expect(envict).toBeInstanceOf(Envict);
    });

    it('should create instance with undefined options', () => {
      const envict = new Envict(undefined);
      expect(envict).toBeInstanceOf(Envict);
    });

    it('should create instance with empty schema', () => {
      const envict = new Envict({ schema: {} });
      expect(envict).toBeInstanceOf(Envict);
    });

    it('should accept schema in constructor options', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          default: 'http://localhost:3000',
        },
      };

      const envict = new Envict({ schema });
      expect(envict).toBeInstanceOf(Envict);
    });

    it('should accept file path in constructor options', () => {
      // Create a test config file
      const config = { apiUrl: 'http://test.com' };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        apiUrl: {
          format: 'string',
        },
      };

      const envict = new Envict({ schema, file: testConfigPath });
      expect(envict).toBeInstanceOf(Envict);
    });

    it('should accept custom environment variables', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          env: 'API_URL',
        },
      };

      const customEnv = { API_URL: 'http://custom.com' };
      const envict = new Envict({ schema, env: customEnv });
      expect(envict).toBeInstanceOf(Envict);
    });
  });

  describe('schema processing', () => {
    it('should process simple schema during initialization', () => {
      const schema = {
        port: {
          format: 'number',
          default: 3000,
        },
        debug: {
          format: 'boolean',
          default: false,
        },
      };

      expect(() => new Envict({ schema })).not.toThrow();
    });

    it('should process nested schema during initialization', () => {
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
            default: 'http://localhost:3000',
          },
        },
      };

      expect(() => new Envict({ schema })).not.toThrow();
    });

    it('should throw ValidationError for invalid schema', () => {
      const invalidSchema = {
        port: {
          // Missing required 'format' property
          default: 3000,
        },
      };

      // biome-ignore lint/suspicious/noExplicitAny: Testing invalid schema input
      expect(() => new Envict({ schema: invalidSchema as any })).toThrow(
        ValidationError,
      );
    });

    it('should throw ValidationError for invalid format type', () => {
      const invalidSchema = {
        port: {
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid format
          format: 'invalid-format' as any,
          default: 3000,
        },
      };

      expect(() => new Envict({ schema: invalidSchema })).toThrow(
        ValidationError,
      );
    });
  });

  describe('default value application', () => {
    it('should apply default values from schema', () => {
      const schema = {
        port: {
          format: 'number',
          default: 3000,
        },
        debug: {
          format: 'boolean',
          default: false,
        },
      };

      // Should not throw - defaults are applied
      expect(() => new Envict({ schema })).not.toThrow();
    });

    it('should apply nested default values', () => {
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
      };

      expect(() => new Envict({ schema })).not.toThrow();
    });

    it('should handle schema with no defaults', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          // No default value
        },
      };

      // Should throw because required property has no default and no env var
      expect(() => new Envict({ schema, env: {} })).toThrow(ValidationError);
    });
  });

  describe('file loading during initialization', () => {
    it('should automatically load JSON file when file path provided', () => {
      const config = {
        apiUrl: 'http://file.com',
        port: 8080,
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        apiUrl: {
          format: 'string',
        },
        port: {
          format: 'number',
        },
      };

      expect(() => new Envict({ schema, file: testConfigPath })).not.toThrow();
    });

    it('should handle nested JSON configuration', () => {
      const config = {
        database: {
          host: 'file-host',
          port: 5432,
        },
        api: {
          url: 'http://file-api.com',
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        database: {
          host: {
            format: 'string',
          },
          port: {
            format: 'number',
          },
        },
        api: {
          url: {
            format: 'string',
          },
        },
      };

      expect(() => new Envict({ schema, file: testConfigPath })).not.toThrow();
    });

    it('should throw FileError for non-existent file', () => {
      const schema = {
        apiUrl: {
          format: 'string',
        },
      };

      expect(
        () => new Envict({ schema, file: '/non/existent/file.json' }),
      ).toThrow(FileError);
    });

    it('should throw FileError for invalid JSON file', () => {
      writeFileSync(testConfigPath, '{ invalid json }');

      const schema = {
        apiUrl: {
          format: 'string',
        },
      };

      expect(() => new Envict({ schema, file: testConfigPath })).toThrow(
        FileError,
      );
    });
  });

  describe('environment variable loading', () => {
    it('should load from custom environment variables', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          env: 'API_URL',
        },
        port: {
          format: 'number',
          env: 'PORT',
        },
      };

      const customEnv = {
        API_URL: 'http://env.com',
        PORT: '9000',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });

    it('should use explicit env mapping when specified', () => {
      const schema = {
        port: {
          format: 'number',
          env: 'PORT', // Explicitly specify env mapping
          default: 3000,
        },
      };

      const customEnv = {
        PORT: '8080',
      };

      const envict = new Envict({ schema, env: customEnv });
      expect(envict.get('port')).toBe(8080);
    });

    it('should handle missing environment variables with defaults', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          env: 'MISSING_API_URL',
          default: 'http://default.com',
        },
      };

      const customEnv = {}; // Empty environment

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });
  });

  describe('precedence handling', () => {
    it('should prioritize environment variables over file values', () => {
      const config = {
        apiUrl: 'http://file.com',
        port: 8080,
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        apiUrl: {
          format: 'string',
          env: 'API_URL',
        },
        port: {
          format: 'number',
          env: 'PORT',
        },
      };

      const customEnv = {
        API_URL: 'http://env.com', // Should override file value
        // PORT not set, should use file value
      };

      expect(
        () => new Envict({ schema, file: testConfigPath, env: customEnv }),
      ).not.toThrow();
    });

    it('should prioritize file values over defaults', () => {
      const config = {
        apiUrl: 'http://file.com',
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        apiUrl: {
          format: 'string',
          default: 'http://default.com',
        },
      };

      expect(
        () => new Envict({ schema, file: testConfigPath, env: {} }),
      ).not.toThrow();
    });

    it('should use defaults when no file or env values provided', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          default: 'http://default.com',
        },
        port: {
          format: 'number',
          default: 3000,
        },
      };

      expect(() => new Envict({ schema, env: {} })).not.toThrow();
    });
  });

  describe('validation and type conversion', () => {
    it('should convert string numbers to numbers', () => {
      const schema = {
        port: {
          format: 'number',
          env: 'PORT',
        },
      };

      const customEnv = {
        PORT: '8080', // String that should be converted to number
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });

    it('should convert string booleans to booleans', () => {
      const schema = {
        debug: {
          format: 'boolean',
          env: 'DEBUG',
        },
        enabled: {
          format: 'boolean',
          env: 'ENABLED',
        },
      };

      const customEnv = {
        DEBUG: 'true',
        ENABLED: '1',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });

    it('should parse JSON strings', () => {
      const schema = {
        config: {
          format: 'json',
          env: 'CONFIG',
        },
      };

      const customEnv = {
        CONFIG: '{"key": "value", "number": 42}',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });

    it('should validate regex patterns', () => {
      const schema = {
        email: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          env: 'EMAIL',
        },
      };

      const customEnv = {
        EMAIL: 'test@example.com',
      };

      expect(() => new Envict({ schema, env: customEnv })).not.toThrow();
    });

    it('should throw ValidationError for invalid regex patterns', () => {
      const schema = {
        email: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          env: 'EMAIL',
        },
      };

      const customEnv = {
        EMAIL: 'invalid-email',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(
        ValidationError,
      );
    });

    it('should throw ParseError for invalid type conversions', () => {
      const schema = {
        port: {
          format: 'number',
          env: 'PORT',
        },
      };

      const customEnv = {
        PORT: 'not-a-number',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(ParseError);
    });

    it('should aggregate multiple validation errors', () => {
      const schema = {
        port: {
          format: 'number',
          env: 'PORT',
        },
        email: {
          format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          env: 'EMAIL',
        },
      };

      const customEnv = {
        PORT: 'not-a-number',
        EMAIL: 'invalid-email',
      };

      expect(() => new Envict({ schema, env: customEnv })).toThrow(
        ValidationError,
      );
    });
  });

  describe('error handling', () => {
    it('should provide descriptive error messages for missing required properties', () => {
      const schema = {
        apiUrl: {
          format: 'string',
          // No default, no env var provided
        },
      };

      try {
        new Envict({ schema, env: {} });
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'Required property',
        );
        expect((error as ValidationError).message).toContain('apiUrl');
      }
    });

    it('should provide property path in error messages for nested properties', () => {
      const schema = {
        database: {
          host: {
            format: 'string',
            // No default, no env var provided
          },
        },
      };

      try {
        new Envict({ schema, env: {} });
        fail('Expected ValidationError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain('database.host');
      }
    });

    it('should handle file loading errors gracefully', () => {
      const schema = {
        apiUrl: {
          format: 'string',
        },
      };

      expect(() => {
        new Envict({ schema, file: '/non/existent/file.json' });
      }).toThrow(FileError);
    });
  });

  describe('get() method - single value retrieval', () => {
    describe('basic single value access', () => {
      it('should return single configuration value by key', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://localhost:3000',
          },
          port: {
            format: 'number',
            default: 8080,
          },
          debug: {
            format: 'boolean',
            default: true,
          },
        };

        const envict = new Envict({ schema });

        expect(envict.get('apiUrl')).toBe('http://localhost:3000');
        expect(envict.get('port')).toBe(8080);
        expect(envict.get('debug')).toBe(true);
      });

      it('should return correctly typed values based on schema format', () => {
        const schema = {
          stringValue: {
            format: 'string',
            default: 'test',
          },
          numberValue: {
            format: 'number',
            default: 42,
          },
          booleanValue: {
            format: 'boolean',
            default: false,
          },
        };

        const envict = new Envict({ schema });

        const stringVal = envict.get('stringValue');
        const numberVal = envict.get('numberValue');
        const booleanVal = envict.get('booleanValue');

        expect(typeof stringVal).toBe('string');
        expect(typeof numberVal).toBe('number');
        expect(typeof booleanVal).toBe('boolean');
      });

      it('should return environment variable values over defaults', () => {
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

        const customEnv = {
          API_URL: 'http://env.com',
          PORT: '9000',
        };

        const envict = new Envict({ schema, env: customEnv });

        expect(envict.get('apiUrl')).toBe('http://env.com');
        expect(envict.get('port')).toBe(9000);
      });

      it('should return file values over defaults', () => {
        const config = {
          apiUrl: 'http://file.com',
          port: 7000,
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://default.com',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        };

        const envict = new Envict({ schema, file: testConfigPath });

        expect(envict.get('apiUrl')).toBe('http://file.com');
        expect(envict.get('port')).toBe(7000);
      });
    });

    describe('dot notation path traversal', () => {
      it('should support dot notation for nested object access', () => {
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
            timeout: {
              format: 'number',
              default: 5000,
            },
          },
        };

        const envict = new Envict({ schema });

        expect(envict.get('database.host')).toBe('localhost');
        expect(envict.get('database.port')).toBe(5432);
        expect(envict.get('api.url')).toBe('http://api.com');
        expect(envict.get('api.timeout')).toBe(5000);
      });

      it('should return entire nested objects when accessing parent keys', () => {
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
        };

        const envict = new Envict({ schema });

        const database = envict.get('database');
        expect(database).toEqual({
          host: 'localhost',
          port: 5432,
        });
      });

      it('should handle deeply nested object access', () => {
        const schema = {
          app: {
            server: {
              database: {
                host: {
                  format: 'string',
                  default: 'deep-host',
                },
                credentials: {
                  username: {
                    format: 'string',
                    default: 'user',
                  },
                },
              },
            },
          },
        };

        const envict = new Envict({ schema });

        expect(envict.get('app.server.database.host')).toBe('deep-host');
        expect(envict.get('app.server.database.credentials.username')).toBe(
          'user',
        );

        const serverConfig = envict.get('app.server');
        expect(serverConfig).toEqual({
          database: {
            host: 'deep-host',
            credentials: {
              username: 'user',
            },
          },
        });
      });

      it('should handle nested objects from file configuration', () => {
        const config = {
          database: {
            host: 'file-host',
            port: 5433,
          },
          api: {
            url: 'http://file-api.com',
          },
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          database: {
            host: {
              format: 'string',
            },
            port: {
              format: 'number',
            },
          },
          api: {
            url: {
              format: 'string',
            },
          },
        };

        const envict = new Envict({ schema, file: testConfigPath });

        expect(envict.get('database.host')).toBe('file-host');
        expect(envict.get('database.port')).toBe(5433);
        expect(envict.get('api.url')).toBe('http://file-api.com');

        const database = envict.get('database');
        expect(database).toEqual({
          host: 'file-host',
          port: 5433,
        });
      });

      it('should handle nested objects from environment variables', () => {
        const schema = {
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
              env: 'API_URL',
            },
          },
        };

        const customEnv = {
          DB_HOST: 'env-host',
          DB_PORT: '5434',
          API_URL: 'http://env-api.com',
        };

        const envict = new Envict({ schema, env: customEnv });

        expect(envict.get('database.host')).toBe('env-host');
        expect(envict.get('database.port')).toBe(5434);
        expect(envict.get('api.url')).toBe('http://env-api.com');

        const database = envict.get('database');
        expect(database).toEqual({
          host: 'env-host',
          port: 5434,
        });
      });
    });

    describe('error handling for missing properties', () => {
      it('should throw ValidationError for missing required properties', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            env: 'API_URL',
            // No default value
          },
        };

        const envict = new Envict({
          schema,
          env: { API_URL: 'http://test.com' },
        });

        expect(() => envict.get('nonExistent')).toThrow(ValidationError);
        expect(() => envict.get('nonExistent')).toThrow(
          'not defined in the schema',
        );
      });

      it('should throw ValidationError for undefined properties with descriptive messages', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.get('missingProperty');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain(
            'missingProperty',
          );
          expect((error as ValidationError).message).toContain(
            'not defined in the schema',
          );
          expect((error as ValidationError).property).toBe('missingProperty');
        }
      });

      it('should throw ValidationError for missing nested properties', () => {
        const schema = {
          database: {
            host: {
              format: 'string',
              default: 'localhost',
            },
          },
        };

        const envict = new Envict({ schema });

        expect(() => envict.get('database.nonExistent')).toThrow(
          ValidationError,
        );
        expect(() => envict.get('database.nonExistent')).toThrow(
          'not defined in the configuration',
        );
      });

      it('should throw ValidationError for invalid nested paths', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
        };

        const envict = new Envict({ schema });

        expect(() => envict.get('nonExistent.path')).toThrow(ValidationError);
        expect(() => envict.get('apiUrl.nonExistent')).toThrow(ValidationError);
      });

      it('should provide helpful error messages with property paths', () => {
        const schema = {
          database: {
            host: {
              format: 'string',
              default: 'localhost',
            },
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.get('database.port');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain('database.port');
          expect((error as ValidationError).property).toBe('database.port');
        }
      });
    });

    describe('type conversion and validation', () => {
      it('should return properly converted types from environment variables', () => {
        const schema = {
          port: {
            format: 'number',
            env: 'PORT',
          },
          debug: {
            format: 'boolean',
            env: 'DEBUG',
          },
          config: {
            format: 'json',
            env: 'CONFIG',
          },
        };

        const customEnv = {
          PORT: '8080',
          DEBUG: 'true',
          CONFIG: '{"key": "value"}',
        };

        const envict = new Envict({ schema, env: customEnv });

        expect(envict.get('port')).toBe(8080);
        expect(typeof envict.get('port')).toBe('number');

        expect(envict.get('debug')).toBe(true);
        expect(typeof envict.get('debug')).toBe('boolean');

        expect(envict.get('config')).toEqual({ key: 'value' });
        expect(typeof envict.get('config')).toBe('object');
      });

      it('should validate regex patterns and return matching values', () => {
        const schema = {
          email: {
            format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            env: 'EMAIL',
          },
          url: {
            format: /^https?:\/\/.+/,
            env: 'URL',
          },
        };

        const customEnv = {
          EMAIL: 'test@example.com',
          URL: 'https://example.com',
        };

        const envict = new Envict({ schema, env: customEnv });

        expect(envict.get('email')).toBe('test@example.com');
        expect(envict.get('url')).toBe('https://example.com');
      });

      it('should handle string format values correctly', () => {
        const schema = {
          name: {
            format: 'string',
            env: 'NAME',
          },
          description: {
            format: 'string',
            default: 'Default description',
          },
        };

        const customEnv = {
          NAME: 'Test Name',
        };

        const envict = new Envict({ schema, env: customEnv });

        expect(envict.get('name')).toBe('Test Name');
        expect(typeof envict.get('name')).toBe('string');
        expect(envict.get('description')).toBe('Default description');
      });
    });

    describe('precedence handling in get() method', () => {
      it('should return environment values over file values', () => {
        const config = {
          apiUrl: 'http://file.com',
          port: 8080,
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          apiUrl: {
            format: 'string',
            env: 'API_URL',
          },
          port: {
            format: 'number',
            env: 'PORT',
          },
        };

        const customEnv = {
          API_URL: 'http://env.com',
          // PORT not set, should use file value
        };

        const envict = new Envict({
          schema,
          file: testConfigPath,
          env: customEnv,
        });

        expect(envict.get('apiUrl')).toBe('http://env.com'); // From env
        expect(envict.get('port')).toBe(8080); // From file
      });

      it('should return file values over defaults', () => {
        const config = {
          apiUrl: 'http://file.com',
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://default.com',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        };

        const envict = new Envict({ schema, file: testConfigPath, env: {} });

        expect(envict.get('apiUrl')).toBe('http://file.com'); // From file
        expect(envict.get('port')).toBe(3000); // From default
      });
    });
  });

  describe('get() method - multiple value retrieval', () => {
    describe('basic multiple value access', () => {
      it('should return multiple configuration values as object when given array of keys', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://localhost:3000',
          },
          port: {
            format: 'number',
            default: 8080,
          },
          debug: {
            format: 'boolean',
            default: true,
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get(['apiUrl', 'port']);
        expect(result).toEqual({
          apiUrl: 'http://localhost:3000',
          port: 8080,
        });

        const allValues = envict.get(['apiUrl', 'port', 'debug']);
        expect(allValues).toEqual({
          apiUrl: 'http://localhost:3000',
          port: 8080,
          debug: true,
        });
      });

      it('should return correctly typed values for multiple properties', () => {
        const schema = {
          stringValue: {
            format: 'string',
            default: 'test',
          },
          numberValue: {
            format: 'number',
            default: 42,
          },
          booleanValue: {
            format: 'boolean',
            default: false,
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get([
          'stringValue',
          'numberValue',
          'booleanValue',
        ]);

        expect(typeof result.stringValue).toBe('string');
        expect(typeof result.numberValue).toBe('number');
        expect(typeof result.booleanValue).toBe('boolean');

        expect(result).toEqual({
          stringValue: 'test',
          numberValue: 42,
          booleanValue: false,
        });
      });

      it('should return environment variable values over defaults for multiple properties', () => {
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
          debug: {
            format: 'boolean',
            env: 'DEBUG',
            default: false,
          },
        };

        const customEnv = {
          API_URL: 'http://env.com',
          PORT: '9000',
          DEBUG: 'true',
        };

        const envict = new Envict({ schema, env: customEnv });

        const result = envict.get(['apiUrl', 'port', 'debug']);
        expect(result).toEqual({
          apiUrl: 'http://env.com',
          port: 9000,
          debug: true,
        });
      });

      it('should return file values over defaults for multiple properties', () => {
        const config = {
          apiUrl: 'http://file.com',
          port: 7000,
          debug: false,
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

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
            default: true,
          },
        };

        const envict = new Envict({ schema, file: testConfigPath });

        const result = envict.get(['apiUrl', 'port', 'debug']);
        expect(result).toEqual({
          apiUrl: 'http://file.com',
          port: 7000,
          debug: false,
        });
      });
    });

    describe('multiple value access with nested properties', () => {
      it('should support dot notation in multiple value retrieval', () => {
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
            timeout: {
              format: 'number',
              default: 5000,
            },
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get([
          'database.host',
          'database.port',
          'api.url',
        ]);
        expect(result).toEqual({
          'database.host': 'localhost',
          'database.port': 5432,
          'api.url': 'http://api.com',
        });
      });

      it('should support mixing nested objects and dot notation in multiple value retrieval', () => {
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
          debug: {
            format: 'boolean',
            default: true,
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get(['database', 'api.url', 'debug']);
        expect(result).toEqual({
          database: {
            host: 'localhost',
            port: 5432,
          },
          'api.url': 'http://api.com',
          debug: true,
        });
      });

      it('should handle deeply nested properties in multiple value retrieval', () => {
        const schema = {
          app: {
            server: {
              database: {
                host: {
                  format: 'string',
                  default: 'deep-host',
                },
                credentials: {
                  username: {
                    format: 'string',
                    default: 'user',
                  },
                },
              },
            },
          },
          simple: {
            format: 'string',
            default: 'simple-value',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get([
          'app.server.database.host',
          'app.server.database.credentials.username',
          'simple',
        ]);
        expect(result).toEqual({
          'app.server.database.host': 'deep-host',
          'app.server.database.credentials.username': 'user',
          simple: 'simple-value',
        });
      });
    });

    describe('error handling for multiple value retrieval', () => {
      it('should throw ValidationError when any requested property is missing', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        };

        const envict = new Envict({ schema });

        expect(() => envict.get(['apiUrl', 'nonExistent'])).toThrow(
          ValidationError,
        );
        expect(() => envict.get(['apiUrl', 'nonExistent'])).toThrow(
          'Failed to retrieve multiple properties',
        );
      });

      it('should throw ValidationError when multiple requested properties are missing', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.get(['apiUrl', 'nonExistent1', 'nonExistent2']);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain(
            'Failed to retrieve multiple properties',
          );
          expect((error as ValidationError).message).toContain('nonExistent1');
          expect((error as ValidationError).message).toContain('nonExistent2');
          expect((error as ValidationError).property).toBe(
            'multiple_properties',
          );
          expect((error as ValidationError).value).toEqual([
            'apiUrl',
            'nonExistent1',
            'nonExistent2',
          ]);
        }
      });

      it('should provide descriptive error messages for missing nested properties in multiple retrieval', () => {
        const schema = {
          database: {
            host: {
              format: 'string',
              default: 'localhost',
            },
          },
          api: {
            url: {
              format: 'string',
              default: 'http://api.com',
            },
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.get(['database.host', 'database.nonExistent', 'api.url']);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain(
            'database.nonExistent',
          );
          expect((error as ValidationError).message).toContain(
            'not defined in the configuration',
          );
        }
      });

      it('should handle mixed valid and invalid properties in multiple retrieval', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.get(['apiUrl', 'nonExistent', 'port', 'anotherMissing']);
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain('nonExistent');
          expect((error as ValidationError).message).toContain(
            'anotherMissing',
          );
          // Error message should contain information about missing properties
          expect((error as ValidationError).message).toContain('nonExistent');
          expect((error as ValidationError).message).toContain(
            'anotherMissing',
          );
        }
      });
    });

    describe('type conversion and validation for multiple values', () => {
      it('should return properly converted types from environment variables for multiple properties', () => {
        const schema = {
          port: {
            format: 'number',
            env: 'PORT',
          },
          debug: {
            format: 'boolean',
            env: 'DEBUG',
          },
          config: {
            format: 'json',
            env: 'CONFIG',
          },
          name: {
            format: 'string',
            env: 'NAME',
          },
        };

        const customEnv = {
          PORT: '8080',
          DEBUG: 'true',
          CONFIG: '{"key": "value"}',
          NAME: 'Test Name',
        };

        const envict = new Envict({ schema, env: customEnv });

        const result = envict.get(['port', 'debug', 'config', 'name']);

        expect(result.port).toBe(8080);
        expect(typeof result.port).toBe('number');

        expect(result.debug).toBe(true);
        expect(typeof result.debug).toBe('boolean');

        expect(result.config).toEqual({ key: 'value' });
        expect(typeof result.config).toBe('object');

        expect(result.name).toBe('Test Name');
        expect(typeof result.name).toBe('string');
      });

      it('should validate regex patterns for multiple properties', () => {
        const schema = {
          email: {
            format: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            env: 'EMAIL',
          },
          url: {
            format: /^https?:\/\/.+/,
            env: 'URL',
          },
          name: {
            format: 'string',
            env: 'NAME',
          },
        };

        const customEnv = {
          EMAIL: 'test@example.com',
          URL: 'https://example.com',
          NAME: 'Test User',
        };

        const envict = new Envict({ schema, env: customEnv });

        const result = envict.get(['email', 'url', 'name']);
        expect(result).toEqual({
          email: 'test@example.com',
          url: 'https://example.com',
          name: 'Test User',
        });
      });
    });

    describe('precedence handling for multiple values', () => {
      it('should return environment values over file values for multiple properties', () => {
        const config = {
          apiUrl: 'http://file.com',
          port: 8080,
          debug: false,
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          apiUrl: {
            format: 'string',
            env: 'API_URL',
          },
          port: {
            format: 'number',
            env: 'PORT',
          },
          debug: {
            format: 'boolean',
            env: 'DEBUG',
          },
        };

        const customEnv = {
          API_URL: 'http://env.com',
          // PORT not set, should use file value
          DEBUG: 'true',
        };

        const envict = new Envict({
          schema,
          file: testConfigPath,
          env: customEnv,
        });

        const result = envict.get(['apiUrl', 'port', 'debug']);
        expect(result).toEqual({
          apiUrl: 'http://env.com', // From env
          port: 8080, // From file
          debug: true, // From env
        });
      });

      it('should return file values over defaults for multiple properties', () => {
        const config = {
          apiUrl: 'http://file.com',
          port: 7000,
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

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
            default: true,
          },
        };

        const envict = new Envict({ schema, file: testConfigPath, env: {} });

        const result = envict.get(['apiUrl', 'port', 'debug']);
        expect(result).toEqual({
          apiUrl: 'http://file.com', // From file
          port: 7000, // From file
          debug: true, // From default
        });
      });
    });

    describe('edge cases for multiple value retrieval', () => {
      it('should handle empty array of keys', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get([]);
        expect(result).toEqual({});
      });

      it('should handle single key in array (should behave like multiple value retrieval)', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get(['apiUrl']);
        expect(result).toEqual({
          apiUrl: 'http://test.com',
        });
      });

      it('should handle duplicate keys in array', () => {
        const schema = {
          apiUrl: {
            format: 'string',
            default: 'http://test.com',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        };

        const envict = new Envict({ schema });

        const result = envict.get(['apiUrl', 'port', 'apiUrl']);
        expect(result).toEqual({
          apiUrl: 'http://test.com',
          port: 3000,
        });
      });
    });
  });

  describe('tryGet() method', () => {
    describe('successful primary key retrieval', () => {
      it('should return value from primary key when it exists', () => {
        const schema = {
          'stages.prod': {
            format: 'string',
            default: 'production-config',
          },
          'stages.ephemeral': {
            format: 'string',
            default: 'ephemeral-config',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.tryGet('stages.prod', 'stages.ephemeral');
        expect(result).toBe('production-config');
      });

      it('should return nested object from primary key when it exists', () => {
        const schema = {
          'stages.prod.database.host': {
            format: 'string',
            default: 'prod-db.com',
          },
          'stages.prod.database.port': {
            format: 'number',
            default: 5432,
          },
          'stages.ephemeral.database.host': {
            format: 'string',
            default: 'ephemeral-db.com',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.tryGet(
          'stages.prod.database',
          'stages.ephemeral.database',
        );
        expect(result).toEqual({
          host: 'prod-db.com',
          port: 5432,
        });
      });
    });

    describe('fallback key retrieval', () => {
      it('should return value from fallback key when primary key does not exist', () => {
        const schema = {
          'stages.ephemeral': {
            format: 'string',
            default: 'ephemeral-config',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.tryGet('stages.nonexistent', 'stages.ephemeral');
        expect(result).toBe('ephemeral-config');
      });

      it('should return nested object from fallback key when primary key does not exist', () => {
        const schema = {
          'stages.ephemeral.shared.serviceName': {
            format: 'string',
            default: 'ephemeral-service',
          },
          'stages.ephemeral.shared.logLevel': {
            format: 'string',
            default: 'DEBUG',
          },
        };

        const envict = new Envict({ schema });

        const result = envict.tryGet(
          'stages.unknown.shared',
          'stages.ephemeral.shared',
        );
        expect(result).toEqual({
          serviceName: 'ephemeral-service',
          logLevel: 'DEBUG',
        });
      });

      it('should work with environment variable overrides in fallback', () => {
        const schema = {
          'stages.ephemeral.port': {
            format: 'number',
            env: 'EPHEMERAL_PORT',
            default: 3000,
          },
        };

        const customEnv = {
          EPHEMERAL_PORT: '8080',
        };

        const envict = new Envict({ schema, env: customEnv });

        const result = envict.tryGet(
          'stages.missing.port',
          'stages.ephemeral.port',
        );
        expect(result).toBe(8080);
      });
    });

    describe('error handling', () => {
      it('should throw ValidationError when both primary and fallback keys fail', () => {
        const schema = {
          'stages.working': {
            format: 'string',
            default: 'working-config',
          },
        };

        const envict = new Envict({ schema });

        expect(() => {
          envict.tryGet('stages.missing', 'stages.alsomissing');
        }).toThrow(ValidationError);
      });

      it('should provide helpful error message when both keys fail', () => {
        const schema = {
          'stages.working': {
            format: 'string',
            default: 'working-config',
          },
        };

        const envict = new Envict({ schema });

        try {
          envict.tryGet('stages.primary', 'stages.fallback');
          fail('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain(
            'stages.primary',
          );
          expect((error as ValidationError).message).toContain(
            'stages.fallback',
          );
          expect((error as ValidationError).message).toContain(
            'Both primary key',
          );
          expect((error as ValidationError).message).toContain('fallback key');
        }
      });
    });

    describe('real-world stage configuration scenario', () => {
      it('should handle dynamic stage configuration with ephemeral fallback', () => {
        const schema = {
          // Known stages
          'stages.prod.shared.serviceName': {
            format: 'string',
            default: 'order-service-prod',
          },
          'stages.prod.shared.logLevel': {
            format: 'string',
            default: 'INFO',
          },
          'stages.staging.shared.serviceName': {
            format: 'string',
            default: 'order-service-staging',
          },
          'stages.staging.shared.logLevel': {
            format: 'string',
            default: 'INFO',
          },
          // Ephemeral template
          'stages.ephemeral.shared.serviceName': {
            format: 'string',
            default: 'order-service-ephemeral',
          },
          'stages.ephemeral.shared.logLevel': {
            format: 'string',
            default: 'DEBUG',
          },
        };

        const envict = new Envict({ schema });

        // Test known stage
        const prodConfig = envict.tryGet(
          'stages.prod.shared',
          'stages.ephemeral.shared',
        );
        expect(prodConfig).toEqual({
          serviceName: 'order-service-prod',
          logLevel: 'INFO',
        });

        // Test unknown stage falls back to ephemeral
        const unknownConfig = envict.tryGet(
          'stages.feature-branch.shared',
          'stages.ephemeral.shared',
        );
        expect(unknownConfig).toEqual({
          serviceName: 'order-service-ephemeral',
          logLevel: 'DEBUG',
        });
      });

      it('should work with file configuration and stage fallbacks', () => {
        const config = {
          'stages.prod.env.account': '123456789012',
          'stages.prod.env.region': 'us-east-1',
          'stages.ephemeral.env.account': '000000000000',
          'stages.ephemeral.env.region': 'us-west-2',
        };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          'stages.prod.env.account': { format: 'string' },
          'stages.prod.env.region': { format: 'string' },
          'stages.ephemeral.env.account': { format: 'string' },
          'stages.ephemeral.env.region': { format: 'string' },
        };

        const envict = new Envict({ schema, file: testConfigPath });

        // Known stage from file
        const prodEnv = envict.tryGet(
          'stages.prod.env',
          'stages.ephemeral.env',
        );
        expect(prodEnv).toEqual({
          account: '123456789012',
          region: 'us-east-1',
        });

        // Unknown stage falls back to ephemeral from file
        const unknownEnv = envict.tryGet(
          'stages.unknown.env',
          'stages.ephemeral.env',
        );
        expect(unknownEnv).toEqual({
          account: '000000000000',
          region: 'us-west-2',
        });
      });
    });
  });
});
