# Detailed Example

This example demonstrates advanced Envict usage with comprehensive TypeScript interfaces and environment-specific behavior.

## Features Demonstrated

- Comprehensive TypeScript interfaces
- Multiple value retrieval with `get([])`
- Regex format validation for log levels
- Environment-specific configuration logic
- AWS-style configuration patterns

## Running the Example

```bash
npm run example:detailed
```

## With Production Environment

```bash
NODE_ENV=production AWS_ACCOUNT_ID=987654321098 AWS_REGION=eu-west-1 LOG_LEVEL=ERROR npm run example:detailed
```

## With Development Environment

```bash
NODE_ENV=development APP_NAME="dev-app" LOG_LEVEL=DEBUG npm run example:detailed
```

## Expected Output

The example will show:

- Current configuration values for all properties
- Environment-specific behavior based on NODE_ENV
- AWS configuration details
- Log level validation with regex patterns
- Environment variable status
