/**
 * Type definitions for the Reskify library
 */

/**
 * Options for the reskify function
 */
export interface ReskifyOptions {
  /**
   * Enable debug mode to show error messages
   * @default false
   */
  debug?: boolean;
}

/**
 * Interface for a text child component
 */
export interface TextComponent {
  /**
   * Name must be 'text' for text components
   */
  name: 'text';
  
  /**
   * The static text content to display
   */
  content?: string;
  
  /**
   * Dynamic expression for text content
   * Format: @(expression)
   */
  dynamic?: string;

  /**
   * Expression for text content
   */
  expression?: string;

  /**
   * Error message if component has an error
   */
  error?: string;
}

/**
 * For Each loop configuration
 */
export interface ForEachComponent {
  /**
   * Type identifier for forEach components
   */
  type: 'forEach';
  
  /**
   * The name of the array to iterate over
   */
  arrayName: string;
  
  /**
   * The template to use for each item
   */
  template: string;
  
  /**
   * Optional filter expression
   */
  filter?: string | null;
  
  /**
   * Optional map expression
   */
  map?: string | null;
  
  /**
   * Optional index variable name
   */
  index?: string | null;
}

/**
 * Interface for a Reski component
 */
export interface ReskiComponent {
  /**
   * Component name
   */
  name: string;
  
  /**
   * Component parameters
   */
  params?: Record<string, any>;
  
  /**
   * Raw parameters as string array
   */
  raw?: any[];
  
  /**
   * CSS classes to apply to the component
   */
  classes?: string[];
  
  /**
   * Child components
   */
  children?: (ReskiComponent | TextComponent | ForEachComponent)[];
  
  /**
   * Component properties
   */
  props?: Record<string, any>;

  /**
   * Error message if component has an error
   */
  error?: string;
}

/**
 * Interface for a full parse result
 */
export interface ReskiParseResult {
  /**
   * Data definitions
   */
  data?: Record<string, any>;
  
  /**
   * Template definitions
   */
  templates?: Record<string, ReskiTemplate>;
  
  /**
   * Layout component
   */
  layout?: ReskiComponent;
}

/**
 * Interface for a template definition
 */
export interface ReskiTemplate {
  /**
   * The template definition (component)
   */
  definition: ReskiComponent;
  
  /**
   * Whether this is a placeholder template
   */
  placeholder?: boolean;
  
  /**
   * Template parameters
   */
  parameters?: Array<{value: any}>;
}

/**
 * Converts a Reski component object to its string representation
 * 
 * @param input - The component or parse result to convert
 * @param options - Optional configuration
 * @returns The string representation of the component
 * @throws {Error} If the component is invalid
 */
export default function reskify(
  input: ReskiComponent | TextComponent | ForEachComponent | ReskiParseResult, 
  options?: ReskifyOptions
): string;

/**
 * Converts a full parse result to its string representation
 * 
 * @param parseResult - The parse result to convert
 * @param options - Optional configuration
 * @returns The string representation
 */
export function reskifyFull(
  parseResult: ReskiParseResult,
  options?: ReskifyOptions
): string;

/**
 * Converts a single component to its string representation
 * 
 * @param component - The component to convert
 * @param options - Optional configuration
 * @returns The string representation
 */
export function reskifyComponent(
  component: ReskiComponent | TextComponent | ForEachComponent,
  options?: ReskifyOptions
): string;

/**
 * Formats the component name section of a Reski string
 * 
 * @param component - The component to process
 * @returns The name section string
 */
export function formatComponentName(component: ReskiComponent): string;

/**
 * Formats a parameter value for the component name
 * 
 * @param value - The parameter value to format
 * @returns The formatted parameter value
 */
export function formatParamValue(value: any): string;

/**
 * Formats the classes section of a Reski string
 * 
 * @param component - The component to process
 * @returns The classes section string
 */
export function formatClasses(component: ReskiComponent): string;

/**
 * Formats the children section of a Reski string
 * 
 * @param component - The component to process
 * @param options - The reskify options
 * @returns The children section string
 */
export function formatChildren(
  component: ReskiComponent, 
  options: ReskifyOptions
): string;

/**
 * Formats a text child component string
 * 
 * @param child - The text component to process
 * @returns The string representation of the text component
 */
export function formatTextChild(child: TextComponent): string;

/**
 * Formats a forEach child component string
 * 
 * @param child - The forEach component to process
 * @param options - The reskify options
 * @returns The string representation of the forEach component
 */
export function formatForEachChild(child: ForEachComponent, options: ReskifyOptions): string;

/**
 * Formats the array part of a forEach component
 * 
 * @param child - The forEach component to process
 * @returns The formatted array part string
 */
export function formatForEachArray(child: ForEachComponent): string;

/**
 * Formats the props section of a Reski string
 * 
 * @param component - The component to process
 * @returns The props section string
 */
export function formatProps(component: ReskiComponent): string;

/**
 * Helper function to escape strings for proper serialization
 * 
 * @param str - The string to escape
 * @returns The escaped string
 */
export function escapeString(str: string | any): string;