import { ReskiObject, ReskiTextNode, ReskiString } from './types';

/**
 * Converts a component object into a Reski String
 * 
 * @param component - The component object to convert
 * @returns The Reski string representation
 * @throws Error if the component is invalid
 * 
 * @example
 * ```
 * // Convert a component object to a Reski string
 * const reskiStr = reskify({
 *   name: 'div',
 *   classes: ['container', 'flex'],
 *   children: [
 *     {
 *       name: 'text',
 *       content: 'Hello World'
 *     }
 *   ]
 * });
 * // Result: '[div:container.flex:[\"Hello World\"]]'
 * ```
 */
export default function reskify(component: ReskiObject | ReskiTextNode): ReskiString;