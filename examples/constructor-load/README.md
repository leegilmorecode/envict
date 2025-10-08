# Constructor Load Example

This example demonstrates the most straightforward approach to loading configuration files by specifying the file path directly in the Envict constructor.

## Features Demonstrated

- Constructor-based file loading
- Single-step configuration initialization

## Files

- `app-config.json` - Application configuration file
- `index.ts` - Main example code

## Running the Example

```bash
npm run example:constructor-load
```

## Expected Output

The example will show:

- Successfully loaded configuration from JSON file
- All configuration values with proper types
- Security-conscious display (JWT secret truncated)
- Configuration source priority explanation

## When to Use Constructor Loading

This approach is ideal when:

- You have a single, primary configuration file
- Configuration structure is relatively stable
- You want simple, straightforward initialization
- You don't need complex configuration layering
