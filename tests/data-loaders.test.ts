/**
 * Unit tests for data loading components
 */
import { fail } from 'node:assert';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  EnvironmentLoader,
  FileLoader,
  mergeConfig,
} from '../src/data-loaders';
import { FileError } from '../src/types';

describe('EnvironmentLoader', () => {
  describe('constructor', () => {
    it('should create instance with env mappings', () => {
      const mappings = new Map([['database.host', 'DB_HOST']]);
      const loader = new EnvironmentLoader(mappings);

      expect(loader).toBeInstanceOf(EnvironmentLoader);
    });

    it('should accept custom environment object', () => {
      const mappings = new Map([['api.url', 'API_URL']]);
      const customEnv = { API_URL: 'https://api.example.com' };
      const loader = new EnvironmentLoader(mappings, customEnv);

      expect(loader).toBeInstanceOf(EnvironmentLoader);
    });
  });

  describe('load', () => {
    it('should load values from environment variables', () => {
      const mappings = new Map([
        ['database.host', 'DB_HOST'],
        ['database.port', 'DB_PORT'],
        ['api.url', 'API_URL'],
      ]);
      const env = {
        DB_HOST: 'localhost',
        DB_PORT: '5432',
        API_URL: 'https://api.example.com',
      };

      const loader = new EnvironmentLoader(mappings, env);
      const result = loader.load();

      expect(result).toEqual({
        'database.host': 'localhost',
        'database.port': '5432',
        'api.url': 'https://api.example.com',
      });
    });

    it('should skip undefined environment variables', () => {
      const mappings = new Map([
        ['database.host', 'DB_HOST'],
        ['database.port', 'DB_PORT'],
        ['api.url', 'API_URL'],
      ]);
      const env = {
        DB_HOST: 'localhost',
        // DB_PORT is missing
        API_URL: 'https://api.example.com',
      };

      const loader = new EnvironmentLoader(mappings, env);
      const result = loader.load();

      expect(result).toEqual({
        'database.host': 'localhost',
        'api.url': 'https://api.example.com',
      });
      expect(result).not.toHaveProperty('database.port');
    });

    it('should handle empty environment variables', () => {
      const mappings = new Map([
        ['database.host', 'DB_HOST'],
        ['api.key', 'API_KEY'],
      ]);
      const env = {
        DB_HOST: '',
        API_KEY: '   ',
      };

      const loader = new EnvironmentLoader(mappings, env);
      const result = loader.load();

      expect(result).toEqual({
        'database.host': '',
        'api.key': '   ',
      });
    });

    it('should return empty object when no mappings match', () => {
      const mappings = new Map([
        ['database.host', 'DB_HOST'],
        ['api.url', 'API_URL'],
      ]);
      const env = {
        OTHER_VAR: 'value',
      };

      const loader = new EnvironmentLoader(mappings, env);
      const result = loader.load();

      expect(result).toEqual({});
    });

    it('should use process.env by default', () => {
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      const originalEnv = process.env['TEST_VAR'];
      // biome-ignore lint/complexity/useLiteralKeys: custom implementation
      process.env['TEST_VAR'] = 'test-value';

      try {
        const mappings = new Map([['test.var', 'TEST_VAR']]);
        const loader = new EnvironmentLoader(mappings);
        const result = loader.load();

        expect(result).toEqual({
          'test.var': 'test-value',
        });
      } finally {
        if (originalEnv !== undefined) {
          // biome-ignore lint/complexity/useLiteralKeys: custom implementation
          process.env['TEST_VAR'] = originalEnv;
        } else {
          // biome-ignore lint/complexity/useLiteralKeys: custom implementation
          process.env['TEST_VAR'] = undefined;
        }
      }
    });

    it('should work in Lambda-like environment with runtime environment variables', () => {
      // Simulate Lambda environment variables set at runtime
      const lambdaEnv = {
        AWS_REGION: 'us-east-1',
        DB_HOST: 'prod-database.amazonaws.com',
        DB_PORT: '5432',
        API_KEY: 'lambda-runtime-key',
        DEBUG: 'false',
      };

      const mappings = new Map([
        ['aws.region', 'AWS_REGION'],
        ['database.host', 'DB_HOST'],
        ['database.port', 'DB_PORT'],
        ['api.key', 'API_KEY'],
        ['debug', 'DEBUG'],
      ]);

      const loader = new EnvironmentLoader(mappings, lambdaEnv);
      const result = loader.load();

      expect(result).toEqual({
        'aws.region': 'us-east-1',
        'database.host': 'prod-database.amazonaws.com',
        'database.port': '5432',
        'api.key': 'lambda-runtime-key',
        debug: 'false',
      });
    });

    it('should handle server deployment scenario with mixed environment variables', () => {
      // Simulate server environment with some variables set, others missing
      const serverEnv = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://prod-server:5432/myapp',
        REDIS_URL: 'redis://prod-redis:6379',
        // API_SECRET is intentionally missing to test partial loading
      };

      const mappings = new Map([
        ['env', 'NODE_ENV'],
        ['database.url', 'DATABASE_URL'],
        ['cache.redis.url', 'REDIS_URL'],
        ['api.secret', 'API_SECRET'],
      ]);

      const loader = new EnvironmentLoader(mappings, serverEnv);
      const result = loader.load();

      expect(result).toEqual({
        env: 'production',
        'database.url': 'postgresql://prod-server:5432/myapp',
        'cache.redis.url': 'redis://prod-redis:6379',
        // api.secret should not be present since API_SECRET is undefined
      });
      expect(result).not.toHaveProperty('api.secret');
    });
  });
});

describe('FileLoader', () => {
  const testDir = join(__dirname, 'test-configs');

  beforeEach(() => {
    // Create test directory
    try {
      mkdirSync(testDir, { recursive: true });
    } catch {
      // Directory might already exist
    }
  });

  afterEach(() => {
    // Clean up test directory
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  describe('constructor', () => {
    it('should create instance with file path', () => {
      const loader = new FileLoader('/path/to/config.json');

      expect(loader).toBeInstanceOf(FileLoader);
    });
  });

  describe('load', () => {
    it('should load and parse valid JSON file', () => {
      const configPath = join(testDir, 'valid-config.json');
      const configData = {
        database: {
          host: 'localhost',
          port: 5432,
        },
        api: {
          url: 'https://api.example.com',
          timeout: 30000,
        },
      };

      writeFileSync(configPath, JSON.stringify(configData, null, 2));

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({
        'database.host': 'localhost',
        'database.port': 5432,
        'api.url': 'https://api.example.com',
        'api.timeout': 30000,
      });
    });

    it('should handle flat JSON objects', () => {
      const configPath = join(testDir, 'flat-config.json');
      const configData = {
        host: 'localhost',
        port: 5432,
        debug: true,
      };

      writeFileSync(configPath, JSON.stringify(configData));

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({
        host: 'localhost',
        port: 5432,
        debug: true,
      });
    });

    it('should handle arrays in JSON', () => {
      const configPath = join(testDir, 'array-config.json');
      const configData = {
        servers: ['server1', 'server2'],
        database: {
          hosts: ['db1', 'db2', 'db3'],
        },
      };

      writeFileSync(configPath, JSON.stringify(configData));

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({
        servers: ['server1', 'server2'],
        'database.hosts': ['db1', 'db2', 'db3'],
      });
    });

    it('should handle null values in JSON', () => {
      const configPath = join(testDir, 'null-config.json');
      const configData = {
        database: {
          password: null,
          ssl: false,
        },
        cache: null,
      };

      writeFileSync(configPath, JSON.stringify(configData));

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({
        'database.password': null,
        'database.ssl': false,
        cache: null,
      });
    });

    it('should throw FileError for non-existent file', () => {
      const configPath = join(testDir, 'non-existent.json');
      const loader = new FileLoader(configPath);

      expect(() => loader.load()).toThrow(FileError);
      expect(() => loader.load()).toThrow(/Failed to read configuration file/);
    });

    it('should throw FileError for invalid JSON', () => {
      const configPath = join(testDir, 'invalid.json');
      writeFileSync(configPath, '{ invalid json content }');

      const loader = new FileLoader(configPath);

      expect(() => loader.load()).toThrow(FileError);
      expect(() => loader.load()).toThrow(/Failed to parse JSON/);
    });

    it('should throw FileError with file path in error', () => {
      const configPath = join(testDir, 'non-existent.json');
      const loader = new FileLoader(configPath);

      try {
        loader.load();
        fail('Expected FileError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        expect((error as FileError).filePath).toBe(configPath);
      }
    });

    it('should handle empty JSON file', () => {
      const configPath = join(testDir, 'empty.json');
      writeFileSync(configPath, '{}');

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({});
    });

    it('should handle deeply nested objects', () => {
      const configPath = join(testDir, 'deep-config.json');
      const configData = {
        level1: {
          level2: {
            level3: {
              value: 'deep-value',
              number: 42,
            },
          },
        },
      };

      writeFileSync(configPath, JSON.stringify(configData));

      const loader = new FileLoader(configPath);
      const result = loader.load();

      expect(result).toEqual({
        'level1.level2.level3.value': 'deep-value',
        'level1.level2.level3.number': 42,
      });
    });
  });
});

describe('mergeConfig', () => {
  describe('merge', () => {
    it('should merge file and environment data with env precedence', () => {
      const fileData = {
        'database.host': 'file-host',
        'database.port': 3306,
        'api.url': 'https://file-api.com',
      };

      const envData = {
        'database.host': 'env-host',
        'api.timeout': 5000,
      };

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual({
        'database.host': 'env-host', // env overrides file
        'database.port': 3306, // from file (no env override)
        'api.url': 'https://file-api.com', // from file (no env override)
        'api.timeout': 5000, // from env (new property)
      });
    });

    it('should handle empty file data', () => {
      const fileData = {};
      const envData = {
        'database.host': 'localhost',
        'api.url': 'https://api.example.com',
      };

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual(envData);
    });

    it('should handle empty environment data', () => {
      const fileData = {
        'database.host': 'localhost',
        'api.url': 'https://api.example.com',
      };
      const envData = {};

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual(fileData);
    });

    it('should handle both empty data sources', () => {
      const fileData = {};
      const envData = {};

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual({});
    });

    it('should preserve data types during merge', () => {
      const fileData = {
        'database.port': 3306,
        'api.enabled': true,
        'cache.ttl': null,
      };

      const envData = {
        'database.port': '5432', // string from env
        'api.debug': false,
      };

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual({
        'database.port': '5432', // env string overrides file number
        'api.enabled': true,
        'cache.ttl': null,
        'api.debug': false,
      });
    });

    it('should handle complex nested property paths', () => {
      const fileData = {
        'app.database.primary.host': 'file-db-host',
        'app.database.primary.port': 5432,
        'app.cache.redis.host': 'file-redis-host',
      };

      const envData = {
        'app.database.primary.host': 'env-db-host',
        'app.cache.redis.port': 6379,
      };

      const result = mergeConfig(fileData, envData);

      expect(result).toEqual({
        'app.database.primary.host': 'env-db-host',
        'app.database.primary.port': 5432,
        'app.cache.redis.host': 'file-redis-host',
        'app.cache.redis.port': 6379,
      });
    });

    it('should demonstrate Lambda deployment scenario with environment override', () => {
      // Simulate config.json deployed with Lambda package
      const packagedFileData = {
        'database.host': 'localhost',
        'database.port': 5432,
        'api.url': 'https://dev-api.example.com',
        'api.timeout': 30000,
        debug: true,
      };

      // Simulate Lambda environment variables set at deployment/runtime
      const lambdaEnvData = {
        'database.host': 'prod-rds.amazonaws.com',
        'api.url': 'https://prod-api.example.com',
        debug: false,
        // Note: database.port and api.timeout will use file values
      };

      const result = mergeConfig(packagedFileData, lambdaEnvData);

      expect(result).toEqual({
        'database.host': 'prod-rds.amazonaws.com', // overridden by Lambda env
        'database.port': 5432, // from packaged file
        'api.url': 'https://prod-api.example.com', // overridden by Lambda env
        'api.timeout': 30000, // from packaged file
        debug: false, // overridden by Lambda env
      });
    });

    it('should demonstrate server deployment with Docker environment injection', () => {
      // Simulate application config file
      const appConfigFile = {
        'server.port': 3000,
        'database.host': 'localhost',
        'database.name': 'myapp',
        'cache.enabled': true,
        'logging.level': 'info',
      };

      // Simulate Docker environment variables injected at container runtime
      const dockerEnvVars = {
        'server.port': '8080',
        'database.host': 'postgres-service',
        'database.name': 'production_db',
        'logging.level': 'warn',
        // cache.enabled will use file default
      };

      const result = mergeConfig(appConfigFile, dockerEnvVars);

      expect(result).toEqual({
        'server.port': '8080', // overridden by Docker env
        'database.host': 'postgres-service', // overridden by Docker env
        'database.name': 'production_db', // overridden by Docker env
        'cache.enabled': true, // from config file
        'logging.level': 'warn', // overridden by Docker env
      });
    });
  });
});
