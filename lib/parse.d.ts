import { ReskiObject, ReskiString, ReskiTextNode } from './types';

/**
 * Parses a Reski String into a structured object
 * 
 * @param ReskiString - The Reski String to parse
 * @returns The parsed Reski structure
 * @throws Error if the string is not a valid Reski String
 * 
 * @example
 * ```
 * // Parse a simple Reski String
 * const reski = parse('[div:container.flex:[p:"Hello World"]]');
 * // Result:
 * // {
 * //   name: 'div',
 * //   classes: ['container', 'flex'],
 * //   children: [
 * //     {
 * //       name: 'text',
 * //       content: 'Hello World'
 * //     }
 * //   ]
 * // }
 * ```
 */
export default function parse(string: ReskiString): ReskiObject;

/**
 * Splits a string by colons while respecting nested brackets and quotes
 * 
 * @private
 * @param string - The string to split
 * @returns An array of string parts
 */
declare function splitRespectingColons(string: string): string[];

/**
 * Splits a string by a delimiter while respecting nested brackets and quotes
 * 
 * @private
 * @param string - The string to split
 * @param delimiter - The delimiter to split by (defaults to '.')
 * @returns An array of string parts
 */
declare function splitRespectingBrackets(string: string, delimiter?: string): string[];

export { ReskiObject, ReskiTextNode };