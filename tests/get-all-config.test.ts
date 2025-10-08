import { Envict } from '../src/envict';

describe('Envict get() without parameters', () => {
  it('should return all configuration when called without parameters', () => {
    const config = new Envict({
      schema: {
        port: { format: 'number', default: 3000 },
        host: { format: 'string', default: 'localhost' },
        database: {
          url: { format: 'string', default: 'mongodb://localhost:27017' },
          name: { format: 'string', default: 'myapp' },
        },
      },
    });

    const allConfig = config.get();

    expect(allConfig).toEqual({
      port: 3000,
      host: 'localhost',
      database: {
        url: 'mongodb://localhost:27017',
        name: 'myapp',
      },
    });
  });

  it('should return all configuration including environment variables', () => {
    const config = new Envict({
      schema: {
        port: { format: 'number', default: 3000, env: 'PORT' },
        host: { format: 'string', default: 'localhost', env: 'HOST' },
      },
      env: {
        PORT: '8080',
        HOST: 'example.com',
      },
    });

    const allConfig = config.get();

    expect(allConfig).toEqual({
      port: 8080,
      host: 'example.com',
    });
  });

  it('should return all configuration with nested structure from dot notation', () => {
    const config = new Envict({
      schema: {
        'app.name': { format: 'string', default: 'MyApp' },
        'app.version': { format: 'string', default: '1.0.0' },
        'database.host': { format: 'string', default: 'localhost' },
        'database.port': { format: 'number', default: 5432 },
      },
    });

    const allConfig = config.get();

    expect(allConfig).toEqual({
      app: {
        name: 'MyApp',
        version: '1.0.0',
      },
      database: {
        host: 'localhost',
        port: 5432,
      },
    });
  });

  it('should maintain type safety for the returned configuration', () => {
    interface AppConfig {
      port: number;
      host: string;
      debug: boolean;
    }

    const config = new Envict<AppConfig>({
      schema: {
        port: { format: 'number', default: 3000 },
        host: { format: 'string', default: 'localhost' },
        debug: { format: 'boolean', default: false },
      },
    });

    const allConfig: AppConfig = config.get();

    expect(typeof allConfig.port).toBe('number');
    expect(typeof allConfig.host).toBe('string');
    expect(typeof allConfig.debug).toBe('boolean');
    expect(allConfig).toEqual({
      port: 3000,
      host: 'localhost',
      debug: false,
    });
  });
});
