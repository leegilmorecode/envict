# Async Loading Example

**Command:** `npm run example:async-loading`

This example demonstrates the `asyncLoad()` method for loading configuration from two API sources and shows how they merge together.

## Features

- **Chained API loading** - Load from multiple API endpoints sequentially
- **Configuration merging** - Shows how later calls override earlier values
- **Type-safe configuration access** - Full TypeScript support
- **Simple demonstration** - Clear, focused example

## Use Cases

Perfect for understanding async configuration loading:

- **Base + override pattern** - Load base config, then environment-specific overrides
- **Microservice config** - Load from multiple configuration services
- **Feature flags** - Load base config, then feature flag overrides

## Key Benefits

1. **Sequential loading** - Each call builds on the previous
2. **Merge behavior** - Later values override earlier ones
3. **Same precedence rules** - Environment variables still take highest precedence
4. **Type safety** - All data validated against schema

## Running the Example

```bash
# Run the example (uses mock API responses)
npm run example:async-loading
```

## Expected Output

The example will show:

1. **Initial Config**: Starting with schema defaults
2. **Base API Load**: Loading base configuration from first API
3. **Flags API Load**: Loading feature flags from second API
4. **Final Result**: The merged configuration showing which values came from where

Each step clearly shows how the configuration evolves as new data is loaded.
