/**
 * Built-in async loaders for Envict configuration management
 */

import type { AsyncLoader } from './types';

/**
 * API-based configuration loader
 *
 * Fetches configuration from a REST API endpoint using the Fetch API.
 * Supports custom headers, authentication, and other fetch options.
 * Perfect for loading configuration from microservices, config servers,
 * or cloud-based configuration management systems.
 *
 * @example
 * ```typescript
 * // Basic usage
 * const loader = new ApiLoader('https://config-api.example.com/config');
 * const config = await loader.load();
 *
 * // With authentication
 * const authLoader = new ApiLoader('https://api.example.com/config', {
 *   headers: {
 *     'Authorization': 'Bearer your-token',
 *     'Content-Type': 'application/json'
 *   }
 * });
 * const authConfig = await authLoader.load();
 * ```
 */
export class ApiLoader implements AsyncLoader {
  private url: string;
  private options: RequestInit | undefined;

  /**
   * Create an API loader
   *
   * @param url The API endpoint URL to fetch configuration from
   * @param options Optional fetch options (headers, method, authentication, etc.)
   *                Supports all standard RequestInit options from the Fetch API
   */
  constructor(url: string, options?: RequestInit) {
    this.url = url;
    this.options = options;
  }

  /**
   * Load configuration from the API endpoint
   *
   * Makes an HTTP request to the configured URL and parses the JSON response.
   * Validates that the response is a valid JSON object (not array or primitive).
   *
   * @returns Promise that resolves to configuration data as key-value pairs
   * @throws Error if the API request fails, returns non-200 status, or invalid JSON
   */
  async load(): Promise<Record<string, unknown>> {
    try {
      const response = await fetch(this.url, this.options);

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`,
        );
      }

      const data = await response.json();

      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        throw new Error(
          `API response must be a JSON object, received: ${typeof data}`,
        );
      }

      return data as Record<string, unknown>;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to load configuration from API: ${error.message}`,
        );
      }
      throw new Error('Failed to load configuration from API: Unknown error');
    }
  }
}
