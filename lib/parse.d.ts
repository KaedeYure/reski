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
  /** Convert templates to div elements with data-template attribute */
  convertTemplatesToDivs?: boolean;
  /** Keep params in the output */
  keepParams?: boolean;
}

/**
 * Raw parameter value with type information
 */
export interface RawParameter {
  /** The type of the parameter */
  type: 'string' | 'array' | 'object' | 'boolean' | 'number' | 'any' | 'reference';
  /** The value of the parameter */
  value: any;
}

/**
 * Map configuration for component mapping
 */
export interface MapConfig {
  /** The type of map (array or reference) */
  type: 'array' | 'reference' | 'undefined';
  /** The value to map over */
  value: any;
}

/**
 * Template definition
 */
export interface ReskiTemplate {
  /** The template definition component */
  definition?: ReskiComponent;
  /** Parameter definitions, if any */
  parameters?: RawParameter[];
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
  /** Raw parameters for template instantiation */
  raw?: RawParameter[];
  /** Parameters for template instantiation */
  params?: Record<string, any>;
  /** Map configuration for generating components from arrays */
  map?: MapConfig;
  /** Flag for pending template processing */
  _pendingTemplate?: boolean;
  /** Flag for processed template */
  _processedTemplate?: boolean;
  /** Error information if parsing failed */
  error?: string;
}

/**
 * Data block parsing result
 */
export interface DataBlockResult {
  /** Type identifier for data block results */
  type: 'data';
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
 * Template block parsing result
 */
export interface TemplateBlockResult {
  /** Type identifier for template block results */
  type: 'template';
  /** The name of the defined template */
  name?: string;
  /** The parameter definitions */
  parameters?: RawParameter[];
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
 * Parse a data block
 * 
 * @param block The data block string
 * @param data The current data context
 * @param restrictOverwrite Array of keys that cannot be overwritten
 * @param debug Whether to enable debug logging
 * @returns The parsed data block result
 */
export function parseDataBlock(
  block: string,
  data: Record<string, any>,
  restrictOverwrite: string[],
  debug: boolean
): DataBlockResult;

/**
 * Pre-register templates to handle forward references
 * 
 * @param templateBlocks Array of template block strings
 * @param templates The templates registry
 * @param debug Whether to enable debug logging
 */
export function preRegisterTemplates(
  templateBlocks: string[],
  templates: Record<string, ReskiTemplate>,
  debug: boolean
): void;

/**
 * Parse a template block
 * 
 * @param block The template block string
 * @param data The current data context
 * @param templates The templates registry
 * @param debug Whether to enable debug logging
 * @returns The parsed template block result
 */
export function parseTemplateBlock(
  block: string,
  data: Record<string, any>,
  templates: Record<string, ReskiTemplate>,
  debug: boolean
): TemplateBlockResult;

/**
 * Extract template parameters from a name match
 * 
 * @param name The name match result
 * @param debug Whether to enable debug logging
 * @returns Array of parameter definitions
 */
export function extractTemplateParameters(
  name: RegExpMatchArray,
  debug: boolean
): RawParameter[];

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

/**
 * Check if there are pending templates in a component tree
 * 
 * @param comp The component to check
 * @returns True if there are pending templates
 */
export function checkForPendingTemplates(
  comp: ReskiComponent
): boolean;

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
 * Extract component parameters from a name match
 * 
 * @param nameMatch The name match result
 * @param result The component to update with parameters
 * @param debug Whether to enable debug logging
 */
export function extractComponentParameters(
  nameMatch: RegExpMatchArray,
  result: ReskiComponent,
  debug: boolean
): void;

/**
 * Parse CSS classes from a class string
 * 
 * @param classesStr The class string
 * @returns Array of parsed classes
 */
export function parseClasses(
  classesStr: string
): string[];

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
): (ReskiComponent | ReskiTextNode)[];

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
 * Process components with map and raw configurations
 * 
 * @param components Array of components to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 */
export function processComponentsWithMapAndRaw(
  components: (ReskiComponent | ReskiTextNode)[],
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): void;

/**
 * Process raw parameters in a component
 * 
 * @param component The component to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 */
export function processRaw(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): void;

/**
 * Recursively apply raw parameters to children
 * 
 * @param children Array of child components
 * @param params The parameters to apply
 * @returns Array of processed child components
 */
export function recurseRawParams(
  children: (ReskiComponent | ReskiTextNode)[],
  params: Record<string, any>
): (ReskiComponent | ReskiTextNode)[];

/**
 * Process map configuration in a component
 * 
 * @param component The component to process
 * @param templates The templates registry
 * @param data The current data context
 * @param debug Whether to enable debug logging
 * @returns Array of mapped components
 */
export function processMap(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>,
  data: Record<string, any>,
  debug: boolean
): ReskiComponent[] | null;

/**
 * Recursively apply map parameters to children
 * 
 * @param children Array of child components
 * @param params The parameters to apply
 * @returns Array of processed child components
 */
export function recurseMapParams(
  children: (ReskiComponent | ReskiTextNode)[],
  params: Record<string, any>
): (ReskiComponent | ReskiTextNode)[];

/**
 * Process dynamic values in a component tree
 * 
 * @param component The component to process
 * @param data The current data context
 */
export function processDynamicValues(
  component: ReskiComponent | ReskiTextNode,
  data?: Record<string, any>
): void;

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
 * Remove internal properties from a component tree
 * 
 * @param comp The component to clean up
 */
export function cleanupInternalProps(
  comp: ReskiComponent
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
 * Convert template components to div elements
 * 
 * @param component The component to process
 * @param templates The templates registry
 */
export function convertTemplatesToElements(
  component: ReskiComponent,
  templates: Record<string, ReskiTemplate>
): void;

/**
 * Remove params from a component tree
 * 
 * @param component The component to clean up
 */
export function cleanupParams(
  component: ReskiComponent
): void;

/**
 * Check if a value matches an expected type
 * 
 * @param providedType The provided type
 * @param expectedType The expected type
 * @returns True if the provided type matches the expected type
 */
export function isValidType(
  providedType: any,
  expectedType: string
): boolean;

/**
 * Log a debug message
 * 
 * @param debug Whether debug logging is enabled
 * @param message The message to log
 * @param isError Whether this is an error message
 */
export function logDebug(
  debug: boolean,
  message: string,
  isError?: boolean
): void;