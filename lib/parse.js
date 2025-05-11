import { evaluateExpression } from "./engrave.js";

export default function parse(string, initialData = {}, options = {}) {
  const { restrictOverwrite = ["user", "auth", "token"], debug = false } = options;
  
  string = string.replace(/\r?\n/g, ' ').trim();
  
  let data = { ...initialData };
  const templates = {};
  let layout = null;

  const blocks = parseContent(string);

  for (const piece of blocks.data) {
    const dataResult = parseDataBlock(piece, data, restrictOverwrite, debug);
    if (dataResult && !dataResult.error) {
      data = { ...data, ...dataResult.data };
    }
  }
  
  // First pass: collect all template definitions without processing their contents
  for (const piece of blocks.template) {
    try {
      const nameWithParams = piece.split(':')[0].trim();
      const templateName = nameWithParams.split(/[<({[]/)[0].trim();
      const parameters = extractTemplateParameters(nameWithParams, debug);
      
      // Register the template name first, with a placeholder definition
      templates[templateName] = {
        placeholder: true,
        parameters
      };
    } catch (err) {
      if (debug) {
        console.error(`[Reski Error] Failed to pre-register template: ${err.message}`);
      }
    }
  }
  
  // Second pass: fully process template definitions
  for (const piece of blocks.template) {
    const templateResult = parseTemplateBlock(piece, data, templates, debug);
    if (templateResult && !templateResult.error) {
      templates[templateResult.name] = {
        definition: templateResult.definition,
        parameters: templateResult.parameters
      };
    }
  }
  
  if (blocks.component.length > 0) {
    const lastComponent = blocks.component[blocks.component.length - 1];
    layout = parseComponentBlock(`[${lastComponent}]`, data, templates, debug);
    
    // Process any pending templates that weren't fully resolved during initial parsing
    processPendingTemplates(layout, templates, data, debug);
  }
  
  return {
    data,
    templates,
    layout
  };
}

function parseContent(text) {
  const result = {
    data: [],
    template: [],
    component: []
  };
  
  let i = 0;
  while (i < text.length) {
    while (i < text.length && /\s/.test(text[i])) {
      i++;
    }
    
    if (i >= text.length) break;
    
    if (text.substring(i, i+2) === '=<') {
      const startIndex = i + 2;
      const endIndex = findMatchingDelimiter(text, startIndex, '<', '>');
      
      if (endIndex !== -1) {
        result.data.push(text.substring(startIndex, endIndex).trim());
        i = endIndex + 1;
      } else {
        i++;
      }
    } 
    else if (text.substring(i, i+2) === '=[') {
      const startIndex = i + 2;
      const endIndex = findMatchingDelimiter(text, startIndex, '[', ']');
      
      if (endIndex !== -1) {
        result.template.push(text.substring(startIndex, endIndex).trim());
        i = endIndex + 1;
      } else {
        i++;
      }
    }
    else if (text[i] === '[') {
      const startIndex = i + 1;
      const endIndex = findMatchingDelimiter(text, startIndex, '[', ']');
      
      if (endIndex !== -1) {
        result.component.push(text.substring(startIndex, endIndex).trim());
        i = endIndex + 1;
      } else {
        i++;
      }
    }
    else {
      i++;
    }
  }
  
  return result;
}

function findMatchingDelimiter(text, startIndex, openChar, closeChar) {
  let depth = 1;
  let inQuotes = false;
  let escapeNext = false;
  
  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];
    
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    
    if (char === '\\') {
      escapeNext = true;
      continue;
    }
    
    if (char === '"' && !escapeNext) {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (!inQuotes) {
      if (char === openChar) depth++;
      else if (char === closeChar) {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  
  return -1;
}

function parseDataBlock(block, data, restrictOverwrite, debug) {
  try {
    const dividerIndex = block.indexOf(':');
    
    if (dividerIndex === -1) {
      throw new Error("Invalid data definition: Missing : delimiter between name and value");
    }
    
    const name = block.substring(0, dividerIndex).trim();
    const valueString = block.substring(dividerIndex + 1).trim();
    
    let value;
    try {
      value = JSON.parse(valueString);
      removeUnsafeValues(value);
    } catch (e) {
      throw new Error(`Invalid JSON in data definition for ${name}: ${e.message}`);
    }
    
    const mergedData = { ...data };
    
    if (!restrictOverwrite.includes(name)) {
      mergedData[name] = value;
    } else if (debug) {
      console.log(`[Reski Debug] Skipped restricted data key: ${name}`);
    }
    
    return {
      type: 'dataDefinition',
      name,
      value,
      data: mergedData
    };
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to parse data definition: ${err.message}`);
    }
    return { type: 'dataDefinition', error: err.message };
  }
}

function parseTemplateBlock(block, data, templates, debug) {
  try {
    const template = parseComponentBlock(`[${block}]`, data, templates, debug);
    
    const nameWithParams = block.split(':')[0].trim();
    const templateName = nameWithParams.split(/[<({[]/)[0].trim();
    const parameters = extractTemplateParameters(nameWithParams, debug);
    
    return {
      type: 'templateDefinition',
      name: templateName,
      parameters,
      definition: template
    };
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to parse template definition: ${err.message}`);
    }
    return { type: 'templateDefinition', error: err.message };
  }
}

function parseComponentBlock(block, data, templates, debug) {
  try {
    if (!block.startsWith('[') || !block.endsWith(']')) {
      throw new Error('Invalid component syntax: Must be wrapped in square brackets');
    }

    const content = block.substring(1, block.length - 1);
    
    const parts = safeSplit(content, ':', true);

    if (!parts[0] || parts[0].trim() === '') {
      throw new Error("Missing component name");
    }

    const result = {};

    const nameWithParams = parts[0].trim();
    result.name = nameWithParams.split(/[<({[]/)[0].trim();
    
    if (nameWithParams.includes('<') && nameWithParams.endsWith('>')) {
      const paramMatch = nameWithParams.match(/<([^>]+)>/);
      if (paramMatch) {
        result.raw = paramMatch[1].split(',').map(p => p.trim());
      }
    }

    if (parts.length > 1 && parts[1].trim()) {
      result.classes = parts[1].trim().split('.').filter(Boolean);
    }

    if (parts.length > 2 && parts[2].trim()) {
      result.children = parseChildren(parts[2], data, templates, debug);
    }

    if (parts.length > 3 && parts[3].trim()) {
      result.props = parseProps(parts[3], debug);
    }

    if (result.raw && result.raw.length > 0) {
      processTemplateParams(result, templates, data, debug);
    }
    
    if (result.children && result.children.length > 0) {
      processForEachLoops(result, templates, data, debug);
    }
    
    cleanupEmptyProperties(result);

    return result;
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to parse component: ${err.message}`);
    }
    return { error: err.message };
  }
}

function parseChildren(childString, data, templates, debug) {
  try {
    const children = [];
    const childParts = safeSplit(childString, '.', true);
    
    for (const part of childParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      if (trimmedPart.startsWith('[') && trimmedPart.endsWith(']') && 
        trimmedPart.substring(1, trimmedPart.length - 1).includes('*')) {
        try {
          const forEachConfig = parseForEachConfig(trimmedPart);
          if (forEachConfig) {
            children.push(forEachConfig);
          }
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to parse forEach: ${e.message}`);
          }
        }
        continue;
      }
      
      if (!trimmedPart.startsWith('[') || !trimmedPart.endsWith(']')) {
        continue;
      }
      
      const innerContent = trimmedPart.slice(1, -1);
      let child = null;
      
      if (innerContent.startsWith('"') && innerContent.endsWith('"')) {
        try {
          const textContent = JSON.parse(innerContent);
          child = {
            name: 'text',
            content: textContent
          };
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to parse text content: ${e.message}`);
          }
        }
      }
      else if (innerContent.startsWith('@(') && innerContent.endsWith(')')) {
        try {
          const content = innerContent.slice(2, -1);
          child = {
            name: 'text',
            dynamic: content
          };
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to parse dynamic content: ${e.message}`);
          }
        }
      } 
      else if (innerContent.startsWith('(') && innerContent.endsWith(')')) {
        try {
          const expression = innerContent.slice(1, -1);
          const evaluated = evaluateExpression(expression, data);
          child = {
            name: 'text',
            content: evaluated
          };
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to evaluate expression: ${e.message}`);
          }
        }
      } 
      else {
        try {
          child = parseComponentBlock(trimmedPart, data, templates, debug);
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to parse nested component: ${e.message}`);
          }
        }
      }
      
      if (child) {
        children.push(child);
      }
    }
    
    return children;
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to parse children: ${err.message}`);
    }
    return [];
  }
}

function parseProps(propsString, debug) {
  try {
    if (!propsString.trim()) {
      return {};
    }
    
    let props = {};
    propsString = propsString.trim();
    
    if (propsString.includes('}.{')) {
      const propsParts = safeSplit(propsString, '.', true);
      
      for (const part of propsParts) {
        try {
          const propObj = JSON.parse(part);
          Object.assign(props, propObj);
        } catch (e) {
          if (debug) {
            console.error(`[Reski Error] Failed to parse property object: ${e.message}`);
          }
        }
      }
    } else {
      try {
        props = JSON.parse(propsString);
      } catch (e) {
        if (debug) {
          console.error(`[Reski Error] Failed to parse properties: ${e.message}`);
        }
      }
    }
    
    removeUnsafeValues(props);
    return props;
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to process props: ${err.message}`);
    }
    return {};
  }
}

function parseForEachConfig(forEachString) {
  try {
    if (forEachString.startsWith('[') && forEachString.endsWith(']') && forEachString.includes('*')) {
        forEachString = forEachString.substring(1, forEachString.length - 1);
    }
    const [arrayPart, templatePart] = forEachString.split('*').map(p => p.trim());
    
    if (!arrayPart || !templatePart) {
      throw new Error(`Invalid forEach syntax: ${forEachString}`);
    }
    
    const forEachConfig = {
      type: 'forEach',
      arrayName: '',
      template: templatePart,
      filter: null,
      map: null,
      index: null
    };
    
    if (arrayPart.includes(':')) {
      const [name, indexVar] = arrayPart.split(':');
      forEachConfig.arrayName = name.trim();
      forEachConfig.index = indexVar.trim();
    } 
    else if (arrayPart.includes('->')) {
      const [name, transform] = arrayPart.split('->');
      forEachConfig.arrayName = name.trim();
      forEachConfig.map = transform.trim();
    }
    else if (arrayPart.includes('[') && arrayPart.endsWith(']')) {
      const name = arrayPart.substring(0, arrayPart.indexOf('['));
      const condition = arrayPart.substring(
        arrayPart.indexOf('[') + 1, 
        arrayPart.lastIndexOf(']')
      );
      
      forEachConfig.arrayName = name.trim();
      forEachConfig.filter = condition.trim();
    }
    else {
      forEachConfig.arrayName = arrayPart.trim();
    }
    
    return forEachConfig;
  } catch (err) {
    throw new Error(`Failed to parse forEach configuration: ${err.message}`);
  }
}

function processForEachLoops(component, templates, data, debug) {
  if (!component.children) return;
  
  const newChildren = [];
  
  for (const child of component.children) {
    if (!child) continue;
    
    if (child.type === 'forEach') {
      const renderedItems = renderForEach(child, templates, data, debug);
      if (renderedItems && renderedItems.length) {
        newChildren.push(...renderedItems);
      }
    }
    else {
      if (child.children && child.children.length > 0) {
        processForEachLoops(child, templates, data, debug);
      }
      
      if (child.raw && child.raw.length > 0) {
        processTemplateParams(child, templates, data, debug);
      }
      
      newChildren.push(child);
    }
  }
  
  component.children = newChildren;
}

function renderForEach(forEachConfig, templates, data, debug) {
  try {
    const { arrayName, template, filter, map, index } = forEachConfig;
    
    if (!arrayName || !template) {
      throw new Error("Missing array name or template in forEach");
    }
    
    let array = evaluateExpression(arrayName, data);
    
    if (!Array.isArray(array)) {
      throw new Error(`forEach expression '${arrayName}' did not evaluate to an array`);
    }
    
    if (filter) {
      try {
        array = array.filter((item, idx) => {
          const filterContext = { ...data, item, index: idx };
          return evaluateExpression(filter, filterContext);
        });
      } catch (err) {
        if (debug) {
          console.error(`[Reski Error] Error applying filter: ${err.message}`);
        }
      }
    }
    
    if (map) {
      try {
        array = array.map((item, idx) => {
          const mapContext = { ...data, item, index: idx };
          return evaluateExpression(map, mapContext);
        });
      } catch (err) {
        if (debug) {
          console.error(`[Reski Error] Error applying map: ${err.message}`);
        }
      }
    }
    
    const templateMatch = template.match(/^\[(.*?)\]$/);
    if (!templateMatch) {
      throw new Error(`Invalid template format in forEach: ${template}`);
    }
    
    const templateComponentName = templateMatch[1].split(/[\[{(<]/)[0].trim();
    
    const renderedItems = [];
    for (let i = 0; i < array.length; i++) {
      try {
        const itemValue = array[i];
        
        if (containsFunctions(itemValue)) continue;
        
        const params = { ...itemValue };
        
        if (index) {
          params[index] = i;
        }
        
        renderedItems.push({
          name: templateComponentName,
          params
        });
      } catch (err) {
        if (debug) {
          console.error(`[Reski Error] Error processing forEach item ${i}: ${err.message}`);
        }
      }
    }
    
    return renderedItems;
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Failed to render forEach: ${err.message}`);
    }
    return [];
  }
}

function processTemplateParams(component, templates, data, debug) {
  try {
    const templateName = component.name;
    
    if (!templates[templateName]) {
      // No warning - just early return if template doesn't exist yet
      // It will be processed again during post-processing
      component._pendingTemplate = true;
      return;
    }
    
    const template = templates[templateName];
    
    if (template.placeholder) {
      // Template is pre-registered but not fully processed yet
      component._pendingTemplate = true;
      return;
    }
    
    if (!template.parameters || !Array.isArray(template.parameters) || template.parameters.length === 0) {
      return;
    }
    
    const templateData = {};
    
    for (let i = 0; i < component.raw.length && i < template.parameters.length; i++) {
      const paramDefinition = template.parameters[i];
      const paramValue = component.raw[i];
      
      try {
        const processedValue = processParamValue(paramValue, data, debug);
        
        if (isValidType(processedValue, paramDefinition.type)) {
          templateData[paramDefinition.value] = processedValue;
        } else if (debug) {
          console.error(`[Reski Error] Parameter type mismatch for '${paramDefinition.value}'`);
        }
      } catch (e) {
        if (debug) {
          console.error(`[Reski Error] Failed to process parameter '${paramDefinition.value}': ${e.message}`);
        }
      }
    }
    
    component.params = templateData;
    delete component.raw;
    delete component._pendingTemplate;
  } catch (err) {
    if (debug) {
      console.error(`[Reski Error] Error processing template parameters: ${err.message}`);
    }
  }
}

function processParamValue(paramValue, data, debug) {
  if (!paramValue) return null;
  
  if (paramValue.startsWith('"') || paramValue.startsWith("'")) {
    return paramValue.replace(/^["'](.*)["']$/, '$1');
  } 
  
  if (paramValue.startsWith('[') && paramValue.endsWith(']')) {
    try {
      return JSON.parse(paramValue);
    } catch (e) {
      const varName = paramValue.replace(/^\[|\]$/g, '');
      return evaluateExpression(varName, data);
    }
  } 
  
  if (paramValue.startsWith('{') && paramValue.endsWith('}')) {
    try {
      return JSON.parse(paramValue);
    } catch (e) {
      const varName = paramValue.replace(/^\{|\}$/g, '');
      return evaluateExpression(varName, data);
    }
  }
  
  return evaluateExpression(paramValue, data);
}

function extractTemplateParameters(templateString, debug) {
  const params = [];
  
  if (templateString.includes('<') && templateString.includes('>')) {
    try {
      const match = templateString.match(/<([^>]+)>/);
      if (match) {
        const paramsList = match[1].split(',');
        
        for (const param of paramsList) {
          try {
            const trimmedParam = param.trim();
            
            let type = 'object';
            if (trimmedParam.endsWith('"') || trimmedParam.endsWith("'")) {
              type = 'string';
            } else if (trimmedParam.endsWith("]")) {
              type = 'array';
            }
            
            let value = trimmedParam;
            if (type === 'string') {
              value = trimmedParam.replace(/^["'](.*)["']$/, '$1');
            } else if (type === 'array') {
              value = trimmedParam.replace(/^\[(.*)\]$/, '$1');
            } else if (type === 'object') {
              value = trimmedParam.replace(/^\{(.*)\}$/, '$1');
            }
            
            params.push({ type, value });
          } catch (err) {
            if (debug) {
              console.error(`[Reski Error] Failed to process parameter: ${err.message}`);
            }
          }
        }
      }
    } catch (err) {
      if (debug) {
        console.error(`[Reski Error] Failed to process template parameters: ${err.message}`);
      }
    }
  }
  
  return params;
}

function safeSplit(string, delimiter, respectBrackets = false) {
  try {
    const result = [];
    let current = '';
    let bracketDepth = 0;
    let curlyDepth = 0;
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      
      if (escapeNext) {
        escapeNext = false;
        current += char;
        continue;
      }
      
      if (char === '\\') {
        escapeNext = true;
        current += char;
        continue;
      }
      
      if (char === '"' && !escapeNext) {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }
      
      if (inQuotes) {
        current += char;
        continue;
      }
      
      if (respectBrackets) {
        if (char === '[') bracketDepth++;
        else if (char === ']') bracketDepth--;
        else if (char === '{') curlyDepth++;
        else if (char === '}') curlyDepth--;
      }
      
      if (char === delimiter && 
          (!respectBrackets || (bracketDepth === 0 && curlyDepth === 0)) && 
          !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) result.push(current);
    
    if (respectBrackets && (bracketDepth !== 0 || curlyDepth !== 0)) {
      throw new Error(`Unbalanced brackets: square=${bracketDepth}, curly=${curlyDepth}`);
    }
    
    if (inQuotes) {
      throw new Error('Unclosed quotes detected');
    }
    
    return result;
  } catch (error) {
    if (respectBrackets) {
      return [string];
    }
    return string.split(delimiter);
  }
}

function cleanupEmptyProperties(obj) {
  if (!obj.classes || obj.classes.length === 0) delete obj.classes;
  if (!obj.children || obj.children.length === 0) delete obj.children;
  if (!obj.props || Object.keys(obj.props).length === 0) delete obj.props;
}

function removeUnsafeValues(obj) {
  if (!obj || typeof obj !== 'object') return;
  
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'function') {
      delete obj[key];
    } else if (obj[key] && typeof obj[key] === 'object') {
      if (Array.isArray(obj[key])) {
        obj[key].forEach(item => {
          if (item && typeof item === 'object') {
            removeUnsafeValues(item);
          }
        });
      } else {
        removeUnsafeValues(obj[key]);
      }
    }
  }
}

function containsFunctions(obj) {
  if (!obj || typeof obj !== 'object') return false;
  
  const checkNestedObject = (value) => {
    if (typeof value === 'function') return true;
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (const item of value) {
          if (checkNestedObject(item)) return true;
        }
      } else {
        for (const prop of Object.values(value)) {
          if (checkNestedObject(prop)) return true;
        }
      }
    }
    return false;
  };
  
  return checkNestedObject(obj);
}

function isValidType(value, expectedType) {
  if (expectedType === 'string') return typeof value === 'string';
  if (expectedType === 'array') return Array.isArray(value);
  if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
  return true;
}

function processPendingTemplates(component, templates, data, debug) {
  if (!component || typeof component !== 'object') return;
  
  // Process this component if it has pending templates
  if (component._pendingTemplate && component.raw && component.raw.length > 0) {
    processTemplateParams(component, templates, data, debug);
  }
  
  // Process children
  if (component.children && Array.isArray(component.children)) {
    for (const child of component.children) {
      processPendingTemplates(child, templates, data, debug);
    }
  }
  
  // Process params if it's a template instance
  if (component.params && typeof component.params === 'object') {
    for (const key in component.params) {
      const value = component.params[key];
      if (value && typeof value === 'object') {
        processPendingTemplates(value, templates, data, debug);
      }
    }
  }
  
  return component;
}