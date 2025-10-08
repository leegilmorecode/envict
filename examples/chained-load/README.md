# Chained Load Example

This example demonstrates chaining multiple configuration file loads to create layered configuration with base settings and environment-specific overrides.

## Features Demonstrated

- Chained configuration file loading with `load()` method
- Configuration merging and precedence
- Partial configuration overrides
- Method chaining support
- Step-by-step configuration evolution

## Files

- `base-config.json` - Base configuration with default values
- `prod-override.json` - Production-specific overrides (partial configuration)
- `index.ts` - Main example code showing the chaining process

## Running the Example

```bash
npm run example:chained-load
```

## With Additional Environment Overrides

```bash
APP_NAME="production-app" SERVER_PORT=9000 npm run example:chained-load
```

## Expected Output

The example will show:

- Step-by-step configuration loading process
- Before and after values for each configuration load
- Which values were overridden and which remained unchanged
- Clear indication of the configuration precedence order
- Summary of the merge process

## Configuration Precedence

1. **Schema Defaults** (lowest precedence)
2. **Base Config File** (`base-config.json`)
3. **Override Config File** (`prod-override.json`)
4. **Environment Variables** (highest precedence)
