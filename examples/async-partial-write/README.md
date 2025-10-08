# Async Partial Write Example

**Command:** `npm run example:async-partial-write`

This example demonstrates selective configuration writing using the `select` and `fallback` options in `asyncWrite()`. Perfect for writing specific portions of your configuration to different files.

## Features

- **Selective Writing** - Write only specific portions of configuration using `select`
- **Fallback Support** - Automatic fallback when selected path doesn't exist
- **Multiple Formats** - JSON for structured data, ENV for environment variables
- **Environment Overrides** - Show how environment variables override defaults

## Use Cases

Perfect for scenarios where you need different config portions:

- **Environment-specific configs** - Write staging, prod, dev configs separately
- **Service-specific files** - Generate configs for individual microservices
- **Container deployment** - Create .env files for Docker containers
- **Fallback configurations** - Handle unknown environments gracefully

## Key Benefits

1. **Targeted output** - Write only what you need, not entire config
2. **Fallback safety** - Never fail due to missing configuration paths
3. **Format flexibility** - JSON for apps, ENV for containers
4. **Environment awareness** - Override defaults with environment variables

## Running the Example

```bash
# Run with default environment (staging)
npm run example:async-partial-write

# Override target environment
TARGET_ENV=production npm run example:async-partial-write

# Override database settings
PROD_DB_HOST=custom-db.com METRICS_ENABLED=true npm run example:async-partial-write
```

## Expected Output

The example will show:

1. **Selective Writing**: Writing staging environment config as JSON
2. **Fallback Writing**: Trying nonexistent environment, falling back to development
3. **File Verification**: Display contents of generated JSON and ENV files
4. **Environment Overrides**: Show which environment variables are active

Generated files:

- `./output/staging-config.json` - Selected environment configuration
- `./output/.env.services` - Environment variables (with fallback applied)
