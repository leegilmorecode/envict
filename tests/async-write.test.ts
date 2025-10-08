import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Envict } from '../src/envict';
import type { AsyncLoader } from '../src/types';

describe('Async Write with asyncWrite() Method', () => {
  const testOutputDir = join(__dirname, 'test-output');

  // Clean up test files before and after each test
  beforeEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync(testOutputDir)) {
      rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('JSON format writing', () => {
    it('should write configuration to JSON file with correct structure', async () => {
      const schema = {
        apiUrl: { format: 'string', default: 'http://localhost' },
        timeout: { format: 'number', default: 5000 },
        database: {
          host: { format: 'string', default: 'localhost' },
          port: { format: 'number', default: 5432 },
        },
        enableLogging: { format: 'boolean', default: true },
      };

      const envict = new Envict({ schema });
      const outputPath = join(testOutputDir, 'config.json');

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'config.json',
        format: 'json',
      });

      // Verify file exists
      expect(existsSync(outputPath)).toBe(true);

      // Verify file contents
      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toEqual({
        apiUrl: 'http://localhost',
        timeout: 5000,
        database: {
          host: 'localhost',
          port: 5432,
        },
        enableLogging: true,
      });
    });

    it('should write configuration after async loading', async () => {
      const schema = {
        apiUrl: { format: 'string', default: 'http://localhost' },
        timeout: { format: 'number', default: 5000 },
        retries: { format: 'number', default: 3 },
      };

      const mockLoader: AsyncLoader = {
        load: jest.fn().mockResolvedValue({
          apiUrl: 'https://api.production.com',
          timeout: 10000,
          retries: 5,
        }),
      };

      const envict = new Envict({ schema });
      await envict.asyncLoad(mockLoader);

      const outputPath = join(testOutputDir, 'loaded-config.json');
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'loaded-config.json',
      });

      // Verify file exists and has correct content
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toEqual({
        apiUrl: 'https://api.production.com',
        timeout: 10000,
        retries: 5,
      });
    });

    it('should create nested directories if they do not exist', async () => {
      const schema = {
        test: { format: 'string', default: 'value' },
      };

      const envict = new Envict({ schema });
      const nestedPath = join(testOutputDir, 'deep', 'nested', 'path');
      const outputPath = join(nestedPath, 'config.json');

      await envict.asyncWrite({
        path: nestedPath,
        fileName: 'config.json',
      });

      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);
      expect(parsedConfig.test).toBe('value');
    });

    it('should handle complex nested configuration', async () => {
      const schema = {
        app: {
          name: { format: 'string', default: 'MyApp' },
          version: { format: 'string', default: '1.0.0' },
        },
        database: {
          primary: {
            host: { format: 'string', default: 'primary-db' },
            port: { format: 'number', default: 5432 },
          },
          replica: {
            host: { format: 'string', default: 'replica-db' },
            port: { format: 'number', default: 5433 },
          },
        },
        features: {
          enableAuth: { format: 'boolean', default: true },
          enableMetrics: { format: 'boolean', default: false },
        },
      };

      const envict = new Envict({ schema });
      const outputPath = join(testOutputDir, 'complex-config.json');

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'complex-config.json',
      });

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toEqual({
        app: {
          name: 'MyApp',
          version: '1.0.0',
        },
        database: {
          primary: {
            host: 'primary-db',
            port: 5432,
          },
          replica: {
            host: 'replica-db',
            port: 5433,
          },
        },
        features: {
          enableAuth: true,
          enableMetrics: false,
        },
      });
    });

    it('should write CDK-ready configuration file', async () => {
      const schema = {
        apiUrl: { format: 'string', default: 'https://api.production.com' },
        timeout: { format: 'number', default: 10000 },
        database: {
          host: { format: 'string', default: 'prod-db.example.com' },
          port: { format: 'number', default: 5432 },
        },
        features: {
          enableAuth: { format: 'boolean', default: true },
          enableMetrics: { format: 'boolean', default: true },
        },
      };

      const envict = new Envict({ schema });
      const outputPath = join(testOutputDir, 'cdk-config.json');

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'cdk-config.json',
        format: 'json',
      });

      // Verify file exists with correct name and extension
      expect(existsSync(outputPath)).toBe(true);
      expect(outputPath.endsWith('cdk-config.json')).toBe(true);

      // Verify file contents are CDK-ready JSON
      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toEqual({
        apiUrl: 'https://api.production.com',
        timeout: 10000,
        database: {
          host: 'prod-db.example.com',
          port: 5432,
        },
        features: {
          enableAuth: true,
          enableMetrics: true,
        },
      });

      // Verify JSON is properly formatted (indented)
      expect(fileContent).toContain('{\n  "apiUrl"');
      expect(fileContent).toContain('  "database": {\n    "host"');
    });
  });

  describe('ENV format writing', () => {
    it('should write configuration to ENV file with correct format', async () => {
      const schema = {
        apiUrl: { format: 'string', default: 'http://localhost' },
        timeout: { format: 'number', default: 5000 },
        database: {
          host: { format: 'string', default: 'localhost' },
          port: { format: 'number', default: 5432 },
        },
        enableLogging: { format: 'boolean', default: true },
      };

      const envict = new Envict({ schema });
      const outputPath = join(testOutputDir, '.env');

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: '.env',
        format: 'env',
      });

      // Verify file exists
      expect(existsSync(outputPath)).toBe(true);

      // Verify file contents
      const fileContent = readFileSync(outputPath, 'utf8');
      const lines = fileContent.split('\n').filter((line) => line.trim());

      expect(lines).toContain('APIURL=http://localhost');
      expect(lines).toContain('DATABASE_HOST=localhost');
      expect(lines).toContain('DATABASE_PORT=5432');
      expect(lines).toContain('ENABLELOGGING=true');
      expect(lines).toContain('TIMEOUT=5000');
    });

    it('should handle string values with spaces and quotes in ENV format', async () => {
      const schema = {
        message: { format: 'string', default: 'Hello World' },
        quotedValue: { format: 'string', default: 'Value with "quotes"' },
        simpleValue: { format: 'string', default: 'simple' },
      };

      const envict = new Envict({ schema });
      const outputPath = join(testOutputDir, '.env.test');

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: '.env.test',
        format: 'env',
      });

      const fileContent = readFileSync(outputPath, 'utf8');
      const lines = fileContent.split('\n').filter((line) => line.trim());

      expect(lines).toContain('MESSAGE="Hello World"');
      expect(lines).toContain('QUOTEDVALUE="Value with \\"quotes\\""');
      expect(lines).toContain('SIMPLEVALUE=simple');
    });
  });

  describe('error handling', () => {
    it('should throw error for invalid path', async () => {
      const envict = new Envict({ schema: {} });

      await expect(
        envict.asyncWrite({
          path: '',
          fileName: 'config.json',
        }),
      ).rejects.toThrow('Failed to write configuration to file');
    });

    it('should throw error for invalid fileName', async () => {
      const envict = new Envict({ schema: {} });

      await expect(
        envict.asyncWrite({
          path: testOutputDir,
          fileName: '',
        }),
      ).rejects.toThrow('Failed to write configuration to file');
    });

    it('should provide helpful error message when write fails', async () => {
      const envict = new Envict({ schema: {} });

      // Try to write to an invalid path (like a file instead of directory)
      const invalidPath = '/dev/null/invalid';

      await expect(
        envict.asyncWrite({
          path: invalidPath,
          fileName: 'config.json',
        }),
      ).rejects.toThrow('Failed to write configuration to file');
    });
  });

  describe('integration with async loading', () => {
    it('should write configuration loaded from multiple async sources', async () => {
      const schema = {
        apiUrl: { format: 'string', default: 'http://localhost' },
        timeout: { format: 'number', default: 5000 },
        retries: { format: 'number', default: 3 },
        enableLogging: { format: 'boolean', default: true },
        features: {
          auth: { format: 'boolean', default: false },
        },
      };

      const baseConfigLoader: AsyncLoader = {
        load: jest.fn().mockResolvedValue({
          apiUrl: 'https://api.production.com',
          timeout: 10000,
        }),
      };

      const featureFlagsLoader: AsyncLoader = {
        load: jest.fn().mockResolvedValue({
          retries: 5,
          enableLogging: false,
          features: {
            auth: true,
          },
        }),
      };

      const envict = new Envict({ schema });

      // Load from multiple sources
      await envict.asyncLoad(baseConfigLoader, featureFlagsLoader);

      // Write to both JSON and ENV formats
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'merged-config.json',
        format: 'json',
      });

      await envict.asyncWrite({
        path: testOutputDir,
        fileName: '.env.merged',
        format: 'env',
      });

      // Verify JSON output
      const jsonPath = join(testOutputDir, 'merged-config.json');
      const jsonContent = JSON.parse(readFileSync(jsonPath, 'utf8'));

      expect(jsonContent).toEqual({
        apiUrl: 'https://api.production.com',
        timeout: 10000,
        retries: 5,
        enableLogging: false,
        features: {
          auth: true,
        },
      });

      // Verify ENV output
      const envPath = join(testOutputDir, '.env.merged');
      const envContent = readFileSync(envPath, 'utf8');

      expect(envContent).toContain('APIURL=https://api.production.com');
      expect(envContent).toContain('TIMEOUT=10000');
      expect(envContent).toContain('RETRIES=5');
      expect(envContent).toContain('ENABLELOGGING=false');
      expect(envContent).toContain('FEATURES_AUTH=true');
    });
  });

  describe('selective writing with select option', () => {
    it('should write only selected portion of configuration', async () => {
      const schema = {
        app: {
          name: { format: 'string', default: 'MyApp' },
          version: { format: 'string', default: '1.0.0' },
        },
        database: {
          host: { format: 'string', default: 'localhost' },
          port: { format: 'number', default: 5432 },
        },
        features: {
          auth: { format: 'boolean', default: true },
          metrics: { format: 'boolean', default: false },
        },
      };

      const envict = new Envict({ schema });

      // Write only the database configuration
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'database-config.json',
        format: 'json',
        select: 'database',
      });

      const outputPath = join(testOutputDir, 'database-config.json');
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      expect(parsedConfig).toEqual({
        host: 'localhost',
        port: 5432,
      });
    });

    it('should write selected portion in ENV format', async () => {
      const schema = {
        app: {
          name: { format: 'string', default: 'MyApp' },
          version: { format: 'string', default: '1.0.0' },
        },
        database: {
          host: { format: 'string', default: 'localhost' },
          port: { format: 'number', default: 5432 },
        },
      };

      const envict = new Envict({ schema });

      // Write only the app configuration as ENV
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: '.env.app',
        format: 'env',
        select: 'app',
      });

      const outputPath = join(testOutputDir, '.env.app');
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const lines = fileContent.split('\n').filter((line) => line.trim());

      expect(lines).toContain('NAME=MyApp');
      expect(lines).toContain('VERSION=1.0.0');
      // Should not contain database config
      expect(lines.some((line) => line.includes('HOST=localhost'))).toBe(false);
    });

    it('should throw error for invalid select path', async () => {
      const schema = {
        app: {
          name: { format: 'string', default: 'MyApp' },
        },
      };

      const envict = new Envict({ schema });

      await expect(
        envict.asyncWrite({
          path: testOutputDir,
          fileName: 'invalid-config.json',
          select: 'nonexistent.path',
        }),
      ).rejects.toThrow('Failed to select configuration path');
    });
  });

  describe('selective writing with fallback option', () => {
    it('should use fallback when select path does not exist', async () => {
      const schema = {
        stages: {
          prod: {
            apiUrl: { format: 'string', default: 'https://api.prod.com' },
            timeout: { format: 'number', default: 10000 },
          },
          ephemeral: {
            apiUrl: { format: 'string', default: 'https://api.ephemeral.com' },
            timeout: { format: 'number', default: 5000 },
          },
        },
      };

      const envict = new Envict({ schema });

      // Try to select non-existent stage, fall back to ephemeral
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'stage-config.json',
        format: 'json',
        select: 'stages.nonexistent',
        fallback: 'stages.ephemeral',
      });

      const outputPath = join(testOutputDir, 'stage-config.json');
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      // Should contain ephemeral config (fallback)
      expect(parsedConfig).toEqual({
        apiUrl: 'https://api.ephemeral.com',
        timeout: 5000,
      });
    });

    it('should use select path when it exists, ignoring fallback', async () => {
      const schema = {
        stages: {
          prod: {
            apiUrl: { format: 'string', default: 'https://api.prod.com' },
            timeout: { format: 'number', default: 10000 },
          },
          ephemeral: {
            apiUrl: { format: 'string', default: 'https://api.ephemeral.com' },
            timeout: { format: 'number', default: 5000 },
          },
        },
      };

      const envict = new Envict({ schema });

      // Select existing prod stage, fallback should be ignored
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: 'prod-config.json',
        format: 'json',
        select: 'stages.prod',
        fallback: 'stages.ephemeral',
      });

      const outputPath = join(testOutputDir, 'prod-config.json');
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const parsedConfig = JSON.parse(fileContent);

      // Should contain prod config (select), not ephemeral (fallback)
      expect(parsedConfig).toEqual({
        apiUrl: 'https://api.prod.com',
        timeout: 10000,
      });
    });

    it('should work with fallback in ENV format', async () => {
      const schema = {
        stages: {
          develop: {
            logLevel: { format: 'string', default: 'DEBUG' },
            enableMetrics: { format: 'boolean', default: true },
          },
        },
      };

      const envict = new Envict({ schema });

      // Try non-existent stage, fall back to develop
      await envict.asyncWrite({
        path: testOutputDir,
        fileName: '.env.fallback',
        format: 'env',
        select: 'stages.missing',
        fallback: 'stages.develop',
      });

      const outputPath = join(testOutputDir, '.env.fallback');
      expect(existsSync(outputPath)).toBe(true);

      const fileContent = readFileSync(outputPath, 'utf8');
      const lines = fileContent.split('\n').filter((line) => line.trim());

      expect(lines).toContain('LOGLEVEL=DEBUG');
      expect(lines).toContain('ENABLEMETRICS=true');
    });
  });
});
