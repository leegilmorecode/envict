# Envict Examples

This directory contains comprehensive examples demonstrating various Envict features and usage patterns. Each example is self-contained with its own TypeScript files, JSON configuration files, and documentation.

## Available Examples

### 1. Basic Example (`basic-example/`)

**Command:** `npm run example:basic`

Demonstrates basic Envict usage with a simple typed schema that reads from environment variables.

**Features:**

- Simple schema with 3 properties
- Environment variable mapping
- Type-safe configuration access
- Default value fallbacks

### 2. Detailed Example (`detailed-example/`)

**Command:** `npm run example:detailed`

Shows advanced usage with comprehensive TypeScript interfaces and environment-specific behavior.

**Features:**

- Complex TypeScript interfaces
- Multiple value retrieval
- Regex format validation
- Environment-specific logic

### 3. Load Config (`load-config/`)

**Command:** `npm run example:load-config`

Demonstrates loading configuration from JSON files with environment variable overrides.

**Features:**

- JSON file loading
- Nested configuration objects
- Environment variable overrides
- Type conversion from JSON

### 4. Chained Load (`chained-load/`)

**Command:** `npm run example:chained-load`

Shows chaining multiple configuration file loads for layered configuration.

**Features:**

- Multiple file loading with `load()` method
- Configuration merging
- Partial overrides
- Step-by-step evolution display

### 5. Layered Config (`layered-config/`)

**Command:** `npm run example:layered-config`

Demonstrates multi-layer configuration with method chaining for team-based development.

**Features:**

- Multi-layer configuration
- Team-based configuration management
- Local development overrides
- Comprehensive layer analysis

### 6. Constructor Load (`constructor-load/`)

**Command:** `npm run example:constructor-load`

Shows the straightforward approach of loading configuration files in the constructor.

**Features:**

- Constructor-based file loading
- Single-step initialization
- Security-conscious display
- Clear precedence explanation

### 7. Stage Fallback (`stage-fallback/`)

**Command:** `npm run example:stage-fallback`

Demonstrates using `tryGet()` for dynamic stage-based configuration with ephemeral fallbacks.

**Features:**

- Dynamic stage configuration with `tryGet()` method
- Ephemeral fallback template for unknown stages
- Real-world serverless deployment pattern
- Environment variable overrides for stage-specific values
- Type-safe configuration access across all stages

### 8. Async Loading (`async-loading/`)

**Command:** `npm run example:async-loading`

Demonstrates using `asyncLoad()` for loading configuration from two API sources and shows how they merge.

**Features:**

- Chained API loading from multiple endpoints
- Configuration merging and override behavior
- Type-safe async configuration loading
- Simple, focused demonstration of core functionality
- Single-step initialization
- Security-conscious display
- Clear precedence explanation

## Running Examples

### Individual Examples

```bash
# Run a specific example
npm run example:basic
npm run example:detailed
npm run example:load-config
npm run example:chained-load
npm run example:layered-config
npm run example:constructor-load
npm run example:stage-fallback
npm run example:async-loading
```

### All Examples

```bash
# Run all examples in sequence
npm run examples
```

### With Environment Variables

```bash
# Run examples with custom environment variables
PORT=8080 DEBUG=true APP_NAME="custom-app" npm run example:basic
NODE_ENV=production AWS_REGION=eu-west-1 npm run example:detailed
```

## Example Structure

Each example follows a consistent structure:

```
example-name/
├── README.md           # Example-specific documentation
├── index.ts           # Main TypeScript example code
├── *.json             # Static configuration files (if applicable)
└── ...                # Additional files as needed
```

## Prerequisites

Before running the examples, ensure you have:

1. **Dependencies installed:**

   ```bash
   npm install
   ```

2. **Project built:**
   ```bash
   npm run build
   ```

The npm scripts will automatically build the project and compile the examples before running them. Examples import from the built `dist/` folder to ensure they use the compiled Envict package.

## Learning Path

For the best learning experience, we recommend running the examples in this order:

1. **basic-example** - Start here to understand core concepts
2. **constructor-load** - Learn the simplest file loading approach
3. **load-config** - Understand JSON file loading and nested objects
4. **detailed-example** - Explore advanced TypeScript integration
5. **chained-load** - Learn configuration merging and overrides
6. **layered-config** - Master complex multi-layer configurations

## Common Patterns

### Environment Variable Overrides

All examples support environment variable overrides. The general pattern is:

```bash
ENV_VAR_NAME=value npm run example:name
```

### Configuration Precedence

All examples follow the same precedence order:

1. **Environment Variables** (highest priority)
2. **Runtime Loaded Files** (via `load()` method)
3. **Constructor Files** (via `file` option)
4. **Schema Defaults** (lowest priority)

### Type Safety

All examples demonstrate TypeScript integration with:

- Interface definitions for configuration structure
- Type-safe property access
- Compile-time validation

## Troubleshooting

If you encounter issues running the examples:

1. **Build the project first:**

   ```bash
   npm run build
   ```

2. **Check Node.js version:**

   ```bash
   node --version  # Should be >= 18.13.0
   ```

3. **Install dependencies:**

   ```bash
   npm install
   ```

4. **Run individual examples to isolate issues:**
   ```bash
   npm run example:basic
   ```

## Contributing

When adding new examples:

1. Create a new directory under `examples/`
2. Include a `README.md` with clear documentation
3. Keep schemas to 5 properties maximum
4. Add appropriate npm script to `package.json`
5. Update this main README with the new example
6. Ensure all files are static (no generated files)
7. Use TypeScript for all example code
8. Include console.log statements to demonstrate functionality
