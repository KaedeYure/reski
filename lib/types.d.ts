/**
 * Represents a valid Reski String format
 * @param component: [`component-name`:`class.class`:[`component`]:{`"key":"value"`}]
 */
export type ReskiString = string;

/**
 * Type guard to check if a string is a valid Reski string
 * @param value - The string to check
 * @returns True if the string is a valid Reski string
 */
export function isReskiString(value: string): value is ReskiString {
  return typeof value === 'string' && 
        value.startsWith('[') && 
        alue.endsWith(']');
}

/**
 * Represents the result of parsing a Reski String
 */
export interface ReskiObject {
  /**
   * The name of the component
   */
  name: string;
  
  /**
   * Optional list of CSS classes associated with the component
   */
  classes?: string[];
  
  /**
   * Optional list of child components
   */
  children?: Array<ReskiObject | ReskiTextNode>;
  
  /**
   * Optional object containing component properties or data attributes
   */
  props?: Record<string, any>;
}

/**
 * Represents a text node in the Reski structure
 */
export interface ReskiTextNode {
  /**
   * Always 'text' for text nodes
   */
  name: 'text';
  
  /**
   * The text content
   */
  content: string;
}