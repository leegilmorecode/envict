# Load Config Example

This example demonstrates loading configuration from a JSON file with environment variable overrides.

## Features Demonstrated

- Loading configuration from JSON files
- Nested configuration objects
- Environment variable overrides of JSON values
- Type conversion from JSON values
- File-based configuration management

## Files

- `config.json` - Static configuration file with default values
- `index.ts` - Main example code

## Running the Example

```bash
npm run example:load-config
```

## With Environment Variable Overrides

```bash
SERVER_PORT=8080 DATABASE_URL="postgresql://prod:5432/app" ENABLE_METRICS=false npm run example:load-config
```

## Expected Output

The example will show:

- Configuration loaded from the JSON file
- Proper type conversion (numbers, booleans, strings)
- Nested object access
- Environment variable override status
- Precedence: Environment Variables > JSON File > Schema Defaults
