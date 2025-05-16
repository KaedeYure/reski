import React from 'react';

// Component related types
export interface ReskiComponent {
  name: string;
  content?: string;
  dynamic?: string;
  classes?: string[];
  children?: ReskiComponent[];
  props?: Record<string, any>;
  params?: Record<string, any>;
  map?: {
    type: string;
    value: any;
  };
  raw?: Array<{
    type: string;
    value: any;
  }>;
}

// Template related types
export interface ReskiTemplate {
  placeholder?: boolean;
  parameters?: Array<{
    type: string;
    value: any;
  }>;
  definition?: ReskiComponent;
  name?: string;
}

// Parse result type
export interface ReskiParseResult {
  data: Record<string, any>;
  templates: Record<string, ReskiTemplate>;
  layout: ReskiComponent;
}

// Parse options type
export interface ReskiParseOptions {
  restrictOverwrite?: string[];
  debug?: boolean;
  convertTemplatesToDivs?: boolean;
  keepParams?: boolean;
}

// Render component props
export interface RenderProps {
  string: string;
  data?: Record<string, any>;
  parseOptions?: ReskiParseOptions;
}

// Provider props
export interface ReskiProviderProps {
  children: React.ReactNode;
}

// Context value type
export interface ReskiContextValue {
  Render: React.FC<RenderProps>;
  parse: (string: string, initialData?: Record<string, any>, options?: ReskiParseOptions) => ReskiParseResult;
  reskify: (element: React.ReactElement) => string;
}

// Main functions
export function ReskiProvider(props: ReskiProviderProps): JSX.Element;
export function useReski(): ReskiContextValue;

// Default export for Reski
declare const Reski: {
  parse: (string: string, initialData?: Record<string, any>, options?: ReskiParseOptions) => ReskiParseResult;
  reskify: (element: React.ReactElement) => string;
};

export default Reski;