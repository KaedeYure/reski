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
  /** The template definition component */
  definition: ReskiComponent;
  /** Parameter definitions, if any */
  parameters?: ReskiParameter[];
  /** Whether this is a placeholder template (pre-registered but not fully processed) */
  placeholder?: boolean;
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
 * ForEach configuration for generating dynamic component lists
 */
export interface ForEachConfig {
  /** Type identifier for forEach constructs */
  type: 'forEach';
  /** The name of the array to iterate over */
  arrayName: string;
  /** The template to use for rendering each item */
  template: string;
  /** Optional filter expression to filter array items */
  filter: string | null;
  /** Optional map expression to transform array items */
  map: string | null;
  /** Optional variable name to store the current index */
  index: string | null;
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
  children?: (ReskiComponent | ReskiTextNode | ForEachConfig)[];
  /** Component properties */
  props?: Record<string, any>;
  /** Raw parameters for template instantiation */
  raw?: string[];
  /** Parameters for template instantiation */
  params?: Record<string, any>;
  /** Flag for pending template processing */
  _pendingTemplate?: boolean;
  /** Error information if parsing failed */
  error?: string;
}

/**
 * Data definition parsing result
 */
export interface DataDefinitionResult {
  /** Type identifier for data definition results */
  type: 'dataDefinition';
  /** The name of the defined data */
  name?: string;
  /** The value of the defined data */
  value?: any;
  /** The merged data context */
  data?: Record<string, any>;
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Template definition parsing result
 */
export interface TemplateDefinitionResult {
  /** Type identifier for template definition results */
  type: 'templateDefinition';
  /** The name of the defined template */
  name?: string;
  /** The parameter definitions */
  parameters?: ReskiParameter[];
  /** The template definition component */
  definition?: ReskiComponent;
  /** Error message if parsing failed */
  error?: string;
}

/**
 * Result of parsing the Reski markup string
 */
export interface ParseResult {
  /** Parsed data context */
  data: Record<string, any>;
  /** Defined templates */
  templates: Record<string, ReskiTemplate>;
  /** Root component layout */
  layout: ReskiComponent | null;
}

/**
 * Parse a Reski string into a component object
 * 
 * @param string The Reski markup string to parse
 * @param initialData Optional initial data context for expression evaluation
 * @param options Parser options
 * @returns The parsed Reski result containing data, templates, and layout
 */
export default function parse(
  string: string, 
  initialData?: Record<string, any>, 
  options?: ReskiParserOptions
): ParseResult;

/**
 * Parse content blocks from a Reski string
 * 
 * @param text The Reski markup text
 * @returns Object containing arrays of data, template, and component blocks
 */
export function parseContent(
  text: string
): {
  data: string[];
  template: string[];
  component: string[];
};

/**
 * Find the matching closing delimiter for the given opening delimiter
 * 
 * @param text The text to search in
 * @param startIndex The index to start searching from
 * @param openChar The opening delimiter character
 * @param closeChar The closing delimiter character
 * @returns The index of the matching closing delimiter, or -1 if not found
 */
export function findMatchingDelimiter(
  text: string,
  startIndex: number,
  openChar: string,
  closeChar: string
): number;

/**
 * Parse a data definition block
 * 
 * @param block The data block string
 * @param data The current data context
 * @param restrictOverwrite Array of keys that cannot be overwritten
 * @param debug Whether to enable debug logging
 * @returns The parsed data definition result
 */
export function parseDataBlock(
  block: string,
  data: Record<string, any>,
  restrictOverwrite: string[],
  debug: boolean
): DataDefinitionResult;

/**
 * Parse a template definition block
 * 
 * @param block The template block string
 * @param data The current data context
 * @param templates The templates registry
 * @param debug Whether to enable debug logging
 * @returns The parsed template definition result
 */
export function parseTemplateBlock(
  block: string,
  data: Record<string, any>,
  templates: Record<string, ReskiTemplate>,
  debug: boolean
): TemplateDefinitionResult;

/**
 * Parse a component block
 * 
 * @param block The component block string
 * @param data The current data context
 * @param templates The templates registry
 * @param debug Whether to enable debug logging
 * @returns The parsed component
 */
export function parseComponentBlock(
  block: string,
  data: Record<string, any>,
  templates: Record<string, ReskiTemplate>,
  debug: boolean
): ReskiComponent;

/**
 * Parse children from a component children string
 * 
 * @param childString The children string
 * @param data The current data context
 * @param templates The templates registry
 * @param debug Whether to enable debug logging
 * @returns Array of parsed child components
 */
export function parseChildren(
  childString: string,
  data: Record<string, any>,
  templates: Record<string, ReskiTemplate>,
  debug: boolean
): (ReskiComponent | ReskiTextNode | ForEachConfig)[];

/**
 * Parse properties from a component props string
 * 
 * @param propsString The props string
 * @param debug Whether to enable debug logging
 * @returns Object containing component properties
 */
export function parseProps(
  propsString: string,
  debug: boolean
): Record<string, any>;

/**
 * Parse a forEach configuration from a forEach string
 * 
 * @param forEachString The forEach string
 * @returns The parsed forEach configuration
 */
export function parseForEachConfig(
  forEachString: string
): ForEachConfig;

/**
 * Process forEach loops in a component
 * 
 * @param component The component to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 */
export function processForEachLoops(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): void;

/**
 * Render a forEach configuration into an array of components
 * 
 * @param forEachConfig The forEach configuration
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 * @returns Array of rendered components
 */
export function renderForEach(
  forEachConfig: ForEachConfig,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): ReskiComponent[];

/**
 * Process template parameters in a component
 * 
 * @param component The component to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 */
export function processTemplateParams(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): void;

/**
 * Process a parameter value
 * 
 * @param paramValue The parameter value string
 * @param data The current data context
 * @param debug Whether to enable debug logging
 * @returns The processed parameter value
 */
export function processParamValue(
  paramValue: string,
  data: Record<string, any>,
  debug: boolean
): any;

/**
 * Extract template parameters from a template string
 * 
 * @param templateString The template string
 * @param debug Whether to enable debug logging
 * @returns Array of parameter definitions
 */
export function extractTemplateParameters(
  templateString: string,
  debug: boolean
): ReskiParameter[];

/**
 * Split a string by a delimiter, respecting brackets and quotes
 * 
 * @param string The string to split
 * @param delimiter The delimiter character
 * @param respectBrackets Whether to respect brackets when splitting
 * @returns Array of string parts
 */
export function safeSplit(
  string: string,
  delimiter: string,
  respectBrackets?: boolean
): string[];

/**
 * Remove empty properties from a component
 * 
 * @param obj The component to clean up
 */
export function cleanupEmptyProperties(
  obj: ReskiComponent
): void;

/**
 * Remove unsafe values (like functions) from an object
 * 
 * @param obj The object to process
 */
export function removeUnsafeValues(
  obj: Record<string, any>
): void;

/**
 * Check if an object contains functions
 * 
 * @param obj The object to check
 * @returns True if the object contains functions
 */
export function containsFunctions(
  obj: Record<string, any>
): boolean;

/**
 * Check if a value matches an expected type
 * 
 * @param value The value to check
 * @param expectedType The expected type
 * @returns True if the value matches the expected type
 */
export function isValidType(
  value: any,
  expectedType: string
): boolean;

/**
 * Process pending templates in a component tree
 * 
 * @param component The component to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 * @returns The processed component
 */
export function processPendingTemplates(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): ReskiComponent;