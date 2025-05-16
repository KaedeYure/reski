import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import Reski from '../index';

const ReskiContext = createContext();

const createScopedTw = () => {
  const twindModule = require('twind');
  
  const instance = twindModule.create({
    mode: 'silent',
    preflight: false,
    hash: true,
    theme: {},
  });
  
  return (classString) => {
    try {
      return instance.tw(classString);
    } catch (e) {
      console.warn(`Twind failed to process: ${classString}`, e);
      return classString;
    }
  };
};

let scopedTw = null;

const renderComponent = (component, components) => {
  if (!component) return null;
  
  if (component.name === 'text') {
    return component.content != null ? String(component.content) : null;
  }

  const Component = components[component.name];
  
  if (!Component) {
    console.warn(`Component not found: ${component.name}`);
    return (
      <div style={{ border: '1px dashed red', padding: 8, margin: 4 }}>
        Component "{component.name}" not found
      </div>
    );
  }

  const props = { ...(component.props || {}) };
  
  if (!scopedTw) scopedTw = createScopedTw();
  
  if (component.classes?.length) {
    props.className = component.classes.map(cls => scopedTw(cls)).join(' ');
  }
  
  const children = component.children
    ? component.children.map((child, idx) => (
        <React.Fragment key={idx}>
          {renderComponent(child, components)}
        </React.Fragment>
      ))
    : null;
  
  return <Component {...props}>{children}</Component>;
};

export function ReskiProvider({ children }) {
  const [components, setComponents] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function loadComponents() {
      try {
        const context = require.context('../components', true, /\.jsx$/);
        const map = {};

        context.keys().forEach((file) => {
          const module = context(file);
          const component = module.default || module;
          
          const name = file
            .replace(/^\.\//, '')
            .replace(/\.jsx?$/, '')
            .split('/').pop();
          
          map[name] = component;
        });

        setComponents(map);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load components:', error);
        setLoading(false);
      }
    }

    loadComponents();
  }, []);
  
  const Render = ({ string, data = {}, parseOptions = {} }) => {
    const parsed = useMemo(() => {
      try {
        if (!string) return null;
        
        const options = {
          convertTemplatesToDivs: true,
          keepParams: false,
          debug: false,
          ...parseOptions
        };
        
        return Reski.parse(string, data, options);
      } catch (e) {
        console.error('Parse error:', e);
        return null;
      }
    }, [string, data, parseOptions]);

    if (loading) {
      return (
        <div className="flex h-full w-full justify-center items-center">
          <div className="flex space-x-4 justify-center">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 [animation-delay:150ms]"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75 [animation-delay:300ms]"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-white"></span>
            </span>
          </div>
        </div>
      );
    }

    if (!parsed) {
      return (
        <div className="p-4 text-red-500 border border-red-500 rounded-lg">
          Failed to parse Reski string. Check console for details.
        </div>
      );
    }

    if (!parsed.layout) {
      return (
        <div className="p-4 text-yellow-500 border border-yellow-500 rounded-lg">
          Reski parsed successfully but no layout was found.
        </div>
      );
    }

    return renderComponent(parsed.layout, components);
  };

  const value = useMemo(() => ({
    Render,
    parse: Reski.parse, 
    reskify: Reski.reskify
  }), [components, loading]);

  return <ReskiContext.Provider value={value}>{children}</ReskiContext.Provider>;
}

export function useReski() {
  const context = useContext(ReskiContext);
  if (!context) throw new Error('useReski must be used within ReskiProvider');
  return context;
}