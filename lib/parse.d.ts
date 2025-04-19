/**
 * Reski Parser TypeScript Definitions
 */

/**
 * Options for the Reski parser
 */
export interface ReskiParserOptions {
  /** Keys that cannot be overwritten in dynamic data */
  restrictOverwrite?: string[];
  /** Enable detailed debug logging */
  debug?: boolean;
}

/**
 * Parameter type definition for templates
 */
export interface ReskiParameter {
  /** The type of parameter (string, array, object) */
  type: 'string' | 'array' | 'object';
  /** The name or identifier of the parameter */
  value: string;
}

/**
 * Template definition
 */
export interface ReskiTemplate {
  /** The original template object */
  o: ReskiComponent;
  /** Parameter definitions, if any */
  p?: ReskiParameter[];
}

/**
 * Text node in the Reski component tree
 */
export interface ReskiTextNode {
  /** Type identifier for text nodes */
  name: 'text';
  /** Content of the text node */
  content?: any;
  /** Dynamic expression for the text (used in templates) */
  dynamic?: string;
}

/**
 * A Reski Component definition
 */
export interface ReskiComponent {
  /** Component name or tag */
  name: string;
  /** CSS classes (often Tailwind classes) */
  classes?: string[];
  /** Child components */
  children?: (ReskiComponent | ReskiTextNode)[];
  /** Component properties */
  props?: Record<string, any>;
  /** Template definitions */
  template?: Record<string, ReskiTemplate>;
  /** Raw parameters for template instantiation */
  raw?: string[];
  /** Loop parameters for generating multiple components */
  loop?: string | any[];
  /** Flag to hide component when used as template */
  hideComp?: boolean;
  /** Data context for component */
  data?: Record<string, any>;
  /** Parameters for template instantiation */
  params?: Record<string, any>;
}

/**
 * Parse a Reski string into a component object
 * 
 * @param string The Reski markup string to parse
 * @param data Optional data context for expression evaluation
 * @param options Parser options
 * @param isRoot Whether this is the root component (internal use)
 * @param isTemplate Whether this is being parsed as a template (internal use)
 * @returns The parsed Reski component
 */
export default function parse(
  string: string, 
  data?: Record<string, any>, 
  options?: ReskiParserOptions, 
  isRoot?: boolean, 
  isTemplate?: boolean
): ReskiComponent;

/**
 * Helper function to evaluate expressions in the Reski context
 * 
 * @param expression The expression to evaluate
 * @param context The data context for evaluation
 * @returns The evaluated result
 */
export function evaluateExpression(
  expression: string, 
  context: Record<string, any>
): any;