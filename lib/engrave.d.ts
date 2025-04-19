/**
 * Replaces data binding expressions in a Reski String with their values
 * 
 * Data binding expressions use the format [(path.to.data)] and are replaced with
 * Reski text nodes in the format ["value"]. This preprocessing occurs before
 * parsing the Reski String.
 * 
 * @param input - A Reski String potentially containing data binding expressions
 * @param data - An object containing data values to inject into the String
 * @returns A processed Reski String with data values inserted
 * 
 * @example
 * // returns '[div::["Hello"].["Jane"]]'
 * engrave('[div::["Hello"].[(user.name)]]', { user: { name: 'Jane' } });
 */
export default function engrave(input: string, data?: Object): string;

/**
 * Evaluates a dot-notation expression against a data object
 * 
 * @param expression - A dot-notation path (e.g., "user.name.first")
 * @param data - The data object to extract values from
 * @returns The value found at the specified path, or an empty string if not found
 * 
 * @example
 * // returns 'Jane'
 * evaluateExpression('user.name', { user: { name: 'Jane' } });
 */
export function evaluateExpression(expression: string, data: Record<string, any>): string;