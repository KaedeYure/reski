import { ReskiObject, ReskiString, ReskiTextNode } from './types';

/**
 * Synchronously reads a file from the given path and returns its content.
 * @param filePath - The path to the file to read
 * @returns The file content as a string, or null if an error occurs
 */
export declare function readFile(filePath: string): ReskiString | null;

/**
 * Asynchronously reads a file from the given path and returns its content.
 * @param filePath - The path to the file to read
 * @returns A promise that resolves to the file content as a string, or rejects with an error
 */
export declare function readFileAsync(filePath: string): Promise<ReskiString>;

/**
 * Synchronously reads a file from the given path, parses its content, and returns the parsed result.
 * @param filePath - The path to the file to read
 * @returns The parsed content as a ReskiObject, or null if an error occurs
 */
export declare function load(filePath: string): ReskiObject | null;