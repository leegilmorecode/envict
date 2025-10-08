# Stage Fallback Example

**Command:** `npm run example:stage-fallback`

This example demonstrates the `tryGet()` method for dynamic stage-based configuration with ephemeral fallbacks. Simple and clear demonstration of the core functionality.

## Features

- **Simple two-stage setup** - Just `prod` and `ephemeral` configurations
- **Clear tryGet() demonstration** - Shows primary and fallback behavior
- **Type-safe configuration access** - Full TypeScript support
- **Clear fallback demonstration** - Shows primary and fallback behavior

## Configuration Structure

```
stages/
├── prod/           # Production configuration (known stage)
└── ephemeral/      # Template for unknown stages (fallback)
```

## Use Case

Perfect for understanding how `tryGet()` works:

- **Known stages** return their specific configuration
- **Unknown stages** fall back to the ephemeral template
- **Automatic fallback** for unknown stages

## Key Benefits

1. **Simple API** - Just two string parameters
2. **Automatic fallback** - No manual error handling needed
3. **Type safety** - Works with existing Envict type system
4. **Clear behavior** - Easy to understand and debug

## Running the Example

```bash
# Run the example
npm run example:stage-fallback
```

## Expected Output

The example will show:

1. **Example 1**: `tryGet('stages.prod', 'stages.ephemeral')` → Returns prod config
2. **Example 2**: `tryGet('stages.pr-123', 'stages.ephemeral')` → Returns ephemeral config

Each example clearly shows:

- The method call being made
- Whether it used primary or fallback
- The actual configuration values returned
