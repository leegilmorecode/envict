# Publishing to npm

This guide will help community admins publish the `@serverless-advocate/envict` package to npm.

## Prerequisites

1. All tests passing

## Build the Package

1. First, build the TypeScript files:

```bash
npm run build
```

This will compile the TypeScript files into JavaScript in the `dist` directory.

## Versioning

1. Create a release which will automatically update the change log and update the package version number:

```bash
npm run release
```

2. This command will:

- Update package.json
- Create a git tag
- Create a git commit
- Update the change log

## Publish to npm

1. Publish the package:

```bash
npm publish --access public # additional flag for scoped packages
```

## Troubleshooting

### Common Issues

1. **Version conflicts**:

   - If you try to publish a version that already exists
   - Solution: Use `npm run release` to update to a new version

2. **Permission errors**:

   - If you don't have permission to publish
   - Solution: Verify you're logged in with the correct npm account

3. **Package name conflicts**:
   - If the package name is already taken
   - Solution: Choose a different package name

### Checking Package Status

1. Verify package status:

```bash
npm view @serverless-advocate/envict
```

2. Check package versions:

```bash
npm view @serverless-advocate/envict versions
```

## Best Practices

1. Always run tests before publishing:

```bash
npm test
```

2. Consider using `npm pack` to ensure that the npm build only concerns the files expected

3. Consider using `npm publish --dry-run` to test the publish process before actually publishing
