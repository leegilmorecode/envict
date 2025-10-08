# Async Write Example

**Command:** `npm run example:async-write`

This example demonstrates using `asyncLoad()` to fetch configuration from multiple sources and then `asyncWrite()` to save it to files for use in synchronous environments like CDK.

## Features

- **Async loading from APIs** - Fetch configuration from multiple endpoints
- **File system writing** - Save configuration to JSON and ENV files
- **CDK-ready output** - Generate files that CDK can read synchronously
- **Multiple format support** - JSON for structured data, ENV for environment variables

## Use Cases

Perfect for scenarios where you need sync file access:

- **CDK deployments** - Pre-populate config files before CDK synthesis
- **Build-time configuration** - Fetch config during CI/CD pipelines
- **Docker image preparation** - Bake configuration into container images
- **Static site generation** - Pre-fetch configuration for static builds

## Key Benefits

1. **Async to sync bridge** - Load from async sources, consume synchronously
2. **Multiple output formats** - JSON for apps, ENV for containers
3. **CDK compatibility** - Perfect for AWS CDK deployment workflows
4. **CI/CD integration** - Ideal for build-time configuration fetching

## Running the Example

```bash
# Run the example (uses mock API responses)
npm run example:async-write
```

## Expected Output

The example will show:

1. **Loading Phase**: Fetching configuration from multiple API sources
2. **Writing Phase**: Saving configuration to both JSON and ENV files
3. **Verification Phase**: Reading the files back to verify contents
4. **File Contents**: Display of the generated JSON and ENV files

Generated files:

- `./output/cdk-config.json` - JSON format for CDK consumption
- `./output/.env.example` - ENV format for container deployment
