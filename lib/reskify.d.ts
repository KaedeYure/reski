/**
 * Options for the reskify function
 */
export interface ReskifyOptions {
  /** Enable detailed debug logging */
  debug?: boolean;
  /** Keys that cannot be overwritten in dynamic data */
  restrictOverwrite?: string[];
}

/**
 * Convert a Reski component or parse result back to a Reski markup string
 * 
 * @param input The Reski component or parse result to convert
 * @param options Options for the conversion process
 * @returns The Reski markup string
 */
export default function reskify(
  input: ReskiComponent | ParseResult,
  options?: ReskifyOptions
): string;

/**
 * Convert a full parse result (data, templates, layout) to a Reski markup string
 * 
 * @param parseResult The parse result to convert
 * @param options Options for the conversion process
 * @returns The Reski markup string
 */
export function reskifyFull(
  parseResult: ParseResult,
  options?: ReskifyOptions
): string;

/**
 * Convert a Reski component to a Reski markup string
 * 
 * @param component The component to convert
 * @param options Options for the conversion process
 * @returns The Reski markup string
 */
export function reskifyComponent(
  component: ReskiComponent,
  options?: ReskifyOptions
): string;

/**
 * Format a component name with parameters
 * 
 * @param component The component to format
 * @returns The formatted component name string
 */
export function formatComponentName(
  component: ReskiComponent
): string;

/**
 * Format a raw parameter value based on its type
 * 
 * @param type The type of the parameter
 * @param value The value to format
 * @returns The formatted parameter value string
 */
export function formatRawParamValue(
  type: string,
  value: any
): string;

/**
 * Format a parameter value for inclusion in a Reski markup string
 * 
 * @param value The value to format
 * @returns The formatted parameter value string
 */
export function formatParamValue(
  value: any
): string;

/**
 * Format component classes for inclusion in a Reski markup string
 * 
 * @param component The component containing classes
 * @returns The formatted classes string
 */
export function formatClasses(
  component: ReskiComponent
): string;

/**
 * Format component children for inclusion in a Reski markup string
 * 
 * @param component The component containing children
 * @param options Options for the conversion process
 * @returns The formatted children string
 */
export function formatChildren(
  component: ReskiComponent,
  options?: ReskifyOptions
): string;

/**
 * Format a text child component for inclusion in a Reski markup string
 * 
 * @param child The text child component
 * @returns The formatted text child string
 */
export function formatTextChild(
  child: ReskiTextNode
): string;

/**
 * Format component properties for inclusion in a Reski markup string
 * 
 * @param component The component containing properties
 * @returns The formatted properties string
 */
export function formatProps(
  component: ReskiComponent
): string;

/**
 * Escape special characters in a string for inclusion in a Reski markup string
 * 
 * @param str The string to escape
 * @returns The escaped string
 */
export function escapeString(
  str: string | null | undefined
): string;

/**
 * Interface representing a parse result
 */
export interface ParseResult {
  /** Dynamic data object */
  data?: Record<string, any>;
  /** Template definitions */
  templates?: Record<string, Template>;
  /** Layout component */
  layout?: ReskiComponent | null;
}

/**
 * Interface representing a template
 */
export interface Template {
  /** Template definition */
  definition: Record<string, any>;
  /** Whether this is a placeholder template */
  placeholder?: boolean;
  /** Template parameters */
  parameters?: any[];
}

/**
 * Interface representing a Reski component
 */
export interface ReskiComponent {
  /** Component name */
  name: string;
  /** Component error message */
  error?: string;
  /** Component classes */
  classes?: string[];
  /** Component children */
  children?: (ReskiComponent | ReskiTextNode)[];
  /** Component properties */
  props?: Record<string, any>;
  /** Raw parameters for parameterized components */
  raw?: any[];
  /** Mapping information */
  map?: {
    /** Mapping type */
    type: 'undefined' | 'reference' | 'array';
    /** Mapping value */
    value: any;
  };
}

/**
 * Interface representing a Reski text node
 */
export interface ReskiTextNode {
  /** Component name, always 'text' */
  name: 'text';
  /** Text content */
  content?: string;
  /** Dynamic text content reference */
  dynamic?: string;
}