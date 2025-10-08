# Layered Config Example

This example demonstrates multi-layer configuration loading where multiple JSON files are chained together to build comprehensive configuration from different sources.

## Features Demonstrated

- Multi-layer configuration with method chaining
- Configuration inheritance and overrides
- Team-based configuration management
- Local development overrides
- Comprehensive configuration analysis

## Files

- `defaults.json` - Base default configuration
- `team-config.json` - Team-specific configuration overrides
- `local-overrides.json` - Local development overrides
- `index.ts` - Main example code with detailed layer analysis

## Running the Example

```bash
npm run example:layered-config
```

## With Environment Variable Overrides

```bash
DB_HOST=production.db CACHE_ENABLED=true API_TIMEOUT=15000 npm run example:layered-config
```

## Expected Output

The example will show:

- Final merged configuration values
- Detailed analysis of each configuration layer
- Which values came from which layer
- Environment variable override status
- Complete configuration precedence chain

## Configuration Layers (in order of precedence)

1. **Schema Defaults** (lowest)
2. **defaults.json** - Base configuration
3. **team-config.json** - Team-specific settings
4. **local-overrides.json** - Local development settings
5. **Environment Variables** (highest precedence)

## Use Cases

This pattern is ideal for:

- Team-based development environments
- Multi-stage deployment configurations
- Local development customization
- Gradual configuration rollouts
