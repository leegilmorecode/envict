/**
 * Tests for error edge cases and complex error scenarios
 *
 * This test suite covers error aggregation, circular references,
 * file system errors, and other edge cases that are not covered
 * in the main test files.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { FileLoader } from '../src/data-loaders';
import { Envict } from '../src/envict';
import { convertValue } from '../src/type-converter';
import { FileError, ParseError, ValidationError } from '../src/types';

describe('Error Edge Cases and Complex Error Scenarios', () => {
  const testDir = join(__dirname, 'temp-error-tests');

  beforeEach(() => {
    // Clean up and create test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    // Clean up test directory
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('Error Aggregation', () => {
    it('should aggregate multiple validation errors during initialization', () => {
      const schema = {
        port: {
          format: 'number',
          env: 'PORT',
          // No default, making it required
        },
        timeout: {
          format: 'number',
          env: 'TIMEOUT',
          // No default, making it required
        },
        logLevel: {
          format: /^(DEBUG|INFO|WARN|ERROR)$/,
          env: 'LOG_LEVEL',
          default: 'INVALID_DEFAULT', // This will cause a validation error
        },
      };

      expect(() => {
        new Envict({
          schema,
          env: {
            // Missing PORT and TIMEOUT, invalid LOG_LEVEL
            LOG_LEVEL: 'INVALID_LEVEL',
          },
        });
      }).toThrow(ValidationError);

      // Verify the error contains information about multiple failures
      try {
        new Envict({
          schema,
          env: {
            LOG_LEVEL: 'INVALID_LEVEL',
          },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('port');
        expect(validationError.message).toContain('timeout');
        expect(validationError.message).toContain('logLevel');
      }
    });

    it('should aggregate multiple errors during get() method with multiple keys', () => {
      const schema = {
        validKey: {
          format: 'string',
          default: 'valid',
        },
        invalidKey1: {
          format: 'number',
          env: 'INVALID_NUMBER',
          default: 123, // Provide default to avoid constructor error
        },
        invalidKey2: {
          format: 'boolean',
          env: 'INVALID_BOOLEAN',
          default: true, // Provide default to avoid constructor error
        },
      };

      // Create envict without the invalid env vars first
      const envict = new Envict({ schema });

      // Now load configuration with invalid values to trigger errors during get()
      expect(() => {
        envict.load(join(testDir, 'invalid-multi.json'));
      }).toThrow();

      // Create a file with invalid values
      const invalidConfigPath = join(testDir, 'invalid-multi.json');
      writeFileSync(
        invalidConfigPath,
        JSON.stringify({
          invalidKey1: 'not-a-number',
          invalidKey2: 'not-a-boolean',
        }),
      );

      // This should work since we're testing runtime loading errors
      expect(() => {
        envict.load(invalidConfigPath);
      }).toThrow(ValidationError);
    });

    it('should handle mixed error types in aggregation', () => {
      const schema = {
        parseError: {
          format: 'number',
          env: 'PARSE_ERROR_VAL',
        },
        validationError: {
          format: /^(VALID|PATTERN)$/,
          env: 'VALIDATION_ERROR_VAL',
        },
        missingRequired: {
          format: 'string',
          env: 'MISSING_REQUIRED',
          // No default, making it required
        },
      };

      expect(() => {
        new Envict({
          schema,
          env: {
            PARSE_ERROR_VAL: 'not-a-number',
            VALIDATION_ERROR_VAL: 'INVALID_PATTERN',
            // MISSING_REQUIRED is not provided
          },
        });
      }).toThrow(ValidationError);

      // Verify the error aggregates different error types
      try {
        new Envict({
          schema,
          env: {
            PARSE_ERROR_VAL: 'not-a-number',
            VALIDATION_ERROR_VAL: 'INVALID_PATTERN',
          },
        });
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('parseError');
        expect(validationError.message).toContain('validationError');
        expect(validationError.message).toContain('missingRequired');
      }
    });
  });

  describe('Circular Reference Handling', () => {
    it('should handle circular references in JSON.stringify during string conversion', () => {
      // Create a circular object
      const circularObj: { name: string; self?: unknown } = { name: 'test' };
      circularObj.self = circularObj;

      expect(() => {
        convertValue(circularObj, 'string', 'circularProperty');
      }).toThrow(ParseError);

      try {
        convertValue(circularObj, 'string', 'circularProperty');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.message).toContain('Circular reference detected');
        expect(parseError.message).toContain('at path: self');
        expect(parseError.property).toBe('circularProperty');
      }
    });

    it('should handle deeply nested circular references', () => {
      // Create a more complex circular structure
      const obj: {
        level1: {
          level2: {
            level3: { backToRoot?: unknown };
          };
        };
      } = {
        level1: {
          level2: {
            level3: {},
          },
        },
      };
      obj.level1.level2 = {
        level3: { backToRoot: obj },
      };

      expect(() => {
        convertValue(obj, 'string', 'deepCircularProperty');
      }).toThrow(ParseError);

      try {
        convertValue(obj, 'string', 'deepCircularProperty');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        const parseError = error as ParseError;
        expect(parseError.property).toBe('deepCircularProperty');
        expect(parseError.value).toBe(obj);
      }
    });

    it('should handle circular references in configuration objects', () => {
      // Create a circular object and try to use it as an environment value
      const circularObj: { test: string; circular?: unknown } = {
        test: 'value',
      };
      circularObj.circular = circularObj;

      // This should be handled gracefully by the type converter
      expect(() => {
        convertValue(circularObj, 'string', 'data');
      }).toThrow(ParseError);
    });
  });

  describe('File System Error Edge Cases', () => {
    it('should handle permission denied errors', () => {
      const restrictedPath = join(testDir, 'restricted.json');
      writeFileSync(restrictedPath, '{"test": "value"}');

      // Try to simulate permission error by using an invalid path
      const invalidPath = '/root/restricted-config.json';
      const loader = new FileLoader(invalidPath);

      expect(() => loader.load()).toThrow(FileError);

      try {
        loader.load();
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        const fileError = error as FileError;
        expect(fileError.filePath).toBe(invalidPath);
        expect(fileError.message).toContain(
          'Failed to read configuration file',
        );
      }
    });

    it('should handle corrupted JSON files with specific error details', () => {
      // Create various types of corrupted JSON
      const corruptedJsonCases = [
        '{"key": "value"', // Missing closing brace
        '{"key": "value",}', // Trailing comma
        '{"key": value}', // Unquoted value
        '{key: "value"}', // Unquoted key
        '{"key": "value" "another": "value"}', // Missing comma
        '\uFEFF{"key": "value"}', // BOM character
      ];

      for (const [index, corruptedJson] of corruptedJsonCases.entries()) {
        const testPath = join(testDir, `corrupted-${index}.json`);
        writeFileSync(testPath, corruptedJson);

        const loader = new FileLoader(testPath);

        expect(() => loader.load()).toThrow(FileError);

        try {
          loader.load();
        } catch (error) {
          expect(error).toBeInstanceOf(FileError);
          const fileError = error as FileError;
          expect(fileError.message).toContain('Failed to parse JSON');
          expect(fileError.filePath).toBe(testPath);
        }
      }
    });

    it('should handle empty and whitespace-only files', () => {
      const emptyPath = join(testDir, 'empty.json');
      const whitespacePath = join(testDir, 'whitespace.json');

      writeFileSync(emptyPath, '');
      writeFileSync(whitespacePath, '   \n\t  \r\n  ');

      const emptyLoader = new FileLoader(emptyPath);
      const whitespaceLoader = new FileLoader(whitespacePath);

      expect(() => emptyLoader.load()).toThrow(FileError);
      expect(() => whitespaceLoader.load()).toThrow(FileError);

      // Verify specific error messages
      try {
        emptyLoader.load();
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        const fileError = error as FileError;
        expect(fileError.message).toContain('Failed to parse JSON');
      }

      try {
        whitespaceLoader.load();
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        const fileError = error as FileError;
        expect(fileError.message).toContain('Failed to parse JSON');
      }
    });

    it('should handle very large file errors gracefully', () => {
      const largePath = join(testDir, 'large.json');

      // Create a large but invalid JSON file
      const largeInvalidContent = `{"data": "${'x'.repeat(10000)}"`; // Missing closing quote and brace
      writeFileSync(largePath, largeInvalidContent);

      const loader = new FileLoader(largePath);

      expect(() => loader.load()).toThrow(FileError);

      try {
        loader.load();
      } catch (error) {
        expect(error).toBeInstanceOf(FileError);
        const fileError = error as FileError;
        expect(fileError.message).toContain('Failed to parse JSON');
        expect(fileError.filePath).toBe(largePath);
      }
    });
  });

  describe('Complex Type Conversion Errors', () => {
    it('should handle edge cases in number conversion', () => {
      const edgeCases = [
        { value: 'Infinity', shouldThrow: false },
        { value: '-Infinity', shouldThrow: false },
        { value: 'NaN', shouldThrow: true },
        { value: '1.23e10', shouldThrow: false },
        { value: '0x10', shouldThrow: false }, // Hexadecimal
        { value: '0b1010', shouldThrow: false }, // Binary
        { value: '0o777', shouldThrow: false }, // Octal
        { value: '1,234', shouldThrow: true }, // Comma separator
        { value: '12.34.56', shouldThrow: true }, // Multiple decimals
        { value: '12abc', shouldThrow: true }, // Mixed alphanumeric
      ];

      for (const { value, shouldThrow } of edgeCases) {
        if (shouldThrow) {
          expect(() => {
            convertValue(value, 'number', 'testProperty');
          }).toThrow(ParseError);
        } else {
          expect(() => {
            convertValue(value, 'number', 'testProperty');
          }).not.toThrow();
        }
      }
    });

    it('should handle edge cases in boolean conversion', () => {
      const edgeCases = [
        { value: 'TRUE', expected: true },
        { value: 'FALSE', expected: false },
        { value: '  true  ', expected: true }, // Whitespace
        { value: 'yes', shouldThrow: true },
        { value: 'no', shouldThrow: true },
        { value: 'on', shouldThrow: true },
        { value: 'off', shouldThrow: true },
        { value: 2, shouldThrow: true }, // Only 0 and 1 are valid numbers
        { value: -1, shouldThrow: true },
      ];

      for (const { value, expected, shouldThrow } of edgeCases) {
        if (shouldThrow) {
          expect(() => {
            convertValue(value, 'boolean', 'testProperty');
          }).toThrow(ParseError);
        } else {
          const result = convertValue(value, 'boolean', 'testProperty');
          expect(result).toBe(expected);
        }
      }
    });

    it('should handle complex JSON parsing errors', () => {
      const jsonEdgeCases = [
        '{"key": undefined}', // JavaScript undefined
        '{"key": function() {}}', // JavaScript function
        "{'key': 'value'}", // Single quotes
        '{"key": "value",}', // Trailing comma
        '{"key": .5}', // Leading decimal point
        '{"key": 05}', // Leading zero
        '{"key": "value"}\n{"another": "object"}', // Multiple JSON objects
      ];

      for (const jsonString of jsonEdgeCases) {
        expect(() => {
          convertValue(jsonString, 'json', 'testProperty');
        }).toThrow(ParseError);

        try {
          convertValue(jsonString, 'json', 'testProperty');
        } catch (error) {
          expect(error).toBeInstanceOf(ParseError);
          const parseError = error as ParseError;
          expect(parseError.property).toBe('testProperty');
          expect(parseError.value).toBe(jsonString);
          expect(parseError.message).toContain('Invalid JSON');
        }
      }
    });
  });

  describe('Async Operation Error Scenarios', () => {
    it('should handle concurrent asyncLoad operations with errors', async () => {
      const schema = {
        value: {
          format: 'string',
          default: 'default',
        },
      };

      const envict = new Envict({ schema });

      // Create a failing loader
      const failingLoader = {
        async load() {
          throw new Error('Async load failed');
        },
      };

      // Test concurrent failing loads
      const promises = [
        envict.asyncLoad(failingLoader),
        envict.asyncLoad(failingLoader),
        envict.asyncLoad(failingLoader),
      ];

      // All should fail
      await expect(Promise.all(promises)).rejects.toThrow('Async load failed');
    });

    it('should prevent race conditions in concurrent asyncLoad operations', async () => {
      const schema = {
        counter: {
          format: 'number',
          default: 0,
        },
        data: {
          format: 'string',
          default: '',
        },
      };

      const envict = new Envict({ schema });

      // Create loaders that modify the same configuration keys
      let loadCount = 0;
      const createLoader = (id: number) => ({
        async load() {
          // Simulate some async work
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 10),
          );

          loadCount++;
          return {
            counter: loadCount,
            data: `loader-${id}-count-${loadCount}`,
          };
        },
      });

      // Run multiple concurrent asyncLoad operations
      const promises = [
        envict.asyncLoad(createLoader(1)),
        envict.asyncLoad(createLoader(2)),
        envict.asyncLoad(createLoader(3)),
        envict.asyncLoad(createLoader(4)),
        envict.asyncLoad(createLoader(5)),
      ];

      // Wait for all operations to complete
      await Promise.all(promises);

      // Verify that all operations completed and the final state is consistent
      expect(loadCount).toBe(5);
      const finalCounter = envict.get('counter');
      const finalData = envict.get('data');

      // The final counter should be 5 (the last loader to complete)
      expect(finalCounter).toBe(5);
      expect(finalData).toMatch(/^loader-\d+-count-5$/);

      // Verify configuration is still valid and accessible
      expect(typeof finalCounter).toBe('number');
      expect(typeof finalData).toBe('string');
    });

    it('should handle asyncWrite errors with invalid paths', async () => {
      const schema = {
        value: {
          format: 'string',
          default: 'test',
        },
      };

      const envict = new Envict({ schema });

      // Test various invalid path scenarios
      const invalidPaths = [
        '', // Empty path
        '\0invalid', // Null character
        '/root/restricted', // Permission denied (likely)
      ];

      for (const invalidPath of invalidPaths) {
        await expect(
          envict.asyncWrite({
            path: invalidPath,
            fileName: 'test.json',
            format: 'json',
          }),
        ).rejects.toThrow();
      }
    });

    it('should prevent file system race conditions in concurrent asyncWrite operations', async () => {
      const schema = {
        counter: {
          format: 'number',
          default: 0,
          env: 'COUNTER',
        },
        timestamp: {
          format: 'number',
          default: 0,
          env: 'TIMESTAMP',
        },
        writer: {
          format: 'string',
          default: 'none',
          env: 'WRITER',
        },
      };

      const testDir = join(__dirname, 'temp-race-test');
      const testFile = 'race-test.json';

      // Clean up any existing test files
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {
        // Ignore if directory doesn't exist
      }

      // Create multiple concurrent write operations to the same file
      let writeCount = 0;
      const createWriteOperation = (writerId: number) => {
        writeCount++;
        const currentCount = writeCount;

        // Create a new Envict instance with updated configuration for this write
        const writeEnvict = new Envict({
          schema,
          env: {
            COUNTER: currentCount.toString(),
            TIMESTAMP: Date.now().toString(),
            WRITER: `writer-${writerId}`,
          },
        });

        return writeEnvict.asyncWrite({
          path: testDir,
          fileName: testFile,
          format: 'json',
        });
      };

      // Run multiple concurrent write operations
      const writePromises = [
        createWriteOperation(1),
        createWriteOperation(2),
        createWriteOperation(3),
        createWriteOperation(4),
        createWriteOperation(5),
      ];

      // Wait for all write operations to complete
      await Promise.all(writePromises);

      // Verify the file exists and contains valid JSON
      const filePath = join(testDir, testFile);
      expect(existsSync(filePath)).toBe(true);

      // Read and parse the final file content
      const fileContent = readFileSync(filePath, 'utf8');
      const parsedContent = JSON.parse(fileContent);

      // Verify the file contains valid configuration data
      expect(parsedContent).toHaveProperty('counter');
      expect(parsedContent).toHaveProperty('timestamp');
      expect(parsedContent).toHaveProperty('writer');

      // Verify the final write operation completed successfully
      expect(typeof parsedContent.counter).toBe('number');
      expect(parsedContent.counter).toBeGreaterThan(0);
      expect(parsedContent.counter).toBeLessThanOrEqual(5);
      expect(typeof parsedContent.timestamp).toBe('number');
      expect(parsedContent.writer).toMatch(/^writer-\d+$/);

      // Verify no file corruption occurred (valid JSON structure)
      // The key point is that we have valid JSON, not corrupted data
      expect(parsedContent.counter).toBeGreaterThan(0);
      expect(parsedContent.timestamp).toBeGreaterThan(0);
      expect(parsedContent.writer).toBeTruthy();

      // Clean up test files
      try {
        rmSync(testDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    });
  });

  describe('Error Message Quality', () => {
    it('should provide detailed error messages with context', () => {
      // Test by trying to get a value that will fail validation
      expect(() => {
        // Use convertValue directly to test error message quality
        convertValue('lowercase-invalid', /^[A-Z]+$/, 'nested.deep.property');
      }).toThrow(ValidationError);

      try {
        convertValue('lowercase-invalid', /^[A-Z]+$/, 'nested.deep.property');
      } catch (error) {
        expect(error).toBeInstanceOf(ValidationError);
        const validationError = error as ValidationError;
        expect(validationError.message).toContain('lowercase-invalid');
        expect(validationError.message).toContain('/^[A-Z]+$/');
        expect(validationError.property).toBe('nested.deep.property');
      }
    });

    it('should provide helpful suggestions in error messages', () => {
      const testCases = [
        {
          value: 'not-a-number',
          format: 'number',
          expectedSuggestions: ['123', '45.67', '-89'],
        },
        {
          value: 'invalid-boolean',
          format: 'boolean',
          expectedSuggestions: ['true', 'false', '1', '0'],
        },
        {
          value: 'invalid json',
          format: 'json',
          expectedSuggestions: ['{"key": "value"}', '[1, 2, 3]'],
        },
      ];

      for (const { value, format, expectedSuggestions } of testCases) {
        try {
          convertValue(
            value,
            format as 'number' | 'boolean' | 'json',
            'testProperty',
          );
        } catch (error) {
          expect(error).toBeInstanceOf(ParseError);
          const parseError = error as ParseError;
          for (const suggestion of expectedSuggestions) {
            expect(parseError.message).toContain(suggestion);
          }
        }
      }
    });
  });

  describe('Error Recovery and State Consistency', () => {
    it('should maintain consistent state after failed operations', () => {
      const schema = {
        validProperty: {
          format: 'string',
          default: 'valid-value',
        },
        numericProperty: {
          format: 'number',
          default: 42,
        },
      };

      const envict = new Envict({ schema });

      // Valid properties should work
      expect(envict.get('validProperty')).toBe('valid-value');
      expect(envict.get('numericProperty')).toBe(42);

      // Test that individual type conversion errors don't affect the instance
      expect(() => {
        convertValue('not-a-number', 'number', 'testProperty');
      }).toThrow(ParseError);

      // Original configuration should still be accessible after the error
      expect(envict.get('validProperty')).toBe('valid-value');
      expect(envict.get('numericProperty')).toBe(42);

      // Test with a valid file load to ensure state management works
      const validConfigPath = join(testDir, 'valid-state.json');
      writeFileSync(
        validConfigPath,
        JSON.stringify({
          validProperty: 'updated-value',
        }),
      );

      envict.load(validConfigPath);
      expect(envict.get('validProperty')).toBe('updated-value');
      expect(envict.get('numericProperty')).toBe(42); // Should remain unchanged
    });

    it('should handle partial failures in file loading gracefully', () => {
      const validConfigPath = join(testDir, 'valid-config.json');
      const invalidConfigPath = join(testDir, 'invalid-config.json');

      writeFileSync(validConfigPath, '{"validKey": "validValue"}');
      writeFileSync(invalidConfigPath, '{"invalidKey": invalid}');

      const schema = {
        validKey: {
          format: 'string',
          default: 'default',
        },
        anotherKey: {
          format: 'string',
          default: 'another-default',
        },
      };

      const envict = new Envict({ schema });

      // Load valid config first
      envict.load(validConfigPath);
      expect(envict.get('validKey')).toBe('validValue');

      // Try to load invalid config - should fail but not affect existing state
      expect(() => {
        envict.load(invalidConfigPath);
      }).toThrow(FileError);

      // Original valid config should still be intact
      expect(envict.get('validKey')).toBe('validValue');
      expect(envict.get('anotherKey')).toBe('another-default');
    });
  });
});
