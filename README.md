# Envict

A zero-dependency TypeScript configuration management package.

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/leighton-digital/llm-test-tools/blob/master/LICENSE)
![Maintained](https://img.shields.io/maintenance/yes/2025)

<p align="center">
  <img src="docs/images/envict.png" width="400" />
</p>

> ⚠️ **Alpha Release Warning**
> This package is currently in alpha and the API is subject to change. While we strive for stability, breaking changes may occur between versions. Please use with caution in production environments and pin to specific versions.

> 👻 This package was created using Kiro and spec-driven AI engineering.

## Features

- 🔒 **Zero dependencies** - No external runtime dependencies
- 🛡️ **Type safety** - Full TypeScript support with generics
- 📁 **Flexible data sources** - Environment variables and JSON files
- ✅ **Comprehensive validation** - Type parsing, format validation, and error handling
- 🎯 **Developer experience** - Clear APIs and helpful error messages

## Requirements

- **Node.js**: 18.13.0 or higher (for native fetch API support)
- **TypeScript**: 4.5+ (optional, but recommended for full type safety)

### AWS Lambda & CDK Compatibility

✅ **Fully compatible** with AWS Lambda Node.js
✅ **Perfect for CDK projects** - supports both sync file loading and async API configuration
✅ **Zero dependencies** - no additional bundle size impact

## Installation

```bash
npm install @serverless-advocate/envict
```

## Quick Start

```typescript
import { Envict } from '@serverless-advocate/envict';

// Define your configuration schema
const schema = {
  port: {
    description: 'Server port',
    format: 'number',
    env: 'PORT',
    default: 3000,
  },
  host: {
    description: 'Server host',
    format: 'string',
    env: 'HOST',
    default: 'localhost',
  },
  debug: {
    description: 'Enable debug mode',
    format: 'boolean',
    env: 'DEBUG',
    default: false,
  },
};

// Create Envict instance
const config = new Envict({ schema });

// Access configuration values
const port = config.get('port'); // number: 3000 (or from PORT env var)
const host = config.get('host'); // string: 'localhost' (or from HOST env var)
const debug = config.get('debug'); // boolean: false (or from DEBUG env var)

console.log(`Server starting on ${host}:${port}, debug: ${debug}`);
```

## Runtime Configuration Loading

Envict supports loading additional configuration files at runtime using the `load()` method. This enables dynamic configuration scenarios and layered configuration management.

### Basic Usage

```typescript
const envict = new Envict({ schema });

// Load additional configuration at runtime
envict.load('./runtime-config.json');

// Method chaining is supported
envict.load('./base-config.json').load('./environment-overrides.json');
```

### Configuration Precedence

Envict follows a strict precedence order when merging configuration from multiple sources:

| Priority        | Source                    | Description                      | Example                               |
| --------------- | ------------------------- | -------------------------------- | ------------------------------------- |
| **1** (Highest) | **Environment Variables** | Always take precedence           | `process.env.LOG_LEVEL`               |
| **2**           | **Runtime Files**         | Files loaded via `load()` method | `envict.load('./override.json')`      |
| **3**           | **Constructor File**      | File specified in constructor    | `new Envict({ file: './base.json' })` |
| **4** (Lowest)  | **Schema Defaults**       | Default values in schema         | `default: 'INFO'`                     |

### Precedence Example

```typescript
// 1. Schema with defaults
const schema = {
  shared: {
    logging: {
      logLevel: {
        format: 'string',
        env: 'LOG_LEVEL',
        default: 'INFO', // ← Priority 4: Schema default
      },
    },
  },
};

// 2. Constructor file (base-config.json)
// { "shared": { "logging": { "logLevel": "DEBUG" } } }  ← Priority 3

// 3. Environment variable
// LOG_LEVEL=ERROR  ← Priority 1: Highest precedence

// 4. Runtime file (override-config.json)
// { "shared": { "logging": { "logLevel": "WARN" } } }  ← Priority 2

const envict = new Envict({
  schema,
  file: './base-config.json', // Priority 3
});

envict.load('./override-config.json'); // Priority 2

// Result: LOG_LEVEL=ERROR wins (Priority 1)
console.log(envict.get('shared').logging.logLevel); // "ERROR"
```

### Advanced Scenarios

#### Conditional Configuration Loading

```typescript
const envict = new Envict({ schema, file: './base-config.json' });

// Load environment-specific overrides
if (process.env.NODE_ENV === 'production') {
  envict.load('./prod-overrides.json');
} else if (process.env.NODE_ENV === 'staging') {
  envict.load('./staging-overrides.json');
}
```

#### Layered Configuration

```typescript
const envict = new Envict({ schema })
  .load('./defaults.json') // Base configuration
  .load('./team-config.json') // Team-specific settings
  .load('./local-overrides.json'); // Local development overrides

// Environment variables still take highest precedence
```

#### Partial Updates

Runtime loading supports partial configuration updates - you only need to specify the properties you want to change:

```typescript
// runtime-override.json
{
  "shared": {
    "logging": {
      "logLevel": "DEBUG"
      // Other logging properties remain unchanged
    }
  }
  // Other configuration sections remain unchanged
}
```

## Async Configuration Loading

Envict supports loading configuration from any async source using the `asyncLoad()` method. This powerful feature enables dynamic configuration from APIs, databases, cloud services, and more.

### Built-in API Loader

The `ApiLoader` fetches configuration from REST API endpoints:

```typescript
import { Envict, ApiLoader } from '@serverless-advocate/envict';

const envict = new Envict({ schema });

// Load configuration from API
const apiLoader = new ApiLoader('https://config-api.example.com/config');
await envict.asyncLoad(apiLoader);

// With custom headers and options
const authenticatedLoader = new ApiLoader('https://api.example.com/config', {
  headers: {
    Authorization: 'Bearer your-token',
    'Content-Type': 'application/json',
  },
});
await envict.asyncLoad(authenticatedLoader);
```

### Creating Custom Loaders

You can create custom loaders for any async data source by implementing the `AsyncLoader` interface:

```typescript
import { AsyncLoader } from '@serverless-advocate/envict';

// AWS Parameter Store loader example
class ParameterStoreLoader implements AsyncLoader {
  constructor(private ssm: SSMClient, private prefix: string) {}

  async load(): Promise<Record<string, unknown>> {
    const params = await this.ssm.getParametersByPath({
      Path: this.prefix,
      Recursive: true,
    });

    const config: Record<string, unknown> = {};

    for (const param of params.Parameters || []) {
      if (param.Name && param.Value) {
        // Convert /myapp/database/host to database.host
        const key = param.Name.replace(this.prefix, '').replace(/\//g, '.');
        config[key] = param.Value;
      }
    }

    return config;
  }
}

// DynamoDB loader example
class DynamoConfigLoader implements AsyncLoader {
  constructor(private dynamo: DynamoDBClient, private tableName: string) {}

  async load(): Promise<Record<string, unknown>> {
    const result = await this.dynamo.scan({
      TableName: this.tableName,
    });

    const config: Record<string, unknown> = {};

    for (const item of result.Items || []) {
      const key = item.configKey?.S;
      const value = item.configValue?.S;
      if (key && value) {
        config[key] = JSON.parse(value);
      }
    }

    return config;
  }
}

// Usage
const paramLoader = new ParameterStoreLoader(ssmClient, '/myapp/');
const dynamoLoader = new DynamoConfigLoader(dynamoClient, 'config-table');

await envict.asyncLoad(paramLoader);
await envict.asyncLoad(dynamoLoader);
```

### Multiple Async Loaders

Load from multiple sources in a single call:

```typescript
// Load from multiple sources at once
await envict.asyncLoad(
  new ApiLoader('https://api.example.com/config'),
  new ParameterStoreLoader(ssmClient, '/myapp/'),
  new DynamoConfigLoader(dynamoClient, 'config-table')
);

// Or chain them (each awaited separately)
await(await envict.asyncLoad(apiLoader)).asyncLoad(paramLoader);
```

### Async Loading Features

- **Fail-fast behavior** - Stops on first loader error
- **Same precedence rules** - Environment variables still take highest precedence
- **Full validation** - All loaded data is validated against your schema
- **Type safety** - Works seamlessly with TypeScript
- **Error handling** - Clear error messages for debugging

### Use Cases

**API-driven Configuration**

```typescript
// Load feature flags from API
const flagsLoader = new ApiLoader('https://flags-api.com/flags');
await envict.asyncLoad(flagsLoader);
```

## Async Configuration Writing

Envict supports writing configuration to files using the `asyncWrite()` method. This feature bridges the gap between async configuration loading and synchronous file consumption, making it perfect for CI/CD pipelines, CDK deployments, and containerized applications.

### Basic Usage

```typescript
import { Envict } from '@serverless-advocate/envict';

const envict = new Envict({ schema });

// Write configuration as JSON (perfect for CDK)
await envict.asyncWrite({
  path: './output',
  fileName: 'config.json',
  format: 'json',
});

// Write configuration as ENV file (perfect for containers)
await envict.asyncWrite({
  path: './output',
  fileName: '.env.production',
  format: 'env',
});
```

### Output Formats

**JSON Format** - Structured data with nested objects:

```json
{
  "apiUrl": "https://api.production.com",
  "timeout": 10000,
  "database": {
    "host": "prod-db.example.com",
    "port": 5432
  },
  "features": {
    "enableAuth": true,
    "enableMetrics": false
  }
}
```

**ENV Format** - Environment variables with proper escaping:

```bash
APIURL=https://api.production.com
TIMEOUT=10000
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
FEATURES_ENABLEAUTH=true
FEATURES_ENABLEMETRICS=false
```

### Selective Writing

Write only specific portions of your configuration using the `select` option:

```typescript
// Write only the database configuration
await envict.asyncWrite({
  path: './output',
  fileName: 'database-config.json',
  format: 'json',
  select: 'database',
});

// Write only staging environment config
await envict.asyncWrite({
  path: './output',
  fileName: 'staging-config.json',
  select: 'stages.staging',
});
```

### Selective Writing with Fallback

Use `tryGet` functionality in `asyncWrite` with fallback support:

```typescript
// Try to write specific stage config, fall back to ephemeral template
await envict.asyncWrite({
  path: './output',
  fileName: `${stage}-config.json`,
  format: 'json',
  select: `stages.${stage}`,
  fallback: 'stages.ephemeral',
});

// Perfect for dynamic stage configurations
const stage = process.env.STAGE; // could be pr-123
await envict.asyncWrite({
  path: './cdk',
  fileName: 'stage-config.json',
  select: `stages.${stage}`,
  fallback: 'stages.develop', // Always fall back to develop
});
```

### Async Load + Write Workflow

Perfect for build-time configuration fetching:

```typescript
// Load configuration from multiple async sources
await envict.asyncLoad(
  new ApiLoader('https://config-api.example.com/base'),
  new ApiLoader('https://flags-api.example.com/features')
);

// Write to files for synchronous consumption
await envict.asyncWrite({
  path: './build-output',
  fileName: 'cdk-config.json',
  format: 'json',
});

await envict.asyncWrite({
  path: './docker',
  fileName: '.env.production',
  format: 'env',
});
```

### Use Cases

- **CDK Deployments** - Pre-populate config files before CDK synthesis
- **Build-time Configuration** - Fetch config during CI/CD pipelines
- **Docker Image Preparation** - Bake configuration into container images
- **Static Site Generation** - Pre-fetch configuration for static builds
- **Async-to-Sync Bridge** - Load from async sources, consume synchronously

### Error Handling

```typescript
try {
  await envict.asyncWrite({
    path: '/invalid/path',
    fileName: 'config.json',
  });
} catch (error) {
  console.error('Failed to write configuration:', error.message);
  // Handle write failure appropriately
}
```

## Singleton Configuration Pattern

For applications that need to access configuration throughout the codebase, you can create a singleton configuration module that can be imported anywhere without re-reading files each time.

### Creating a Configuration Singleton

Create a `config.ts` file in your project:

```typescript
// config.ts
import { Envict } from '@serverless-advocate/envict';

const schema = {
  // Application environment
  nodeEnv: {
    description: 'Node.js environment',
    format: 'string',
    env: 'NODE_ENV',
    default: 'development',
  },

  // AWS configuration
  awsAccountId: {
    description: 'AWS Account ID',
    format: 'string',
    env: 'AWS_ACCOUNT_ID',
  },
  awsRegion: {
    description: 'AWS Region',
    format: 'string',
    env: 'AWS_REGION',
    default: 'us-east-1',
  },

  // Application configuration
  appName: {
    description: 'Application name',
    format: 'string',
    env: 'APP_NAME',
    default: 'my-app',
  },
  port: {
    description: 'Server port',
    format: 'number',
    env: 'PORT',
    default: 3000,
  },

  // Feature flags
  enableMetrics: {
    description: 'Enable application metrics',
    format: 'boolean',
    env: 'ENABLE_METRICS',
    default: true,
  },

  // Logging configuration
  logLevel: {
    description: 'Application log level',
    format: /^(DEBUG|INFO|WARN|ERROR)$/,
    env: 'LOG_LEVEL',
    default: 'INFO',
  },
};

// Create and export the singleton configuration instance
export const config = new Envict({ schema });

// Optional: Add validation to ensure all required config is present
// This will throw descriptive errors if any required environment variables are missing
try {
  // Access a few key properties to trigger validation
  config.get(['awsAccountId', 'awsRegion']);
} catch (error) {
  console.error('Configuration validation failed:', error);
  process.exit(1);
}
```

### Using the Singleton Configuration

Now you can import and use the configuration anywhere in your application:

```typescript
// services/aws-service.ts
import { config } from './config';

export class AWSService {
  private accountId: string;
  private region: string;

  constructor() {
    // Access configuration values directly
    this.accountId = config.get('awsAccountId');
    this.region = config.get('awsRegion');
  }

  getResourceArn(service: string, resourceType: string, resourceName: string) {
    // Use the configuration values to build ARNs
    return `arn:aws:${service}:${this.region}:${this.accountId}:${resourceType}/${resourceName}`;
  }
}
```

```typescript
// handlers/api.ts
import { config } from './config';

export const handler = async (event: any) => {
  const nodeEnv = config.get('nodeEnv');
  const region = config.get('awsRegion');

  console.log(`Processing request in ${nodeEnv} environment, ${region} region`);

  // Get multiple values at once
  const { appName, port, enableMetrics } = config.get([
    'appName',
    'port',
    'enableMetrics',
  ]);

  if (enableMetrics) {
    console.log(`Metrics enabled for ${appName} on port ${port}`);
  }

  // Your handler logic here
};
```

```typescript
// utils/logger.ts
import { config } from './config';

export class Logger {
  private logLevel: string;
  private appName: string;

  constructor() {
    this.logLevel = config.get('logLevel');
    this.appName = config.get('appName');
  }

  log(level: string, message: string) {
    const accountId = config.get('awsAccountId');
    const region = config.get('awsRegion');

    console.log(
      `[${level}] ${this.appName} (${accountId}/${region}): ${message}`
    );
  }
}
```

### Benefits of the Singleton Pattern

1. **Single Source of Truth**: Configuration is loaded once and cached
2. **Performance**: No file I/O on subsequent imports
3. **Type Safety**: Full TypeScript support with autocomplete
4. **Validation**: Configuration is validated once at startup
5. **Easy Testing**: Can be easily mocked in unit tests
6. **Clean Imports**: Simple import statement throughout your codebase

### Testing with Singleton Configuration

For testing, you can create a separate test configuration or mock the config module:

```typescript
// config.test.ts
import { Envict } from '@serverless-advocate/envict';

// Create a test configuration with test-specific values
export const testConfig = new Envict({
  schema: {
    awsAccountId: {
      format: 'string',
      default: '123456789012',
    },
    awsRegion: {
      format: 'string',
      default: 'us-east-1',
    },
    nodeEnv: {
      format: 'string',
      default: 'test',
    },
  },
});
```

```typescript
// In your test files
jest.mock('./config', () => ({
  config: {
    get: jest.fn((key: string) => {
      const mockValues = {
        awsAccountId: '123456789012',
        awsRegion: 'us-east-1',
        nodeEnv: 'test',
        appName: 'test-app',
        port: 3000,
        enableMetrics: false,
        logLevel: 'DEBUG',
      };
      return mockValues[key];
    }),
  },
}));
```

## API Reference

### Constructor

```typescript
new Envict<T>(options?: EnvictOptions)
```

### Methods

#### `get<K>(key: K): T[K]`

Get a single configuration value by key. Supports dot notation for nested access.

```typescript
const logLevel = envict.get('shared').logging.logLevel;
const account = envict.get('env').account;
```

#### `get<K>(keys: K[]): Pick<T, K>`

Get multiple configuration values as an object.

```typescript
const config = envict.get(['shared', 'env']);
// Returns: { shared: {...}, env: {...} }
```

#### `tryGet(primaryKey: string, fallbackKey: string): unknown`

Try to get a configuration value from a primary key, falling back to another key if the first doesn't exist or fails validation.

- **Fallback Logic**: If primary key fails, automatically tries fallback key
- **Error Handling**: Only throws if both keys fail
- **Use Cases**: Perfect for dynamic configurations with default templates

```typescript
// Try to get stage-specific config, fall back to ephemeral template
const stageConfig = envict.tryGet(`stages.${stage}`, 'stages.ephemeral');

// Try primary database, fall back to default
const dbConfig = envict.tryGet('database.primary', 'database.default');
```

#### `load(filePath: string): this`

Load additional configuration from a JSON file at runtime. Returns the Envict instance for method chaining.

- **Merging**: New file data overwrites existing values for matching keys
- **Precedence**: Environment variables maintain highest precedence
- **Validation**: All loaded data is validated against the schema
- **Chaining**: Supports fluent API with method chaining

```typescript
envict.load('./runtime-config.json');

// Method chaining
envict.load('./base.json').load('./overrides.json');
```

#### `asyncLoad(...loaders: AsyncLoader[]): Promise<this>`

Load configuration from one or more async loaders at runtime. Returns a Promise that resolves to the Envict instance.

- **Async Sources**: Load from APIs, databases, cloud services, etc.
- **Fail-fast**: Stops on first loader error
- **Precedence**: Environment variables maintain highest precedence
- **Validation**: All loaded data is validated against the schema
- **Multiple Loaders**: Can load from multiple sources in one call

```typescript
// Single loader
await envict.asyncLoad(new ApiLoader('https://api.example.com/config'));

// Multiple loaders
await envict.asyncLoad(
  new ApiLoader('https://api.example.com/config'),
  new ParameterStoreLoader(ssm, '/myapp/')
);

// Chaining (each call must be awaited)
await(await envict.asyncLoad(apiLoader)).asyncLoad(paramLoader);
```

#### `asyncWrite(options: AsyncWriteOptions): Promise<void>`

Write current configuration to a file asynchronously. Perfect for CI/CD pipelines and build-time configuration generation.

- **Multiple Formats**: Supports JSON and ENV file formats
- **Directory Creation**: Automatically creates target directories if they don't exist
- **Type Safety**: Full TypeScript support with AsyncWriteOptions interface
- **Error Handling**: Comprehensive error handling with descriptive messages

```typescript
// Write as JSON file (perfect for CDK)
await envict.asyncWrite({
  path: './output',
  fileName: 'config.json',
  format: 'json',
});

// Write as ENV file (perfect for containers)
await envict.asyncWrite({
  path: './docker',
  fileName: '.env.production',
  format: 'env',
});

// Format defaults to 'json' if not specified
await envict.asyncWrite({
  path: './build',
  fileName: 'app-config.json',
});
```

**AsyncWriteOptions Interface:**

```typescript
interface AsyncWriteOptions {
  path: string; // Directory path where file should be written
  fileName: string; // Name of the file to write
  format?: 'json' | 'env'; // Output format (defaults to 'json')
  select?: string; // Optional path to select specific config portion
  fallback?: string; // Optional fallback path if select doesn't exist
}
```

**Selective Writing Examples:**

```typescript
// Write entire configuration
await envict.asyncWrite({
  path: './output',
  fileName: 'full-config.json',
});

// Write only database configuration
await envict.asyncWrite({
  path: './output',
  fileName: 'db-config.json',
  select: 'database',
});

// Write stage config with fallback
await envict.asyncWrite({
  path: './output',
  fileName: 'stage-config.json',
  select: 'stages.prod',
  fallback: 'stages.develop',
});
```

## Schema Definition

Schemas define the structure and validation rules for your configuration. Envict supports both TypeScript and plain JavaScript/JSON schemas.

### TypeScript Schema

```typescript
const schema = {
  port: {
    description: 'Server port',
    format: 'number',
    env: 'PORT',
    default: 3000,
  },
  debug: {
    description: 'Enable debug mode',
    format: 'boolean',
    env: 'DEBUG',
    default: false,
  },
  logLevel: {
    description: 'Application log level',
    format: /^(DEBUG|INFO|WARN|ERROR)$/, // Regex validation
    env: 'LOG_LEVEL',
    default: 'INFO',
  },
};
```

### Plain JavaScript Schema

```javascript
const { Envict } = require('@serverless-advocate/envict');

const schema = {
  port: {
    description: 'Server port',
    format: 'number', // Plain string - no TypeScript needed!
    env: 'PORT',
    default: 3000,
  },
  debug: {
    description: 'Enable debug mode',
    format: 'boolean',
    env: 'DEBUG',
    default: false,
  },
};

const config = new Envict({ schema });
```

### JSON Schema Files

You can also define schemas in JSON files and load them:

```json
{
  "port": {
    "description": "Server port",
    "format": "number",
    "env": "PORT",
    "default": 3000
  },
  "debug": {
    "description": "Enable debug mode",
    "format": "boolean",
    "env": "DEBUG",
    "default": false
  }
}
```

```javascript
const schema = require('./config-schema.json');
const config = new Envict({ schema });
```

### Schema Property Interface

```typescript
interface SchemaProperty {
  description?: string;
  format: string | RegExp; // 'string', 'number', 'boolean', 'json', or RegExp
  env?: string;
  default?: any;
}
```

**Supported Format Types:**

- `'string'` - String values
- `'number'` - Numeric values (integers and floats)
- `'boolean'` - Boolean values (supports various string representations)
- `'json'` - JSON strings that will be parsed into objects/arrays
- `RegExp` - Custom regex validation patterns

## Examples

Envict comes with comprehensive examples demonstrating various features and usage patterns. Each example is self-contained with TypeScript code, JSON configuration files, and detailed documentation.

| Example                                                  | Command                               | Features Demonstrated                                                                                                                | Description                                                                  |
| -------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| **[Basic Example](examples/basic-example/)**             | `npm run example:basic`               | • Simple typed schema<br>• Environment variable mapping<br>• Default value fallbacks<br>• Type-safe access                           | Perfect starting point showing core Envict concepts with a 3-property schema |
| **[Detailed Example](examples/detailed-example/)**       | `npm run example:detailed`            | • Advanced TypeScript interfaces<br>• Multiple value retrieval<br>• Regex format validation<br>• Environment-specific behavior       | Advanced usage with AWS-style configuration and comprehensive typing         |
| **[Load Config](examples/load-config/)**                 | `npm run example:load-config`         | • JSON file loading<br>• Nested configuration objects<br>• Environment variable overrides<br>• Type conversion from JSON             | Demonstrates loading configuration from static JSON files                    |
| **[Chained Load](examples/chained-load/)**               | `npm run example:chained-load`        | • Multiple file loading with `load()`<br>• Configuration merging<br>• Partial overrides<br>• Step-by-step evolution                  | Shows how to chain multiple configuration files for layered setup            |
| **[Layered Config](examples/layered-config/)**           | `npm run example:layered-config`      | • Multi-layer configuration<br>• Method chaining<br>• Team-based development<br>• Comprehensive layer analysis                       | Advanced multi-layer configuration for team environments                     |
| **[Constructor Load](examples/constructor-load/)**       | `npm run example:constructor-load`    | • Constructor-based file loading<br>• Single-step initialization<br>• Security-conscious display<br>• Clear precedence explanation   | Simplest approach to loading configuration files                             |
| **[Stage Fallback](examples/stage-fallback/)**           | `npm run example:stage-fallback`      | • Dynamic stage configuration<br>• Fallback mechanisms with `tryGet()`<br>• Environment-specific configs<br>• Ephemeral templates    | Demonstrates stage-based configuration with fallback support                 |
| **[Async Loading](examples/async-loading/)**             | `npm run example:async-loading`       | • API-based configuration loading<br>• Custom async loaders<br>• Multiple source integration<br>• Real-time config fetching          | Load configuration from APIs and external async sources                      |
| **[Async Write](examples/async-write/)**                 | `npm run example:async-write`         | • Async configuration loading<br>• File writing (JSON & ENV)<br>• CDK-ready output<br>• CI/CD pipeline integration                   | Load from APIs and write to files for synchronous consumption                |
| **[Async Partial Write](examples/async-partial-write/)** | `npm run example:async-partial-write` | • Selective config writing with `select`<br>• Fallback mechanisms<br>• Environment overrides<br>• Multiple output formats            | Write specific portions of configuration with fallback support               |
| **[Get All Config](examples/get-all-config/)**           | `npm run example:get-all-config`      | • Complete configuration retrieval<br>• Type-safe access to nested values<br>• Backward compatibility<br>• Single-call config access | Retrieve all configuration values at once while maintaining type safety      |

### Running Examples

```bash
# Run individual examples
npm run example:basic
npm run example:detailed
npm run example:load-config
npm run example:chained-load
npm run example:layered-config
npm run example:constructor-load
npm run example:stage-fallback
npm run example:async-loading
npm run example:async-write
npm run example:async-partial-write
npm run example:get-all-config

# Run with custom environment variables
PORT=8080 DEBUG=true npm run example:basic
NODE_ENV=production AWS_REGION=eu-west-1 npm run example:detailed
```

### Example Learning Path

For the best learning experience, we recommend this order:

1. **basic-example** → Core concepts and environment variables
2. **constructor-load** → Simple file loading approach
3. **load-config** → JSON files and nested objects
4. **get-all-config** → Retrieve complete configuration with type safety
5. **detailed-example** → Advanced TypeScript integration
6. **chained-load** → Configuration merging and overrides
7. **layered-config** → Complex multi-layer configurations
8. **stage-fallback** → Dynamic configuration with fallback mechanisms
9. **async-loading** → Loading configuration from async sources
10. **async-write** → Writing configuration to files for sync consumption
11. **async-partial-write** → Selective config writing with select and fallback

Each example includes detailed console output showing configuration loading, type conversion, precedence rules, and environment variable overrides.

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Build the package
npm run build

# Lint and format
npm run lint
npm run format
```

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.
