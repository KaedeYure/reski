export default function reskify(input, options = {}) {
  const { debug = false } = options;
  
  try {
    if (input && typeof input === 'object' && input.layout) {
      return reskifyFull(input, options);
    }
    
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
  const { debug = false, restrictOverwrite = ["user", "auth", "token"] } = options;
  
  let result = '';
  
  for (const [name, template] of Object.entries(templates)) {
    if (template.placeholder) continue;
    
    try {
      const templateComp = {
        ...template.definition,
        name
      };
      
      if (template.parameters && template.parameters.length > 0) {
        templateComp.raw = template.parameters;
      }
      
      const templateStr = reskifyComponent(templateComp, options);
      
      result += `=[${templateStr}]\n`;
    } catch (error) {
      if (debug) {
        console.error(`[Reski Error] Failed to reskify template ${name}: ${error.message}`);
      }
    }
  }
  
  for (const [key, value] of Object.entries(data)) {
    if (restrictOverwrite.includes(key)) continue;
    
    try {
      result += `=<${key}:${JSON.stringify(value)}>\n`;
    } catch (error) {
      if (debug) {
        console.error(`[Reski Error] Failed to reskify data ${key}: ${error.message}`);
      }
    }
  }
  
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
  
  while (parts.length > 1 && parts[parts.length - 1] === '') {
    parts.pop();
  }
  
  return `[${parts.join(':')}]`;
}

function formatComponentName(component) {
  let result = component.name;
  
  if (component.raw && Array.isArray(component.raw) && component.raw.length > 0) {
    const paramValues = component.raw.map(param => {
      if (typeof param === 'object' && param !== null) {
        if (param.hasOwnProperty('value')) {
          return formatRawParamValue(param.type, param.value);
        } else {
          return param;
        }
      } else {
        return param;
      }
    });
    
    result += `<${paramValues.join('|-|')}>`;
  }
  else if (component.map && component.map.type !== 'undefined') {
    if (component.map.type === 'reference') {
      result += `[${component.map.value}]`;
    } else if (component.map.type === 'array') {
      result += `[${JSON.stringify(component.map.value)}]`;
    }
  }
  
  return result;
}

function formatRawParamValue(type, value) {
  if (value === null || value === undefined) {
    return 'null';
  }
  
  switch (type) {
    case 'string':
      return `"${escapeString(value)}"`;
    case 'array':
      return JSON.stringify(value);
    case 'object':
      return JSON.stringify(value);
    case 'boolean':
      return value ? 'true' : 'false';
    case 'number':
      return String(value);
    case 'reference':
    case 'any':
    default:
      return value;
  }
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
  
  return component.classes.filter(Boolean).join('.');
}

function formatChildren(component, options) {
  if (!component.children || !Array.isArray(component.children) || component.children.length === 0) {
    return '';
  }
  
  return component.children
    .filter(child => child !== null && child !== undefined)
    .map(child => {
      if (!child) return '';
      
      if (child.name === 'text') {
        return formatTextChild(child);
      } else {
        return reskifyComponent(child, options);
      }
    })
    .filter(Boolean)
    .join('.');
}

function formatTextChild(child) {
  if (child.dynamic !== undefined) {
    return `[@(${child.dynamic})]`;
  } else if (child.content !== undefined) {
    return `["${escapeString(String(child.content))}"]`;
  }
  return '[""]';
}

function formatProps(component) {
  if (!component.props || typeof component.props !== 'object' || Object.keys(component.props).length === 0) {
    return '';
  }
  
  try {
    return JSON.stringify(component.props, (key, value) => {
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
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}