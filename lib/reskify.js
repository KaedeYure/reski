export default function reskify(component, { debug = false } = {}) {
  try {
    if (!component || !component.name) {
      throw new Error('Invalid Reski component: Must have a name property');
    }
    
    const parts = [];
    
    // Part 1: Component Name with optional raw parameters and loop
    let nameSection = component.name;
    
    // Handle params format
    if (component.params) {
      if (Array.isArray(component.params)) {
        // Handle array params case: [Name<[{...},{...}]>]
        nameSection += `<${JSON.stringify(component.params)}>`;
      } else if (typeof component.params === 'object') {
        // Handle object params case: [Name<{"name":"value"}>]
        nameSection += `<${JSON.stringify(component.params)}>`;
      }
    } else if (component.raw && Array.isArray(component.raw) && component.raw.length > 0) {
      const rawParams = component.raw.join(',');
      nameSection += `<${rawParams}>`;
    }
    
    if (component.loop) {
      const loopParam = Array.isArray(component.loop) 
        ? JSON.stringify(component.loop)
        : component.loop;
      nameSection += `[${loopParam}]`;
    }
    
    parts.push(nameSection);
    
    // Part 2: Classes
    if (component.classes && Array.isArray(component.classes) && component.classes.length > 0) {
      const classesString = component.classes
        .map(c => {
          if (c.includes('[') && c.includes(']')) {
            return c.replace(/\[(.*?)\]/g, '|$1|');
          }
          if (c.includes(':')) {
            return c.replace(/([a-zA-Z-]+):/g, '$1=');
          }
          return c;
        })
        .join('.');
      parts.push(classesString);
    } else {
      parts.push('');
    }
    
    // Part 3: Children
    if (component.children && Array.isArray(component.children) && component.children.length > 0) {
      const childrenStrings = component.children.map(child => {
        if (child.name === 'text') {
          if (child.content !== undefined) {
            return `["${escapeStringForJSON(child.content)}"]`;
          } else if (child.dynamic) {
            const dynamicExpression = child.dynamic.replace(/^@\((.*)\)$/, '$1');
            return `[(${dynamicExpression})]`;
          }
          return '[""]';
        } else {
          return reskify(child, { debug });
        }
      });
      
      parts.push(childrenStrings.join('.'));
    } else {
      parts.push('');
    }
    
    // Part 4: Props
    if (component.props && Object.keys(component.props).length > 0) {
      const propsString = JSON.stringify(component.props);
      parts.push(propsString);
    } else {
      parts.push('');
    }
    
    // Part 5: Template
    if (component.template && Object.keys(component.template).length > 0) {
      const templateName = Object.keys(component.template)[0];
      let templateString = templateName;
      
      const templateObj = component.template[templateName];
      
      if (templateObj.p && Array.isArray(templateObj.p) && templateObj.p.length > 0) {
        const paramValues = templateObj.p.map(param => {
          if (param.type === 'string') {
            return `"${param.value}"`;
          } else if (param.type === 'array') {
            return `[${param.value}]`;
          } else {
            return `{${param.value}}`;
          }
        });
        
        templateString += `<${paramValues.join(',')}>`;
      }
      
      if (component.hideComp) {
        templateString = `(${templateString})`;
      }
      
      parts.push(templateString);
    } else {
      parts.push('');
    }
    
    // Part 6: Dynamic Data
    if (component.data && Object.keys(component.data).length > 0) {
      const dataString = JSON.stringify(component.data);
      parts.push(dataString);
    } else {
      parts.push('');
    }
    
    // Trim empty parts from the end
    while (parts.length > 1 && parts[parts.length - 1] === '') {
      parts.pop();
    }
    
    // Combine all parts with colons
    return `[${parts.join(':')}]`;
  } catch (error) {
    console.error(`[Reski Error] Error in reskify function: ${error.message}`);
    throw error;
  }
}

function formatParamValue(value) {
  if (typeof value === 'string') {
    return `"${escapeStringForJSON(value)}"`;
  } else if (Array.isArray(value)) {
    return JSON.stringify(value);
  } else if (value === null || value === undefined) {
    return '""';
  } else if (typeof value === 'object') {
    // For objects, preserve the object format without quotes
    return `{${Object.entries(value).map(([k, v]) => {
      // Handle nested values properly
      let formattedValue = v;
      if (typeof v === 'string') {
        formattedValue = `"${escapeStringForJSON(v)}"`;
      } else if (typeof v === 'object' && v !== null) {
        formattedValue = JSON.stringify(v);
      }
      return `"${k}":${formattedValue}`;
    }).join(',')}}`;
  } else {
    return value.toString();
  }
}

function escapeStringForJSON(str) {
  if (typeof str !== 'string') {
    return String(str);
  }
  
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}