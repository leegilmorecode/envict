/**
 * Unit tests for async loading functionality
 */

import { existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ApiLoader } from '../src/async-loaders';
import { Envict } from '../src/envict';
import type { AsyncLoader } from '../src/types';

// Mock fetch globally for testing
global.fetch = jest.fn();

describe('Async Loading with asyncLoad() Method', () => {
  const testConfigPath = join(__dirname, 'test-async-config.json');

  // Clean up test files after each test
  afterEach(() => {
    if (existsSync(testConfigPath)) {
      unlinkSync(testConfigPath);
    }
    jest.clearAllMocks();
  });

  describe('ApiLoader', () => {
    it('should load configuration from API successfully', async () => {
      const mockResponse = {
        apiUrl: 'https://api.example.com',
        timeout: 5000,
        retries: 3,
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const loader = new ApiLoader('https://config-api.example.com/config');
      const result = await loader.load();

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://config-api.example.com/config',
        undefined,
      );
    });

    it('should pass custom fetch options', async () => {
      const mockResponse = { key: 'value' };
      const fetchOptions = {
        method: 'POST',
        headers: { Authorization: 'Bearer token123' },
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const loader = new ApiLoader('https://api.example.com', fetchOptions);
      await loader.load();

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com',
        fetchOptions,
      );
    });

    it('should throw error for failed API requests', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const loader = new ApiLoader('https://api.example.com/config');

      await expect(loader.load()).rejects.toThrow(
        'Failed to load configuration from API: API request failed: 404 Not Found',
      );
    });

    it('should throw error for invalid JSON response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('not an object'),
      });

      const loader = new ApiLoader('https://api.example.com/config');

      await expect(loader.load()).rejects.toThrow(
        'Failed to load configuration from API: API response must be a JSON object, received: string',
      );
    });

    it('should throw error for array response', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([1, 2, 3]),
      });

      const loader = new ApiLoader('https://api.example.com/config');

      await expect(loader.load()).rejects.toThrow(
        'Failed to load configuration from API: API response must be a JSON object',
      );
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      const loader = new ApiLoader('https://api.example.com/config');

      await expect(loader.load()).rejects.toThrow(
        'Failed to load configuration from API: Network error',
      );
    });
  });

  describe('asyncLoad() method', () => {
    describe('basic async loading', () => {
      it('should load configuration from async loader', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
          timeout: { format: 'number', default: 1000 },
        };

        const envict = new Envict({ schema });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({
            apiUrl: 'https://api.example.com',
            timeout: 5000,
          }),
        };

        await envict.asyncLoad(mockLoader);

        expect(envict.get('apiUrl')).toBe('https://api.example.com');
        expect(envict.get('timeout')).toBe(5000);
        expect(mockLoader.load).toHaveBeenCalledTimes(1);
      });

      it('should support method chaining with async loads', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
          timeout: { format: 'number', default: 1000 },
          retries: { format: 'number', default: 1 },
        };

        const envict = new Envict({ schema });

        const loader1: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ apiUrl: 'https://api1.com' }),
        };

        const loader2: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ timeout: 3000 }),
        };

        const result = await (await envict.asyncLoad(loader1)).asyncLoad(
          loader2,
        );

        expect(result).toBe(envict);
        expect(envict.get('apiUrl')).toBe('https://api1.com');
        expect(envict.get('timeout')).toBe(3000);
      });

      it('should load from multiple loaders in single call', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
          timeout: { format: 'number', default: 1000 },
          retries: { format: 'number', default: 1 },
        };

        const envict = new Envict({ schema });

        const loader1: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ apiUrl: 'https://api1.com' }),
        };

        const loader2: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ timeout: 3000 }),
        };

        await envict.asyncLoad(loader1, loader2);

        expect(envict.get('apiUrl')).toBe('https://api1.com');
        expect(envict.get('timeout')).toBe(3000);
        expect(loader1.load).toHaveBeenCalledTimes(1);
        expect(loader2.load).toHaveBeenCalledTimes(1);
      });
    });

    describe('precedence and merging', () => {
      it('should ensure environment variables take precedence over async loaded data', async () => {
        const schema = {
          apiUrl: {
            format: 'string',
            env: 'API_URL',
            default: 'http://localhost',
          },
          timeout: { format: 'number', default: 1000 },
        };

        const customEnv = { API_URL: 'https://env.example.com' };
        const envict = new Envict({ schema, env: customEnv });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({
            apiUrl: 'https://api.example.com',
            timeout: 5000,
          }),
        };

        await envict.asyncLoad(mockLoader);

        expect(envict.get('apiUrl')).toBe('https://env.example.com'); // Env wins
        expect(envict.get('timeout')).toBe(5000); // From async loader
      });

      it('should merge async loaded data with existing configuration', async () => {
        const config = { apiUrl: 'https://file.example.com', debug: true };
        writeFileSync(testConfigPath, JSON.stringify(config));

        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
          timeout: { format: 'number', default: 1000 },
          debug: { format: 'boolean', default: false },
        };

        const envict = new Envict({ schema, file: testConfigPath });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ timeout: 5000 }),
        };

        await envict.asyncLoad(mockLoader);

        expect(envict.get('apiUrl')).toBe('https://file.example.com'); // From file
        expect(envict.get('timeout')).toBe(5000); // From async loader
        expect(envict.get('debug')).toBe(true); // From file
      });

      it('should overwrite existing values with async loaded data', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
          timeout: { format: 'number', default: 1000 },
        };

        const envict = new Envict({ schema });

        const loader1: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ apiUrl: 'https://api1.com' }),
        };

        const loader2: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ apiUrl: 'https://api2.com' }),
        };

        await envict.asyncLoad(loader1);
        expect(envict.get('apiUrl')).toBe('https://api1.com');

        await envict.asyncLoad(loader2);
        expect(envict.get('apiUrl')).toBe('https://api2.com'); // Overwritten
      });
    });

    describe('error handling', () => {
      it('should fail fast when first loader fails', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
        };

        const envict = new Envict({ schema });

        const failingLoader: AsyncLoader = {
          load: jest.fn().mockRejectedValue(new Error('Loader failed')),
        };

        const successLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ apiUrl: 'https://api.com' }),
        };

        await expect(
          envict.asyncLoad(failingLoader, successLoader),
        ).rejects.toThrow('Loader failed');

        // Second loader should not be called due to fail-fast behavior
        expect(failingLoader.load).toHaveBeenCalledTimes(1);
        expect(successLoader.load).not.toHaveBeenCalled();
      });

      it('should maintain configuration state when async loading fails', async () => {
        const schema = {
          apiUrl: { format: 'string', default: 'http://localhost' },
        };

        const envict = new Envict({ schema });

        const originalApiUrl = envict.get('apiUrl');

        const failingLoader: AsyncLoader = {
          load: jest.fn().mockRejectedValue(new Error('Loader failed')),
        };

        await expect(envict.asyncLoad(failingLoader)).rejects.toThrow(
          'Loader failed',
        );

        // Configuration should remain unchanged
        expect(envict.get('apiUrl')).toBe(originalApiUrl);
      });

      it('should re-validate configuration after successful async loading', async () => {
        const schema = {
          port: { format: 'number', default: 3000 },
        };

        const envict = new Envict({ schema });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({ port: 8080 }),
        };

        await envict.asyncLoad(mockLoader);

        expect(envict.get('port')).toBe(8080);
        expect(typeof envict.get('port')).toBe('number');
      });
    });

    describe('integration with existing features', () => {
      it('should work with nested object access after async loading', async () => {
        const schema = {
          'database.host': { format: 'string', default: 'localhost' },
          'database.port': { format: 'number', default: 5432 },
        };

        const envict = new Envict({ schema });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({
            'database.host': 'remote-db.com',
            'database.port': 3306,
          }),
        };

        await envict.asyncLoad(mockLoader);

        const database = envict.get('database');
        expect(database).toEqual({
          host: 'remote-db.com',
          port: 3306,
        });
      });

      it('should work with tryGet after async loading', async () => {
        const schema = {
          'stages.prod.apiUrl': {
            format: 'string',
            default: 'https://prod-api.com',
          },
          'stages.ephemeral.apiUrl': {
            format: 'string',
            default: 'https://ephemeral-api.com',
          },
        };

        const envict = new Envict({ schema });

        const mockLoader: AsyncLoader = {
          load: jest.fn().mockResolvedValue({
            'stages.test.apiUrl': 'https://test-api.com',
          }),
        };

        await envict.asyncLoad(mockLoader);

        // Should get test config (exists after async load)
        const testConfig = envict.tryGet('stages.test', 'stages.ephemeral');
        expect(testConfig).toEqual({ apiUrl: 'https://test-api.com' });

        // Should get ephemeral config (fallback)
        const unknownConfig = envict.tryGet(
          'stages.unknown',
          'stages.ephemeral',
        );
        expect(unknownConfig).toEqual({ apiUrl: 'https://ephemeral-api.com' });
      });
    });
  });
});
