# Basic Example

This example demonstrates the basic usage of Envict with a simple typed schema that reads from environment variables.

## Features Demonstrated

- Basic schema definition with 3 properties
- Type-safe configuration access
- Environment variable mapping
- Default value fallbacks
- TypeScript interface integration

## Running the Example

```bash
npm run example:basic
```

## With Custom Environment Variables

```bash
PORT=8080 DEBUG=true APP_NAME="custom-app" npm run example:basic
```

## Expected Output

The example will show:

- Current configuration values
- Their JavaScript types (number, boolean, string)
- Which environment variables are being used
- Fallback to defaults when environment variables are not set
