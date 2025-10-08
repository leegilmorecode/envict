# Contributing to Envict

Thank you for your interest in contributing to Envict! We welcome contributions from the community and are excited to see what you'll bring to the project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. We are committed to providing a welcoming and inclusive environment for all contributors.

### Our Standards

- **Be respectful**: Treat all community members with respect and kindness
- **Be inclusive**: Welcome newcomers and help them get started
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together to improve the project
- **Be patient**: Remember that everyone has different experience levels

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Personal attacks or trolling
- Publishing private information without permission
- Any conduct that would be inappropriate in a professional setting

## Getting Started

### Prerequisites

- Node.js 18.13.0 or higher
- npm or yarn package manager
- Git for version control

### Development Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:

   ```bash
   git clone https://github.com/YOUR_USERNAME/envict.git
   cd envict
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Create a feature branch**:

   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make your changes** and test them:

   ```bash
   npm test
   npm run lint
   npm run typecheck
   ```

6. **Commit your changes**:

   ```bash
   git commit -m "feat: add your feature description"
   ```

7. **Push to your fork**:

   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create a Pull Request** on GitHub

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Code Quality

We use several tools to maintain code quality:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format

# Type checking
npm run typecheck

# Run all quality checks
npm run ci
```

### Building

```bash
# Build for development
npm run build

# Build for production
npm run build:prod

# Clean build artifacts
npm run clean
```

## Contribution Types

### 🐛 Bug Reports

When reporting bugs, please include:

- **Clear description** of the issue
- **Steps to reproduce** the problem
- **Expected behavior** vs actual behavior
- **Environment details** (Node.js version, OS, etc.)
- **Code examples** or minimal reproduction case
- **Error messages** or stack traces

### ✨ Feature Requests

For new features, please provide:

- **Clear description** of the proposed feature
- **Use case** and motivation for the feature
- **Proposed API** or interface design
- **Examples** of how it would be used
- **Alternatives considered**

### 📚 Documentation

Documentation improvements are always welcome:

- Fix typos or unclear explanations
- Add missing documentation
- Improve examples
- Update outdated information
- Add new examples or tutorials

### 🧪 Tests

Help improve test coverage:

- Add tests for untested code paths
- Improve existing test quality
- Add integration tests
- Add performance tests
- Fix flaky tests

## Coding Standards

### TypeScript Guidelines

- **Use TypeScript** for all new code
- **Provide type annotations** for public APIs
- **Use strict mode** settings
- **Avoid `any` types** unless absolutely necessary
- **Use generics** for reusable components

### Code Style

We use Biome for code formatting and linting:

- **Follow existing patterns** in the codebase
- **Use meaningful variable names**
- **Keep functions small** and focused
- **Add JSDoc comments** for public APIs
- **Use consistent error handling**

### Example Code Style

```typescript
/**
 * Loads configuration from a JSON file
 * @param filePath - Path to the JSON configuration file
 * @returns Promise that resolves to the loaded configuration
 * @throws FileError when file cannot be read or parsed
 */
export async function loadConfigFile(
  filePath: string
): Promise<Record<string, unknown>> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    throw new FileError(`Failed to load config file: ${filePath}`, error);
  }
}
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(loader): add S3 configuration loader
fix(parser): handle circular references in JSON
docs(readme): update installation instructions
test(envict): add tests for async loading
```

## Pull Request Process

### Before Submitting

1. **Ensure all tests pass**: `npm run ci`
2. **Update documentation** if needed
3. **Add tests** for new functionality
4. **Update CHANGELOG.md** if applicable
5. **Rebase on latest main** branch

### PR Requirements

- **Clear title** following conventional commit format
- **Detailed description** of changes
- **Link to related issues** if applicable
- **Screenshots** for UI changes (if any)
- **Breaking changes** clearly documented

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Address feedback** and update PR
4. **Final approval** and merge

## Project Structure

```
envict/
├── src/                    # Source code
│   ├── envict.ts          # Main Envict class
│   ├── types.ts           # Type definitions
│   ├── schema-parser.ts   # Schema parsing logic
│   ├── type-converter.ts  # Type conversion utilities
│   └── data-loaders.ts    # Configuration loaders
├── tests/                 # Test files
├── examples/              # Usage examples
├── docs/                  # Documentation
└── dist/                  # Built output
```

## Release Process

Releases are handled by maintainers:

1. **Version bump** using semantic versioning
2. **Update CHANGELOG.md** with release notes
3. **Create GitHub release** with release notes
4. **Publish to npm** registry

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and general discussion
- **Documentation**: Check the README and examples first
- **Code Review**: Ask questions in PR comments

## Recognition

Contributors are recognized in:

- **CHANGELOG.md** for significant contributions
- **README.md** contributors section
- **GitHub releases** acknowledgments

## License

By contributing to Envict, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Envict! Your efforts help make configuration management better for everyone. 🚀
