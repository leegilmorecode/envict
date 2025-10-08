/**
 * Tests for TypeConverter class
 */

import { canConvert, convertValue } from '../src/type-converter';
import { ParseError, ValidationError } from '../src/types';

describe('Type Converter Functions', () => {
  describe('convertValue function', () => {
    describe('string format', () => {
      it('should return string values unchanged', () => {
        expect(convertValue('hello', 'string', 'test')).toBe('hello');
        expect(convertValue('', 'string', 'test')).toBe('');
        expect(convertValue('123', 'string', 'test')).toBe('123');
      });

      it('should convert numbers to strings', () => {
        expect(convertValue(123, 'string', 'test')).toBe('123');
        expect(convertValue(0, 'string', 'test')).toBe('0');
        expect(convertValue(-456, 'string', 'test')).toBe('-456');
        expect(convertValue(3.14, 'string', 'test')).toBe('3.14');
      });

      it('should convert booleans to strings', () => {
        expect(convertValue(true, 'string', 'test')).toBe('true');
        expect(convertValue(false, 'string', 'test')).toBe('false');
      });

      it('should handle null and undefined', () => {
        expect(convertValue(null, 'string', 'test')).toBe(null);
        expect(convertValue(undefined, 'string', 'test')).toBe(undefined);
      });

      it('should convert objects to JSON strings', () => {
        const obj = { key: 'value', num: 42 };
        expect(convertValue(obj, 'string', 'test')).toBe(
          '{"key":"value","num":42}',
        );

        const arr = [1, 2, 3];
        expect(convertValue(arr, 'string', 'test')).toBe('[1,2,3]');
      });

      it('should throw ParseError for circular objects', () => {
        // biome-ignore lint/suspicious/noExplicitAny: Testing circular object handling
        const circular: any = { prop: null };
        circular.prop = circular;

        expect(() => convertValue(circular, 'string', 'test')).toThrow(
          ParseError,
        );
      });
    });

    describe('number format', () => {
      it('should return number values unchanged', () => {
        expect(convertValue(123, 'number', 'test')).toBe(123);
        expect(convertValue(0, 'number', 'test')).toBe(0);
        expect(convertValue(-456, 'number', 'test')).toBe(-456);
        expect(convertValue(3.14, 'number', 'test')).toBe(3.14);
      });

      it('should convert valid number strings', () => {
        expect(convertValue('123', 'number', 'test')).toBe(123);
        expect(convertValue('0', 'number', 'test')).toBe(0);
        expect(convertValue('-456', 'number', 'test')).toBe(-456);
        expect(convertValue('3.14', 'number', 'test')).toBe(3.14);
        expect(convertValue('  42  ', 'number', 'test')).toBe(42);
      });

      it('should convert booleans to numbers', () => {
        expect(convertValue(true, 'number', 'test')).toBe(1);
        expect(convertValue(false, 'number', 'test')).toBe(0);
      });

      it('should throw ParseError for invalid number strings', () => {
        expect(() => convertValue('abc', 'number', 'test')).toThrow(ParseError);
        expect(() => convertValue('12abc', 'number', 'test')).toThrow(
          ParseError,
        );
        expect(() => convertValue('', 'number', 'test')).toThrow(ParseError);
        expect(() => convertValue('   ', 'number', 'test')).toThrow(ParseError);
      });

      it('should throw ParseError for NaN values', () => {
        expect(() => convertValue(Number.NaN, 'number', 'test')).toThrow(
          ParseError,
        );
      });

      it('should throw ParseError for unsupported types', () => {
        expect(() => convertValue({}, 'number', 'test')).toThrow(ParseError);
        expect(() => convertValue([], 'number', 'test')).toThrow(ParseError);
      });
    });

    describe('boolean format', () => {
      it('should return boolean values unchanged', () => {
        expect(convertValue(true, 'boolean', 'test')).toBe(true);
        expect(convertValue(false, 'boolean', 'test')).toBe(false);
      });

      it('should convert truthy string values', () => {
        expect(convertValue('true', 'boolean', 'test')).toBe(true);
        expect(convertValue('TRUE', 'boolean', 'test')).toBe(true);
        expect(convertValue('True', 'boolean', 'test')).toBe(true);
        expect(convertValue('1', 'boolean', 'test')).toBe(true);
        expect(convertValue('  true  ', 'boolean', 'test')).toBe(true);
      });

      it('should convert falsy string values', () => {
        expect(convertValue('false', 'boolean', 'test')).toBe(false);
        expect(convertValue('FALSE', 'boolean', 'test')).toBe(false);
        expect(convertValue('False', 'boolean', 'test')).toBe(false);
        expect(convertValue('0', 'boolean', 'test')).toBe(false);

        expect(convertValue('  false  ', 'boolean', 'test')).toBe(false);
      });

      it('should convert number values', () => {
        expect(convertValue(1, 'boolean', 'test')).toBe(true);
        expect(convertValue(0, 'boolean', 'test')).toBe(false);
      });

      it('should throw ParseError for invalid string values', () => {
        expect(() => convertValue('2', 'boolean', 'test')).toThrow(ParseError);
        expect(() => convertValue('invalid', 'boolean', 'test')).toThrow(
          ParseError,
        );
      });

      it('should throw ParseError for invalid number values', () => {
        expect(() => convertValue(2, 'boolean', 'test')).toThrow(ParseError);
        expect(() => convertValue(-1, 'boolean', 'test')).toThrow(ParseError);
        expect(() => convertValue(3.14, 'boolean', 'test')).toThrow(ParseError);
      });

      it('should throw ParseError for unsupported types', () => {
        expect(() => convertValue({}, 'boolean', 'test')).toThrow(ParseError);
        expect(() => convertValue([], 'boolean', 'test')).toThrow(ParseError);
      });
    });

    describe('json format', () => {
      it('should parse valid JSON strings', () => {
        expect(convertValue('{"key":"value"}', 'json', 'test')).toEqual({
          key: 'value',
        });
        expect(convertValue('[1,2,3]', 'json', 'test')).toEqual([1, 2, 3]);
        expect(convertValue('true', 'json', 'test')).toBe(true);
        expect(convertValue('false', 'json', 'test')).toBe(false);
        expect(convertValue('null', 'json', 'test')).toBe(null);
        expect(convertValue('123', 'json', 'test')).toBe(123);
        expect(convertValue('"string"', 'json', 'test')).toBe('string');
      });

      it('should handle complex nested JSON', () => {
        const complexJson =
          '{"users":[{"name":"John","age":30},{"name":"Jane","age":25}],"config":{"debug":true}}';
        const expected = {
          users: [
            { name: 'John', age: 30 },
            { name: 'Jane', age: 25 },
          ],
          config: { debug: true },
        };
        expect(convertValue(complexJson, 'json', 'test')).toEqual(expected);
      });

      it('should throw ParseError for invalid JSON strings', () => {
        expect(() => convertValue('invalid json', 'json', 'test')).toThrow(
          ParseError,
        );
        expect(() => convertValue('{invalid}', 'json', 'test')).toThrow(
          ParseError,
        );
        expect(() => convertValue('{"unclosed": true', 'json', 'test')).toThrow(
          ParseError,
        );
        expect(() => convertValue('[1,2,3', 'json', 'test')).toThrow(
          ParseError,
        );
      });

      it('should throw ParseError for empty strings', () => {
        expect(() => convertValue('', 'json', 'test')).toThrow(ParseError);
        expect(() => convertValue('   ', 'json', 'test')).toThrow(ParseError);
      });

      it('should throw ParseError for non-string values', () => {
        expect(() => convertValue(123, 'json', 'test')).toThrow(ParseError);
        expect(() => convertValue(true, 'json', 'test')).toThrow(ParseError);
        expect(() => convertValue({}, 'json', 'test')).toThrow(ParseError);
        expect(() => convertValue([], 'json', 'test')).toThrow(ParseError);
      });
    });

    describe('regex format', () => {
      it('should validate strings against regex patterns', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(convertValue('test@example.com', emailRegex, 'test')).toBe(
          'test@example.com',
        );

        const urlRegex = /^https?:\/\/.+/;
        expect(convertValue('https://example.com', urlRegex, 'test')).toBe(
          'https://example.com',
        );
        expect(convertValue('http://localhost:3000', urlRegex, 'test')).toBe(
          'http://localhost:3000',
        );
      });

      it('should convert non-strings to strings before validation', () => {
        const numberRegex = /^\d+$/;
        expect(convertValue(123, numberRegex, 'test')).toBe('123');

        // Test with a pattern that matches 'true'
        const booleanRegex = /^(true|false)$/;
        expect(convertValue(true, booleanRegex, 'test')).toBe('true');
        expect(convertValue(false, booleanRegex, 'test')).toBe('false');
      });

      it('should throw ValidationError for non-matching patterns', () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(() => convertValue('invalid-email', emailRegex, 'test')).toThrow(
          ValidationError,
        );
        expect(() => convertValue('test@', emailRegex, 'test')).toThrow(
          ValidationError,
        );

        const urlRegex = /^https?:\/\/.+/;
        expect(() =>
          convertValue('ftp://example.com', urlRegex, 'test'),
        ).toThrow(ValidationError);
        expect(() => convertValue('not-a-url', urlRegex, 'test')).toThrow(
          ValidationError,
        );
      });

      it('should include pattern in error message', () => {
        const pattern = /^test-\d+$/;
        try {
          convertValue('invalid', pattern, 'testProp');
          throw new Error('Expected ValidationError to be thrown');
        } catch (error) {
          expect(error).toBeInstanceOf(ValidationError);
          expect((error as ValidationError).message).toContain(
            pattern.toString(),
          );
          expect((error as ValidationError).property).toBe('testProp');
        }
      });
    });

    describe('null and undefined handling', () => {
      it('should return null and undefined unchanged for all formats', () => {
        expect(convertValue(null, 'string', 'test')).toBe(null);
        expect(convertValue(undefined, 'string', 'test')).toBe(undefined);
        expect(convertValue(null, 'number', 'test')).toBe(null);
        expect(convertValue(undefined, 'number', 'test')).toBe(undefined);
        expect(convertValue(null, 'boolean', 'test')).toBe(null);
        expect(convertValue(undefined, 'boolean', 'test')).toBe(undefined);
        expect(convertValue(null, 'json', 'test')).toBe(null);
        expect(convertValue(undefined, 'json', 'test')).toBe(undefined);

        const regex = /test/;
        expect(convertValue(null, regex, 'test')).toBe(null);
        expect(convertValue(undefined, regex, 'test')).toBe(undefined);
      });
    });

    describe('unsupported formats', () => {
      it('should throw ValidationError for unsupported format types', () => {
        // Test with invalid format by casting to any
        expect(() =>
          // biome-ignore lint/suspicious/noExplicitAny: Testing invalid format handling
          convertValue('test', 'invalid-format' as any, 'test'),
        ).toThrow(ValidationError);
        // biome-ignore lint/suspicious/noExplicitAny: Testing invalid format handling
        expect(() => convertValue('test', 123 as any, 'test')).toThrow(
          ValidationError,
        );
      });
    });
  });

  describe('canConvert method', () => {
    it('should return true for valid conversions', () => {
      expect(canConvert('123', 'number')).toBe(true);
      expect(canConvert('true', 'boolean')).toBe(true);
      expect(canConvert('{"key":"value"}', 'json')).toBe(true);
      expect(canConvert('test@example.com', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)).toBe(
        true,
      );
    });

    it('should return false for invalid conversions', () => {
      expect(canConvert('abc', 'number')).toBe(false);
      expect(canConvert('invalid json', 'json')).toBe(false);
      expect(canConvert('invalid-email', /^[^\s@]+@[^\s@]+\.[^\s@]+$/)).toBe(
        false,
      );
    });

    it('should handle null and undefined', () => {
      expect(canConvert(null, 'string')).toBe(true);
      expect(canConvert(undefined, 'number')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('should include property name in error messages', () => {
      try {
        convertValue('abc', 'number', 'myProperty');
        throw new Error('Expected ParseError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).property).toBe('myProperty');
        expect((error as ParseError).value).toBe('abc');
      }
    });

    it('should include original value in error objects', () => {
      const originalValue = { complex: 'object' };
      try {
        convertValue(originalValue, 'number', 'testProp');
        throw new Error('Expected ParseError to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(ParseError);
        expect((error as ParseError).value).toBe(originalValue);
      }
    });

    it('should provide helpful error messages', () => {
      try {
        convertValue('maybe', 'boolean', 'testProp');
        throw new Error('Expected ParseError to be thrown');
      } catch (error) {
        expect((error as ParseError).message).toContain(
          'Cannot convert "maybe" to boolean',
        );
        expect((error as ParseError).message).toContain(
          'Expected: true, false, 1, or 0',
        );
      }
    });
  });
});
