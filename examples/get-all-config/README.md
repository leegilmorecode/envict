# Get All Configuration Example

**Command:** `npm run example:get-all-config`

This example demonstrates how to use the `get()` method without parameters to retrieve all configuration values at once, while maintaining full type safety and nested object structure.

## Features

- **Complete Configuration Retrieval** - Get all configuration values in a single call
- **Type Safety** - Maintain TypeScript type safety for the returned configuration object
- **Nested Structure** - Automatic conversion of dot-notation keys to nested objects
- **Environment Variable Integration** - Shows how environment variables are included in the complete configuration
- **Backward Compatibility** - Individual and multiple value access still work as expected

## Use Cases

Perfect for scenarios where you need the complete configuration:

- **Module initialization** - Pass complete config to other modules or services
- **Configuration validation** - Validate the entire configuration structure at once
- **Debugging and logging** - Display complete configuration for troubleshooting
- **Configuration serialization** - Export complete config for storage or transmission
- **Microservice communication** - Share configuration between services

## Key Benefits

1. **Simplified Access** - Get everything at once instead of multiple individual calls
2. **Type Safety** - Full TypeScript support with proper type inference
3. **Nested Structure** - Automatic conversion from flat dot-notation to nested objects
4. **Complete Integration** - Includes values from defaults, files, and environment variables
5. **Flexible Usage** - Choose between getting all config, individual values, or multiple values as needed

## Running the Example

```bash
# Run the example
npm run example:get-all-config
```

## Expected Output

The example will show:

1. **Phase 1**: Complete configuration retrieval with JSON output
2. **Phase 2**: Type-safe access to nested values with examples
3. **Phase 3**: Individual value access demonstration
4. **Phase 4**: Multiple value access demonstration

Sample output:

```
🚀 Get All Configuration Example
==================================================

📋 Phase 1: Retrieve Complete Configuration
----------------------------------------
✅ Complete configuration retrieved:
{
  "port": 8080,
  "host": "production.example.com",
  "database": {
    "url": "mongodb://prod-db:27017",
    "name": "myapp",
    "maxConnections": 10
  },
  "features": {
    "enableLogging": true,
    "enableMetrics": true
  }
}

📋 Phase 2: Type-Safe Access to Nested Values
----------------------------------------
🎯 Type-safe access examples:
  🌐 Server: production.example.com:8080
  🗄️  Database: mongodb://prod-db:27017/myapp
  🔗 Max connections: 10
  📝 Logging enabled: true
  📊 Metrics enabled: true

📋 Phase 3: Individual Value Access Still Works
----------------------------------------
🔍 Individual value access:
  Port: 8080 (type: number)
  Database config:
    {
    "url": "mongodb://prod-db:27017",
    "name": "myapp",
    "maxConnections": 10
}

📋 Phase 4: Multiple Value Access
----------------------------------------
🎯 Multiple value access (server config):
  {
  "port": 8080,
  "host": "production.example.com"
}

✨ Key Benefits:
  • 🎯 Get all configuration with a single call: config.get()
  • 🔒 Full TypeScript type safety maintained
  • 🏗️  Nested object structure preserved from dot notation
  • 🔄 Individual and multiple value access still available
  • 📦 Perfect for passing complete config to other modules

🎉 All configuration successfully retrieved and accessed!
```
