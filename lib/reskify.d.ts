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
}

/**
 * Properties for template parameters
 */
export interface TemplateParam {
  /**
   * The type of parameter
   */
  type: 'string' | 'array' | 'object';
  
  /**
   * The value of the parameter
   */
  value: string | number | boolean | any[] | object;
}

/**
 * Template configuration
 */
export interface Template {
  /**
   * Template name as key with configuration as value
   */
  [templateName: string]: {
    /**
     * Template parameters
     */
    p?: TemplateParam[];
  };
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
   * Optional parameters as array or object
   */
  params?: any[] | object;
  
  /**
   * Raw parameters as string array
   */
  raw?: string[];
  
  /**
   * Loop configuration
   */
  loop?: any[] | string;
  
  /**
   * CSS classes to apply to the component
   */
  classes?: string[];
  
  /**
   * Child components
   */
  children?: (ReskiComponent | TextComponent)[];
  
  /**
   * Component properties
   */
  props?: Record<string, any>;
  
  /**
   * Template configuration
   */
  template?: Template;
  
  /**
   * Whether to hide the component in template mode
   */
  hideComp?: boolean;
  
  /**
   * Dynamic data for the component
   */
  data?: Record<string, any>;
}

/**
 * Converts a Reski component object to its string representation
 * 
 * @param component - The component to convert
 * @param options - Optional configuration
 * @returns The string representation of the component
 * @throws {Error} If the component is invalid
 */
export default function reskify(component: ReskiComponent | TextComponent, options?: ReskifyOptions): string;

/**
 * Helper function to format parameter values for serialization
 * 
 * @param value - The value to format
 * @returns The formatted value as a string
 */
declare function formatParamValue(value: any): string;

/**
 * Helper function to escape strings for JSON serialization
 * 
 * @param str - The string to escape
 * @returns The escaped string
 */
declare function escapeStringForJSON(str: string | any): string;