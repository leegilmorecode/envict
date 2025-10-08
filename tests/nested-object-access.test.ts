/**
 * Unit tests for nested object access and dot notation support
 */

// @ts-nocheck - Disable strict type checking for test file to allow property access on unknown types

import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../src/envict';
import { ValidationError } from '../src/types';

describe('Nested Object Access and Dot Notation Support', () => {
  const testConfigPath = join(__dirname, 'test-nested-config.json');

  // Clean up test files after each test
  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
  });

  describe('returning nested objects', () => {
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
          credentials: {
            username: {
              format: 'string',
              default: 'admin',
            },
            password: {
              format: 'string',
              default: 'secret',
            },
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

      const database = envict.get('database');
      expect(database).toEqual({
        host: 'localhost',
        port: 5432,
        credentials: {
          username: 'admin',
          password: 'secret',
        },
      });

      const api = envict.get('api');
      expect(api).toEqual({
        url: 'http://api.com',
        timeout: 5000,
      });
    });

    it('should return nested objects from file configuration', () => {
      const config = {
        server: {
          host: 'file-host',
          port: 8080,
          ssl: {
            enabled: true,
            cert: '/path/to/cert',
          },
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        server: {
          host: {
            format: 'string',
          },
          port: {
            format: 'number',
          },
          ssl: {
            enabled: {
              format: 'boolean',
            },
            cert: {
              format: 'string',
            },
          },
        },
      };

      const envict = new Envict({ schema, file: testConfigPath });

      const server = envict.get('server');
      expect(server).toEqual({
        host: 'file-host',
        port: 8080,
        ssl: {
          enabled: true,
          cert: '/path/to/cert',
        },
      });

      const ssl = envict.get('server.ssl');
      expect(ssl).toEqual({
        enabled: true,
        cert: '/path/to/cert',
      });
    });

    it('should return nested objects from environment variables', () => {
      const schema = {
        app: {
          name: {
            format: 'string',
            env: 'APP_NAME',
          },
          version: {
            format: 'string',
            env: 'APP_VERSION',
          },
          config: {
            debug: {
              format: 'boolean',
              env: 'APP_DEBUG',
            },
            logLevel: {
              format: 'string',
              env: 'APP_LOG_LEVEL',
            },
          },
        },
      };

      const customEnv = {
        APP_NAME: 'TestApp',
        APP_VERSION: '1.0.0',
        APP_DEBUG: 'true',
        APP_LOG_LEVEL: 'info',
      };

      const envict = new Envict({ schema, env: customEnv });

      const app = envict.get('app');
      expect(app).toEqual({
        name: 'TestApp',
        version: '1.0.0',
        config: {
          debug: true,
          logLevel: 'info',
        },
      });

      const appConfig = envict.get('app.config');
      expect(appConfig).toEqual({
        debug: true,
        logLevel: 'info',
      });
    });
  });

  describe('dot notation chaining support', () => {
    it('should support dot notation chaining on returned objects', () => {
      const schema = {
        prod: {
          apiUrl: {
            format: 'string',
            default: 'https://prod-api.com',
          },
          database: {
            host: {
              format: 'string',
              default: 'prod-db.com',
            },
            port: {
              format: 'number',
              default: 5432,
            },
          },
        },
        dev: {
          apiUrl: {
            format: 'string',
            default: 'http://dev-api.com',
          },
          database: {
            host: {
              format: 'string',
              default: 'localhost',
            },
          },
        },
      };

      const envict = new Envict({ schema });

      // Test dot notation chaining
      const prodConfig = envict.get('prod');
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect((prodConfig as any).apiUrl).toBe('https://prod-api.com');
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect((prodConfig as any).database.host).toBe('prod-db.com');
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect((prodConfig as any).database.port).toBe(5432);

      const devConfig = envict.get('dev');
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect((devConfig as any).apiUrl).toBe('http://dev-api.com');
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect((devConfig as any).database.host).toBe('localhost');
    });

    it('should support deep dot notation chaining', () => {
      const schema = {
        app: {
          server: {
            database: {
              primary: {
                host: {
                  format: 'string',
                  default: 'primary-db',
                },
                port: {
                  format: 'number',
                  default: 5432,
                },
              },
              replica: {
                host: {
                  format: 'string',
                  default: 'replica-db',
                },
                port: {
                  format: 'number',
                  default: 5433,
                },
              },
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const app = envict.get('app');
      expect(app.server.database.primary.host).toBe('primary-db');
      expect(app.server.database.primary.port).toBe(5432);
      expect(app.server.database.replica.host).toBe('replica-db');
      expect(app.server.database.replica.port).toBe(5433);

      const server = envict.get('app.server');
      expect(server.database.primary.host).toBe('primary-db');
      expect(server.database.replica.port).toBe(5433);

      const database = envict.get('app.server.database');
      expect(database.primary.host).toBe('primary-db');
      expect(database.replica.host).toBe('replica-db');
    });

    it('should support chaining with mixed data types', () => {
      const schema = {
        config: {
          server: {
            port: {
              format: 'number',
              default: 3000,
            },
            ssl: {
              format: 'boolean',
              default: true,
            },
          },
          features: {
            auth: {
              format: 'boolean',
              default: true,
            },
            rateLimit: {
              format: 'number',
              default: 100,
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const config = envict.get('config');
      expect(typeof config.server.port).toBe('number');
      expect(config.server.port).toBe(3000);
      expect(typeof config.server.ssl).toBe('boolean');
      expect(config.server.ssl).toBe(true);
      expect(typeof config.features.auth).toBe('boolean');
      expect(config.features.auth).toBe(true);
      expect(typeof config.features.rateLimit).toBe('number');
      expect(config.features.rateLimit).toBe(100);
    });

    it('should support chaining with environment variable overrides', () => {
      const schema = {
        env: {
          production: {
            apiUrl: {
              format: 'string',
              env: 'PROD_API_URL',
              default: 'https://default-prod.com',
            },
            dbHost: {
              format: 'string',
              env: 'PROD_DB_HOST',
              default: 'default-db',
            },
          },
          staging: {
            apiUrl: {
              format: 'string',
              env: 'STAGING_API_URL',
              default: 'https://default-staging.com',
            },
          },
        },
      };

      const customEnv = {
        PROD_API_URL: 'https://env-prod.com',
        STAGING_API_URL: 'https://env-staging.com',
      };

      const envict = new Envict({ schema, env: customEnv });

      const env = envict.get('env');
      expect(env.production.apiUrl).toBe('https://env-prod.com');
      expect(env.production.dbHost).toBe('default-db');
      expect(env.staging.apiUrl).toBe('https://env-staging.com');
    });
  });

  describe('handling undefined nested properties', () => {
    it('should return undefined for non-existent properties in nested objects', () => {
      const schema = {
        config: {
          server: {
            port: {
              format: 'number',
              default: 3000,
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const config = envict.get('config');
      expect(config.server.port).toBe(3000);
      expect(config.server.nonExistent).toBeUndefined();
      expect(config.nonExistent).toBeUndefined();
    });

    it('should handle undefined properties gracefully in deep chains', () => {
      const schema = {
        app: {
          database: {
            host: {
              format: 'string',
              default: 'localhost',
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const app = envict.get('app');
      expect(app.database.host).toBe('localhost');
      expect(app.database.nonExistent).toBeUndefined();
      expect(app.nonExistent).toBeUndefined();

      // Accessing undefined properties should not throw
      expect(() => {
        const result = app.nonExistent?.someProperty;
        expect(result).toBeUndefined();
      }).not.toThrow();
    });

    it('should support optional chaining with returned objects', () => {
      const schema = {
        config: {
          server: {
            port: {
              format: 'number',
              default: 3000,
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const config = envict.get('config');

      // These should work with optional chaining
      expect(config.server?.port).toBe(3000);
      expect(config.server?.nonExistent).toBeUndefined();
      expect(config.nonExistent?.someProperty).toBeUndefined();
    });
  });

  describe('proper TypeScript typing for nested objects', () => {
    it('should maintain type safety for nested object access', () => {
      interface AppConfig {
        database: {
          host: string;
          port: number;
        };
        api: {
          url: string;
          timeout: number;
        };
      }

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

      const envict = new Envict<AppConfig>({ schema });

      // These should be properly typed
      const database = envict.get('database');
      const api = envict.get('api');

      // Type assertions to verify TypeScript typing
      expect(typeof database.host).toBe('string');
      expect(typeof database.port).toBe('number');
      expect(typeof api.url).toBe('string');
      expect(typeof api.timeout).toBe('number');
    });

    it('should support generic typing with dot notation access', () => {
      interface Config {
        server: {
          database: {
            host: string;
            port: number;
          };
          api: {
            url: string;
          };
        };
      }

      const schema = {
        server: {
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
        },
      };

      const envict = new Envict<Config>({ schema });

      // Test both direct access and dot notation
      const server = envict.get('server');
      const database = envict.get('server.database');
      const host = envict.get('server.database.host');

      expect(typeof server.database.host).toBe('string');
      expect(typeof server.database.port).toBe('number');
      expect(typeof database.host).toBe('string');
      expect(typeof database.port).toBe('number');
      expect(typeof host).toBe('string');
    });
  });

  describe('error handling for nested object access', () => {
    it('should throw ValidationError for invalid nested paths in get() method', () => {
      const schema = {
        database: {
          host: {
            format: 'string',
            default: 'localhost',
          },
        },
      };

      const envict = new Envict({ schema });

      expect(() => envict.get('database.nonExistent')).toThrow(ValidationError);
      expect(() => envict.get('nonExistent.path')).toThrow(ValidationError);
    });

    it('should provide helpful error messages for nested property access', () => {
      const schema = {
        server: {
          port: {
            format: 'number',
            default: 3000,
          },
        },
      };

      const envict = new Envict({ schema });

      try {
        envict.get('server.nonExistent');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'server.nonExistent',
        );
        expect((error as ValidationError).property).toBe('server.nonExistent');
      }

      try {
        envict.get('nonExistent.server');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        expect((error as ValidationError).message).toContain(
          'nonExistent.server',
        );
      }
    });

    it('should handle errors gracefully when accessing properties on undefined objects', () => {
      const schema = {
        config: {
          server: {
            port: {
              format: 'number',
              default: 3000,
            },
          },
        },
      };

      const envict = new Envict({ schema });

      const config = envict.get('config');

      // Accessing undefined properties should return undefined, not throw
      expect(config.nonExistent).toBeUndefined();

      // But trying to access properties on undefined should be handled gracefully
      expect(() => {
        const result = config.nonExistent?.someProperty;
        expect(result).toBeUndefined();
      }).not.toThrow();
    });
  });

  describe('integration with existing functionality', () => {
    it('should work with file loading and nested objects', () => {
      const config = {
        environments: {
          production: {
            database: {
              host: 'prod-db.com',
              port: 5432,
            },
            api: {
              url: 'https://prod-api.com',
              timeout: 10000,
            },
          },
          development: {
            database: {
              host: 'localhost',
              port: 5433,
            },
            api: {
              url: 'http://localhost:3000',
              timeout: 5000,
            },
          },
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        environments: {
          production: {
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
              timeout: {
                format: 'number',
              },
            },
          },
          development: {
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
              timeout: {
                format: 'number',
              },
            },
          },
        },
      };

      const envict = new Envict({ schema, file: testConfigPath });

      const environments = envict.get('environments');
      expect(environments.production.database.host).toBe('prod-db.com');
      expect(environments.production.api.url).toBe('https://prod-api.com');
      expect(environments.development.database.host).toBe('localhost');
      expect(environments.development.api.timeout).toBe(5000);

      // Test direct nested access
      const prodDb = envict.get('environments.production.database');
      expect(prodDb.host).toBe('prod-db.com');
      expect(prodDb.port).toBe(5432);
    });

    it('should work with environment variable precedence and nested objects', () => {
      const config = {
        app: {
          database: {
            host: 'file-host',
            port: 5432,
          },
          api: {
            url: 'http://file-api.com',
          },
        },
      };
      writeFileSync(testConfigPath, JSON.stringify(config));

      const schema = {
        app: {
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
        },
      };

      const customEnv = {
        DB_HOST: 'env-host',
        API_URL: 'http://env-api.com',
        // DB_PORT not set, should use file value
      };

      const envict = new Envict({
        schema,
        file: testConfigPath,
        env: customEnv,
      });

      const app = envict.get('app');
      expect(app.database.host).toBe('env-host'); // From env
      expect(app.database.port).toBe(5432); // From file
      expect(app.api.url).toBe('http://env-api.com'); // From env

      // Test direct access
      expect(envict.get('app.database.host')).toBe('env-host');
      expect(envict.get('app.database.port')).toBe(5432);
    });

    it('should work with multiple value retrieval and nested objects', () => {
      const schema = {
        server: {
          host: {
            format: 'string',
            default: 'localhost',
          },
          port: {
            format: 'number',
            default: 3000,
          },
        },
        database: {
          host: {
            format: 'string',
            default: 'db-host',
          },
          port: {
            format: 'number',
            default: 5432,
          },
        },
      };

      const envict = new Envict({ schema });

      const result = envict.get(['server', 'database']);
      expect(result.server.host).toBe('localhost');
      expect(result.server.port).toBe(3000);
      expect(result.database.host).toBe('db-host');
      expect(result.database.port).toBe(5432);

      // Test chaining on multiple values
      expect(result.server.host).toBe('localhost');
      expect(result.database.port).toBe(5432);
    });
  });
});
