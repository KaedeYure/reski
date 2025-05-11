export default function reskify(input, options = {}) {
  const { debug = false } = options;
  
  try {
    // Check if input is a full parse result (with data, templates, layout)
    if (input && typeof input === 'object' && input.layout) {
      return reskifyFull(input, options);
    }
    
    // Handle single component
    return reskifyComponent(input, options);
  } catch (error) {
    if (debug) {
      console.error(`[Reski Error] ${error.message}`);
    }
    throw error;
  }
}

function reskifyFull(parseResult, options = {}) {
  const { data = {}, templates = {}, layout = null } = parseResult;
  const { debug = false } = options;
  
  // Start with an empty string
  let result = '';
  
  // Add template definitions
  for (const [name, template] of Object.entries(templates)) {
    // Skip placeholder templates
    if (template.placeholder) continue;
    
    try {
      // Create a component for this template
      const templateComp = {
        ...template.definition,
        name: name // Ensure template name is correct
      };
      
      // Add parameters if available
      if (template.parameters && template.parameters.length > 0) {
        templateComp.raw = template.parameters.map(p => p.value);
      }
      
      // Reskify this template
      const templateStr = reskifyComponent(templateComp, options);
      
      // Add to result with template prefix
      result += '=' + templateStr + '\n';
    } catch (error) {
      if (debug) {
        console.error(`[Reski Error] Failed to reskify template ${name}: ${error.message}`);
      }
    }
  }
  
  // Add data definitions
  for (const [key, value] of Object.entries(data)) {
    // Skip default or runtime-only data
    if (key === 'user' || key === 'auth' || key === 'token') continue;
    
    try {
      // Add data definition
      result += `=<${key}:${JSON.stringify(value)}>\n`;
    } catch (error) {
      if (debug) {
        console.error(`[Reski Error] Failed to reskify data ${key}: ${error.message}`);
      }
    }
  }
  
  // Add layout component
  if (layout) {
    try {
      result += reskifyComponent(layout, options);
    } catch (error) {
      if (debug) {
        console.error(`[Reski Error] Failed to reskify layout: ${error.message}`);
      }
    }
  }
  
  return result;
}

function reskifyComponent(component, options = {}) {
  const { debug = false } = options;
  
  if (!component || !component.name) {
    throw new Error('Invalid Reski component: Missing name property');
  }
  
  // Handle error components
  if (component.error) {
    if (debug) {
      console.warn(`[Reski Warning] Component has error: ${component.error}`);
    }
    return `[Error::["${escapeString(component.error)}"]]`;
  }
  
  const parts = [
    formatComponentName(component),
    formatClasses(component),
    formatChildren(component, options),
    formatProps(component)
  ];
  
  // Remove empty sections from the end
  while (parts.length > 1 && parts[parts.length - 1] === '') {
    parts.pop();
  }
  
  return `[${parts.join(':')}]`;
}

function formatComponentName(component) {
  let result = component.name;
  
  if (component.params && Object.keys(component.params).length > 0) {
    // Convert params object to an array, preserving order if possible
    const paramValues = Object.values(component.params);
    result += `<${paramValues.map(formatParamValue).join(',')}>`;
  } else if (component.raw && Array.isArray(component.raw) && component.raw.length > 0) {
    result += `<${component.raw.map(formatParamValue).join(',')}>`;
  }
  
  return result;
}

function formatParamValue(value) {
  if (value === null || value === undefined) {
    return 'null';
  } else if (typeof value === 'string') {
    return `"${escapeString(value)}"`;
  } else if (Array.isArray(value)) {
    return JSON.stringify(value);
  } else if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
}

function formatClasses(component) {
  if (!component.classes || !Array.isArray(component.classes) || component.classes.length === 0) {
    return '';
  }
  
  // Filter out any empty class names and join with dots
  return component.classes.filter(Boolean).join('.');
}

function formatChildren(component, options) {
  if (!component.children || !Array.isArray(component.children) || component.children.length === 0) {
    return '';
  }
  
  // Map each child to its string representation and join with dots
  return component.children
    .filter(child => child !== null && child !== undefined)
    .map(child => {
      if (!child) return '';
      
      if (child.name === 'text') {
        return formatTextChild(child);
      } else if (child.type === 'forEach') {
        return formatForEachChild(child, options);
      } else {
        return reskifyComponent(child, options);
      }
    })
    .filter(Boolean)  // Remove any empty strings
    .join('.');
}

function formatTextChild(child) {
  if (child.content !== undefined) {
    // Use straight JSON.stringify for content to handle null/undefined correctly
    return `["${escapeString(String(child.content))}"]`;
  } else if (child.dynamic) {
    return `[@(${child.dynamic})]`;
  } else if (child.expression) {
    // If there's an expression property, format it as a dynamic expression
    return `[(${child.expression})]`;
  }
  return '[""]';
}

function formatForEachChild(child, options) {
  if (!child.arrayName || !child.template) {
    throw new Error('Invalid forEach: Missing arrayName or template');
  }
  
  const arrayPart = formatForEachArray(child);
  const templatePart = child.template;
  
  return `[${arrayPart}*${templatePart}]`;
}

function formatForEachArray(child) {
  let result = child.arrayName.trim();
  
  // Apply modifiers in the correct order
  if (child.index) {
    result += `:${child.index.trim()}`;
  } else if (child.map) {
    result += `->${child.map.trim()}`;
  } else if (child.filter) {
    result += `[${child.filter.trim()}]`;
  }
  
  return result;
}

function formatProps(component) {
  if (!component.props || typeof component.props !== 'object' || Object.keys(component.props).length === 0) {
    return '';
  }
  
  try {
    // Ensure we're handling circular references properly
    return JSON.stringify(component.props, (key, value) => {
      // Handle functions or other non-serializable values
      if (typeof value === 'function') {
        return undefined;
      }
      return value;
    });
  } catch (error) {
    throw new Error(`Failed to stringify props: ${error.message}`);
  }
}

function escapeString(str) {
  if (str === null || str === undefined) {
    return '';
  }
  
  if (typeof str !== 'string') {
    str = String(str);
  }
  
  return str
    .replace(/\\/g, '\\\\')    // Escape backslashes first
    .replace(/"/g, '\\"')      // Escape double quotes
    .replace(/\n/g, '\\n')     // Escape newlines
    .replace(/\r/g, '\\r')     // Escape carriage returns
    .replace(/\t/g, '\\t');    // Escape tabs
}