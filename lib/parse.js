import { evaluateExpression } from "./engrave.js";

export default function parse(string, initialData = {}, options = {}) {
  const { restrictOverwrite = ["user", "auth", "token"], debug = false, convertTemplatesToDivs = true, keepParams = false } = options;
  
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
  
  preRegisterTemplates(blocks.template, templates, debug);
  
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
    
    processPendingTemplates(layout, templates, data, debug);
    
    const maxPassCount = 20;
    let passCount = 0;
    let pendingTemplatesExist = true;
    
    while (pendingTemplatesExist && passCount < maxPassCount) {
      passCount++;
      pendingTemplatesExist = checkForPendingTemplates(layout);
      
      if (pendingTemplatesExist) {
        processPendingTemplates(layout, templates, data, debug);
      }
    }

    if(layout){
      processComponentsWithMapAndRaw(layout.children, templates, data, debug);

      if (convertTemplatesToDivs) {
        convertTemplatesToElements(layout, templates);
      }

      cleanupInternalProps(layout);

      if(!keepParams){
        cleanupParams(layout);
      }
    }
  }
  
  return {
    data,
    templates,
    layout
  };
}

// Content parsing functions
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
  let inSingleQuotes = false;
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
    
    if (char === '"' && !inSingleQuotes && !escapeNext) {
      inQuotes = !inQuotes;
      continue;
    }
    
    if (char === "'" && !inQuotes && !escapeNext) {
      inSingleQuotes = !inSingleQuotes;
      continue;
    }
    
    if (!inQuotes && !inSingleQuotes) {
      if (char === openChar) depth++;
      else if (char === closeChar) {
        depth--;
        if (depth === 0) return i;
      }
    }
  }
  
  return -1;
}

// Data parsing
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
    } else {
      logDebug(debug, `Skipped restricted data key: ${name}`, false);
    }
    
    return {
      type: 'data',
      name,
      value,
      data: mergedData
    };
  } catch (err) {
    logDebug(debug, `Failed to parse data definition: ${err.message}`, true);
    return { type: 'data', error: err.message };
  }
}

// Template functions
function preRegisterTemplates(templateBlocks, templates, debug) {
  for (const piece of templateBlocks) {
    try {
      const templateParts = piece.split(':', 1);
      if (templateParts.length === 0) continue;
      
      const nameWithParams = templateParts[0].trim();
      const templateNameMatch = nameWithParams.match(/^([^\s<({[]+)/);
      
      if (!templateNameMatch) continue;
      
      const templateName = templateNameMatch[1].trim();
      const parameters = extractTemplateParameters(nameWithParams, debug);
      
      templates[templateName] = {
        placeholder: true,
        parameters
      };
    } catch (err) {
      logDebug(debug, `Failed to pre-register template: ${err.message}`);
    }
  }
}

function parseTemplateBlock(block, data, templates, debug) {
  try {
    const templateParts = block.split(':', 1);
    if (templateParts.length === 0) {
      throw new Error("Invalid template format: Missing component name");
    }
    
    const nameWithParams = templateParts[0].trim();
    const templateNameMatch = nameWithParams.match(/^([^\s<({[]+)([\<\(\{\[])(.+)([\>\)\}\]])$/);
    
    if (!templateNameMatch) {
      throw new Error("Invalid template format: Could not extract template name");
    }
    
    const templateName = templateNameMatch[1].trim();
    const parameters = extractTemplateParameters(templateNameMatch, debug);

    const restOfBlock = block.substring(templateParts[0].length);
    const modifiedBlock = `${templateName}${restOfBlock}`;
    
    const template = parseComponentBlock(`[${modifiedBlock}]`, data, templates, debug);
    
    if (template.error) {
      throw new Error(`Failed to parse template: ${template.error}`);
    }
    
    return {
      type: 'template',
      name: templateName,
      parameters,
      definition: template
    };
  } catch (err) {
    logDebug(debug, `Failed to parse template definition: ${err.message}`, true);
    return { type: 'template', error: err.message };
  }
}

function extractTemplateParameters(name, debug) {
  const params = [];
  
  if(name[2]?.trim() === "<" && name[4]?.trim() === ">") {
    const parameters = name[3].trim().includes('|-|') 
      ? name[3].trim().split('|-|') 
      : [name[3].trim()];
    
    for (const param of parameters) {
      try {
        const trimmedParam = param.trim();
        
        let type = 'any';
        let value = trimmedParam;

        if ((trimmedParam.startsWith('"') && trimmedParam.endsWith('"')) || 
            (trimmedParam.startsWith("'") && trimmedParam.endsWith("'"))) {
          type = 'string';
          value = trimmedParam.substring(1, trimmedParam.length - 1);
        } else if (trimmedParam.startsWith('[') && trimmedParam.endsWith(']')) {
          type = 'array';
          value = trimmedParam.substring(1, trimmedParam.length - 1);
        } else if (trimmedParam.startsWith('{') && trimmedParam.endsWith('}')) {
          type = 'object';
          value = trimmedParam.substring(1, trimmedParam.length - 1);
        } else if (trimmedParam === 'true' || trimmedParam === 'false') {
          type = 'boolean';
        } else if (!isNaN(Number(trimmedParam))) {
          type = 'number';
        }
        
        params.push({ type, value });
      } catch (err) {
        logDebug(debug, `Parameter error: ${err.message}`);
      }
    }
  }
  
  return params;
}

function processPendingTemplates(component, templates, data, debug) {
  if (!component || typeof component !== 'object') return;

  if (component._pendingTemplate && component.name && templates[component.name]) {
    if (component.params && Object.keys(component.params).length > 0) {
      delete component._pendingTemplate;
    }
  }

  if (component.children && Array.isArray(component.children)) {
    for (let i = 0; i < component.children.length; i++) {
      const child = component.children[i];

      if (!child || typeof child !== 'object') continue;
      
      processPendingTemplates(child, templates, data, debug);

      if (child.name && templates[child.name] && templates[child.name].definition && !child._processedTemplate) {
        child._processedTemplate = true;
        const childContext = { ...data };
        
        if (child.params) {
          Object.assign(childContext, child.params);
        }

        const templateDef = JSON.parse(JSON.stringify(templates[child.name].definition));
        
        if (templateDef.children) {
          for (const templateChild of templateDef.children) {
            processPendingTemplates(templateChild, templates, childContext, debug);
          }
          
          child.children = templateDef.children;
        }
        
        if (templateDef.props) {
          child.props = templateDef.props;
        }
        
        if (templateDef.classes) {
          child.classes = templateDef.classes;
        }
        
        delete child._pendingTemplate;
      }
    }
  }

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

function checkForPendingTemplates(comp) {
  if (!comp || typeof comp !== 'object') return false;
  
  if (comp._pendingTemplate) {
    return true;
  }
  
  if (comp.children && Array.isArray(comp.children)) {
    for (const child of comp.children) {
      if (checkForPendingTemplates(child)) {
        return true;
      }
    }
  }
  
  return false;
}

// Component parsing
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
    const nameMatch = nameWithParams.match(/^([^\s<({[]+)(?:([\<\(\{\[])(.+)([\>\)\}\]]))?$/);
    
    if (!nameMatch) {
      throw new Error("Invalid component format: Could not extract component name");
    }
    
    result.name = nameMatch[1].trim();
    
    if(nameMatch[3]) extractComponentParameters(nameMatch, result, debug);

    if (parts.length > 1 && parts[1].trim()) {
      result.classes = parseClasses(parts[1].trim());
    }

    if (parts.length > 2 && parts[2].trim()) {
      result.children = parseChildren(parts[2], data, templates, debug);
    }

    if (parts.length > 3 && parts[3].trim()) {
      result.props = parseProps(parts[3], debug);
    }
    
    cleanupEmptyProperties(result);

    return result;
  } catch (err) {
    logDebug(debug, `Failed to parse component: ${err.message}`, true);
    return { error: err.message };
  }
}

function extractComponentParameters(nameMatch, result, debug) {
  try {
    const openBracket = nameMatch[2];
    const paramContent = nameMatch[3].trim();
    const closeBracket = nameMatch[4];
    
    if (openBracket === "<" && closeBracket === ">") {
      const raw = [];

      const parameters = paramContent.includes('|-|') 
        ? paramContent.split('|-|') 
        : [paramContent];
      
      for (const param of parameters) {
        try {
          const trimmedParam = param.trim();
          
          let type = 'reference';
          let value = trimmedParam;

          if ((trimmedParam.startsWith('"') && trimmedParam.endsWith('"')) || 
              (trimmedParam.startsWith("'") && trimmedParam.endsWith("'"))) {
            type = 'string';
            value = trimmedParam.substring(1, trimmedParam.length - 1);
          } else if (trimmedParam.startsWith('[') && trimmedParam.endsWith(']')) {
            type = 'array';
            try{
              value = JSON.parse(trimmedParam);
            } catch {
              logDebug(debug, `Provided data is not a properly formatted array! \n ${trimmedParam}`, true);
            }
          } else if (trimmedParam.startsWith('{') && trimmedParam.endsWith('}')) {
            type = 'object';
            try{
              value = JSON.parse(trimmedParam);
            } catch (e){
              logDebug(debug, `Provided data is not a properly formatted object! \n ${trimmedParam}`, true);
            }
          } else if (trimmedParam === 'true' || trimmedParam === 'false') {
            type = 'boolean';
            value = trimmedParam === 'true';
          } else if (!isNaN(Number(trimmedParam))) {
            type = 'number';
            value = Number(trimmedParam);
          }
          
          raw.push({ type, value });
          result.raw = raw;
        } catch (err) {
          logDebug(debug, `Parameter error: ${err.message}`);
        }
      }
    } else if(openBracket === "[" && closeBracket === "]") {
      let type = 'undefined';
      let value = 'undefined';
      try{
        value = JSON.parse(paramContent)
        type = 'array';
      } catch {
        type = 'reference'
        value = paramContent;
      }
      result.map = {type, value};
    }
  } catch (err) {
    logDebug(debug, `Failed to extract component parameters: ${err.message}`, true);
  }
}

function parseClasses(classesStr) {
  return classesStr
    .replace(/([a-zA-Z0-9_-]+)=/g, '$1:')
    .replace(/\|([^|]+)\|/g, '[$1]')
    .split('.')
    .map(c => c.trim())
    .filter(Boolean)
    .map(c => c.replace(/,/g, "."));
}

function parseChildren(childString, data, templates, debug) {
  try {
    const children = [];
    const childParts = safeSplit(childString, '.', true);
    
    for (const part of childParts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      if (!trimmedPart.startsWith('[') || !trimmedPart.endsWith(']')) {
        logDebug(debug, `Skipping invalid child syntax: ${trimmedPart}`, false);
        continue;
      }
      
      const innerContent = trimmedPart.slice(1, -1);
      let child = null;
      
      if ((innerContent.startsWith('"') && innerContent.endsWith('"')) ||
          (innerContent.startsWith("'") && innerContent.endsWith("'"))) {
        try {
          const textContent = JSON.parse(innerContent);
          child = {
            name: 'text',
            content: textContent
          };
        } catch (e) {
          try {
            if (innerContent.startsWith("'") && innerContent.endsWith("'")) {
              const textContent = innerContent.slice(1, -1);
              child = {
                name: 'text',
                content: textContent
              };
            } else {
              logDebug(debug, `Failed to parse text content: ${e.message}`, false);
            }
          } catch (e2) {
            logDebug(debug, `Failed to parse text content with single quotes: ${e2.message}`, false);
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
          logDebug(debug, `Failed to parse dynamic content: ${e.message}`, false);
        }
      } 
      else if (innerContent.startsWith('(') && innerContent.endsWith(')')) {
        try {
          const expression = innerContent.slice(1, -1);
          let evaluated;
          
          try {
            evaluated = evaluateExpression(expression, data);
          } catch (evalError) {
            logDebug(debug, `Failed to evaluate expression "${expression}": ${evalError.message}`, true);
            evaluated = '';
          }
          
          child = {
            name: 'text',
            content: evaluated
          };
        } catch (e) {
          logDebug(debug, `Failed to evaluate expression: ${e.message}`, true);
        }
      } 
      else {
        try {
          child = parseComponentBlock(trimmedPart, data, templates, debug);
        } catch (e) {
          logDebug(debug, `Failed to parse nested component: ${e.message}`, true);
        }
      }
      
      if (child && !child.error) {
        children.push(child);
      } else if (child && child.error) {
        logDebug(debug, `Skipping child with error: ${child.error}`, false);
      }
    }
    
    return children;
  } catch (err) {
    logDebug(debug, `Failed to parse children: ${err.message}`, true);
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
          const trimmedPart = part.trim();
          if (!trimmedPart) continue;
          
          const propObj = JSON.parse(trimmedPart);
          Object.assign(props, propObj);
        } catch (e) {
          logDebug(debug, `Failed to parse property object: ${e.message}`, false);
        }
      }
    } else {
      try {
        props = JSON.parse(propsString);
      } catch (e) {
        logDebug(debug, `Failed to parse properties: ${e.message}`, true);
      }
    }
    
    removeUnsafeValues(props);
    return props;
  } catch (err) {
    logDebug(debug, `Failed to process props: ${err.message}`, true);
    return {};
  }
}

// Processing functions
function processComponentsWithMapAndRaw(components, templates, data, debug) {
  if (!Array.isArray(components)) return;
  
  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    
    if (component.children && component.children.length > 0) {
      processComponentsWithMapAndRaw(component.children, templates, data, debug);
    }
    
    if (component.map && component.map.type !== 'undefined') {
      const mappedComponents = processMap(component, templates, data, debug);
      
      if (mappedComponents && mappedComponents.length > 0) {
        components.splice(i, 1, ...mappedComponents);
        i += mappedComponents.length - 1;
      } else {
        delete component.map;
      }
    }
    if (component.raw) {
      processRaw(component, templates, data, debug);
    }
  }
}

function processRaw(component, templates, data, debug) {
  try {
    const templateName = component.name;
    const template = templates[templateName];
    
    if (!template) {
      logDebug(debug, `Template not found for component: ${templateName}`, false);
      return;
    }
    
    const finalParams = {};

    if (!component.raw || !Array.isArray(component.raw)) {
      logDebug(debug, `Raw parameters missing for component: ${templateName}`, false);
      return;
    }

    for (let i = 0; i < component.raw.length && i < template.parameters.length; i++) {
      const paramDefinition = template.parameters[i];
      const paramValue = component.raw[i];

      try {
        const paramType = typeof paramValue === 'object' && paramValue.type ? paramValue.type : typeof paramValue;
        const paramContent = typeof paramValue === 'object' && paramValue.value !== undefined ? paramValue.value : paramValue;

        if (paramDefinition && paramDefinition.value) {
          if (isValidType(paramType, paramDefinition.type)) {
            finalParams[paramDefinition.value] = paramContent;
          } else {
            logDebug(debug, `Parameter type mismatch for '${paramDefinition.value}'`, false);
          }
        }
      } catch (e) {
        logDebug(debug, `Failed to process parameter: ${e.message}`, true);
      }
    }

    component.params = finalParams;
    delete component.raw;
    
    if (component.children && Array.isArray(component.children)) {
      component.children = recurseRawParams(component.children, finalParams);
    }
  } catch (err) {
    logDebug(debug, `Error processing raw parameters: ${err.message}`, true);
  }
}

function recurseRawParams(children, params) {
  return children.map(c => {
    const nest = {...c, params};
    
    if (nest.children) {
      nest.children = recurseRawParams(nest.children, nest.params);
    }
    
    return nest;
  });
}

function processMap(component, templates, data, debug) {
  let array = [];
  if (component.map.type == 'reference') {
    array = evaluateExpression(component.map.value, data);
  } else if (component.map.type == 'array') {
    array = component.map.value;
  }

  if(!Array.isArray(array)) {
    console.warn(`The array provided for ${component.name} is invalid!`);
    return null;
  }

  const template = templates[component.name];
  
  if (!template || !template.parameters || template.parameters.length === 0) {
    logDebug(debug, `Template ${component.name} not found or has no parameters for map operation`, true);
    return null;
  }

  const paramName = template.parameters[0].value

  if(!paramName) return console.warn("Please add a parameter to your template if you want to use maps!");

  return array.map(item => {
    const childs = component.children ? recurseMapParams(JSON.parse(JSON.stringify(component.children)), { [paramName]: item }) : [];
    const comp = {
      name: component.name,
      children: childs,
      params: { [paramName]: item }
    };
    return comp;
  });
}

function recurseMapParams(children, params) {
  return children.map(c => {
    const nest = {...c, params};
    
    if (nest.name == 'text' && nest.dynamic) {
      try {
        nest.content = evaluateExpression(nest.dynamic, params);
      } catch (error) {
        console.error(`Failed to evaluate dynamic expression "${nest.dynamic}":`, error);
        nest.content = '';
      }
    }

    if(nest.content) delete nest.dynamic;

    if(nest.children) {
      nest.children = recurseMapParams(nest.children, nest.params);
    }
    return nest;
  });
}

// Utility functions
function safeSplit(string, delimiter, respectBrackets = false) {
  try {
    const result = [];
    let current = '';
    let squareBracketDepth = 0;
    let curlyBracketDepth = 0;
    let roundBracketDepth = 0;
    let angleBracketDepth = 0;
    let inQuotes = false;
    let inSingleQuotes = false;
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
      
      if (char === '"' && !inSingleQuotes) {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }
      
      if (char === "'" && !inQuotes) {
        inSingleQuotes = !inSingleQuotes;
        current += char;
        continue;
      }
      
      if (!inQuotes && !inSingleQuotes) {
        if (respectBrackets) {
          if (char === '[') squareBracketDepth++;
          else if (char === ']') squareBracketDepth--;
          else if (char === '{') curlyBracketDepth++;
          else if (char === '}') curlyBracketDepth--;
          else if (char === '(') roundBracketDepth++;
          else if (char === ')') roundBracketDepth--;
          else if (char === '<') angleBracketDepth++;
          else if (char === '>') angleBracketDepth--;
        }
        
        if (char === delimiter && 
            (!respectBrackets || 
             (squareBracketDepth === 0 && 
              curlyBracketDepth === 0 && 
              roundBracketDepth === 0 &&
              angleBracketDepth === 0)) && 
            !inQuotes && 
            !inSingleQuotes) {
          result.push(current);
          current = '';
          continue;
        }
      }
      
      current += char;
    }
    
    if (current) result.push(current);
    
    if (respectBrackets && 
        (squareBracketDepth !== 0 || 
         curlyBracketDepth !== 0 || 
         roundBracketDepth !== 0 ||
         angleBracketDepth !== 0)) {
      throw new Error(`Unbalanced brackets: square=${squareBracketDepth}, curly=${curlyBracketDepth}, round=${roundBracketDepth}, angle=${angleBracketDepth}`);
    }
    
    if (inQuotes) {
      throw new Error('Unclosed double quotes detected');
    }
    
    if (inSingleQuotes) {
      throw new Error('Unclosed single quotes detected');
    }
    
    return result;
  } catch (error) {
    return respectBrackets ? [string] : string.split(delimiter);
  }
}

function cleanupEmptyProperties(obj) {
  if (!obj.classes || obj.classes.length === 0) delete obj.classes;
  if (!obj.children || obj.children.length === 0) delete obj.children;
  if (!obj.props || Object.keys(obj.props).length === 0) delete obj.props;
  if (!obj.params || Object.keys(obj.params).length === 0) delete obj.params;
  if (!obj.raw || obj.raw.length === 0) delete obj.raw;
}

function cleanupInternalProps(comp) {
  if (!comp || typeof comp !== 'object') return;
  
  delete comp._pendingTemplate;
  delete comp._processedTemplate;
  
  if (comp.children && Array.isArray(comp.children)) {
    for (const child of comp.children) {
      cleanupInternalProps(child);
    }
  }
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

function convertTemplatesToElements(component, templates) {
  if (!component || typeof component !== 'object') return;
  
  if (component.name && templates[component.name]) {
    if (!component.props) component.props = {};
    component.props['data-template'] = component.name;
    component.name = 'div';
  }
  if (component.children && Array.isArray(component.children)) {
    for (const child of component.children) {
      convertTemplatesToElements(child, templates);
    }
  }
}
function cleanupParams(component) {
  if (!component || typeof component !== 'object') return;

  delete component.params;

  if (component.children && Array.isArray(component.children)) {
    for (const child of component.children) {
      cleanupParams(child);
    }
  }
}

function isValidType(providedType, expectedType) {
  if (providedType === null || providedType === undefined) return true;
  
  if (typeof providedType === 'string') {
    return providedType === expectedType || expectedType === 'any';
  }
  
  switch (expectedType) {
    case 'string': return typeof providedType === 'string';
    case 'array': return Array.isArray(providedType);
    case 'object': return typeof providedType === 'object' && !Array.isArray(providedType);
    case 'number': return typeof providedType === 'number' && !isNaN(providedType);
    case 'boolean': return typeof providedType === 'boolean';
    case 'any': return true;
    default: return true;
  }
}

function logDebug(debug, message, isError = false) {
  if (!debug) return;
  
  const prefix = isError ? '[Reski Error]' : '[Reski Debug]';
  const logMethod = isError ? console.error : console.log;
  logMethod(`${prefix} ${message}`);
}