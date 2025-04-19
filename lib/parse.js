import { evaluateExpression } from "./engrave.js";

export default function parse(string, data = {}, { restrictOverwrite = ["user", "auth"], debug = false } = {}, isRoot = true, isTemplate = false) {
  if (debug) console.log(`[Reski Debug] Parsing string: ${string.substring(0, 50)}${string.length > 50 ? '...' : ''}`);
  
  string = string.replace(/\r?\n/g, ' ').trim();
  validateReskiString(string);
  
  const content = string.substring(1, string.length - 1);
  const result = {};
  const parts = splitRespectingColons(content);
  
  if (debug) console.log(`[Reski Debug] Split parts: ${parts.length} sections found`);

  // [Name:Classes:Childs:Props:Template:DynamicData] (Order-sensitive)
  
  processName(parts, result, debug);
  processClasses(parts, result, debug);
  processChildren(parts, result, data, debug, isTemplate);
  processProps(parts, result, debug);
  processTemplate(parts, result, debug, isRoot);
  processDynamicData(parts, result, data, restrictOverwrite, debug);
  
  cleanupEmptyProperties(result);
  
  if (isRoot) {
    processRootLevelTemplates(result, debug);
    processRootLevelParameters(result, debug);
  }
  
  if (debug) console.log(`[Reski Debug] Finished parsing component: ${result.name}`);
  return result;
}

function validateReskiString(string) {
  if (!string.startsWith('[') || !string.endsWith(']')) {
    throw new Error('Invalid Reski String: Must be wrapped in square brackets');
  }
}

function processName(parts, result, debug) {
  if (!parts[0]) {
    throw new Error("Undefined Reski Component: Reski String component requires a name!");
  }
  
  result.name = parts[0].trim();
  if (debug) console.log(`[Reski Debug] Processing component name: ${result.name}`);

  processNameParameters(result, debug);
  processNameLoops(result, debug);
  
  result.name = result.name.split(/[\[{(<]/)[0];
  if (debug) console.log(`[Reski Debug] Final component name: ${result.name}`);
}

function processNameParameters(result, debug) {
  if (result.name.includes('<') && result.name.endsWith('>')) {
    try {
      const rawMatch = result.name.match(/\<([^)]+)\>/);
      if (!rawMatch) throw new Error(`Invalid parameter format in: ${result.name}`);
      
      result.raw = rawMatch[1].split(',').map(p => p.trim());
      if (debug) console.log(`[Reski Debug] Raw parameters: ${JSON.stringify(result.raw)}`);
      if (!result.raw || result.raw.length === 0) delete result.raw;
    } catch (err) {
      console.error(`[Reski Error] Failed to process parameters: ${err.message}`);
    }
  }
}

function processNameLoops(result, debug) {
  if (result.name.includes('[') && result.name.endsWith(']')) {
    try {
      const loopMatch = result.name.match(/\[([^)]+)\]/);
      if (!loopMatch) throw new Error(`Invalid loop format in: ${result.name}`);
      
      const params = loopMatch[0];
      result.loop = params.includes(',') ? JSON.parse(params) : params;
      if (debug) console.log(`[Reski Debug] Loop parameter: ${JSON.stringify(result.loop)}`);
      if (!result.loop || result.loop.length === 0) delete result.loop;
    } catch (err) {
      console.error(`[Reski Error] Failed to process loop: ${err.message}`);
    }
  }
}

function processClasses(parts, result, debug) {
  if (parts.length <= 1 || !parts[1].trim()) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing classes: ${parts[1]}`);
    result.classes = parts[1]
      .replace(/([a-zA-Z-]+)=/g, '$1:')
      .replace(/\|([^|]+)\|/g, '[$1]')
      .split('.')
      .map(c => c.trim()).filter(Boolean)
      .map(c => c.replace(/\,/g, "."));
    
    if (debug) console.log(`[Reski Debug] Processed ${result.classes.length} classes`);
  } catch (error) {
    console.error(`[Reski Error] Error processing classes: ${error.message}`);
  }
}

function processChildren(parts, result, data, debug, isTemplate) {
  if (parts.length <= 2 || !parts[2].trim()) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing children: ${parts[2].substring(0, 50)}${parts[2].length > 50 ? '...' : ''}`);
    result.children = [];
    const childrenParts = splitRespectingBrackets(parts[2], '.');
    
    if (debug) console.log(`[Reski Debug] Found ${childrenParts.length} child parts`);
    
    childrenParts.forEach((part, index) => {
      part = part.trim();
      if (!part.startsWith('[') || !part.endsWith(']')) {
        if (debug) console.log(`[Reski Debug] Skipping non-bracketed part: ${part}`);
        return;
      }
      
      if (debug) console.log(`[Reski Debug] Processing child ${index + 1}: ${part.substring(0, 30)}${part.length > 30 ? '...' : ''}`);
      const innerContent = part.slice(1, -1);
      
      if (innerContent.startsWith('"') && innerContent.endsWith('"')) {
        processTextChild(result, innerContent, debug);
      }
      else if (innerContent.startsWith('(') && innerContent.endsWith(')')) {
        processDynamicTextChild(result, innerContent, data, debug, isTemplate);
      } 
      else if (innerContent.includes(':')) {
        processNestedComponentChild(result, part, data, debug);
      }
      else {
        processSimpleChild(result, part, data, debug);
      }
    });
  } catch (err) {
    console.error(`[Reski Error] Failed to process children: ${err.message}`);
  }
}

function processTextChild(result, innerContent, debug) {
  try {
    if (debug) console.log(`[Reski Debug] Processing text content`);
    const textContent = JSON.parse(innerContent, false);
    result.children.push({
      name: 'text',
      content: textContent
    });
  } catch (e) {
    console.error(`[Reski Error] Failed to parse text content: ${e.message}`, innerContent);
  }
}

function processDynamicTextChild(result, innerContent, data, debug, isTemplate) {
  if (isTemplate) {
    try {
      if (debug) console.log(`[Reski Debug] Processing template dynamic content`);
      const content = innerContent.slice(1, -1);
      result.children.push({
        name: 'text',
        dynamic: `@(${content})`
      });
    } catch (e) {
      console.error(`[Reski Error] Failed to parse template dynamic content: ${e.message}`);
    }
  } else {
    try {
      if (debug) console.log(`[Reski Debug] Processing dynamic content`);
      const content = innerContent.slice(1, -1);
      const evaluated = evaluateExpression(content, data);
      result.children.push({
        name: 'text',
        content: evaluated
      });
      if (debug) console.log(`[Reski Debug] Evaluated to: ${JSON.stringify(evaluated)}`);
    } catch (e) {
      console.error(`[Reski Error] Failed to evaluate dynamic content: ${e.message}`);
    }
  }
}

function processNestedComponentChild(result, part, data, debug) {
  try {
    if (debug) console.log(`[Reski Debug] Processing nested component with colon`);
    const nestedComponent = parse(part, {}, { debug }, false);
    result.children.push(nestedComponent);
  } catch (e) {
    console.error(`[Reski Error] Failed to parse nested component: ${e.message}`);
  }
}

function processSimpleChild(result, part, data, debug) {
  try {
    if (debug) console.log(`[Reski Debug] Processing simple nested component`);
    result.children.push(parse(part, {}, { debug }, false));
  } catch (e) {
    console.error(`[Reski Error] Failed to parse simple nested component: ${e.message}`);
  }
}

function processProps(parts, result, debug) {
  if (parts.length <= 3 || !parts[3].trim()) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing props: ${parts[3].substring(0, 50)}${parts[3].length > 50 ? '...' : ''}`);
    result.props = {};
    const propsString = parts[3].trim();
    
    if (propsString.includes('}.{')) {
      processMergedProps(result, propsString, debug);
    } else {
      processSingleProps(result, propsString, debug);
    }
    
    checkForFunctions(result.props);
  } catch (err) {
    console.error(`[Reski Error] Error in props processing: ${err.message}`);
  }
}

function processMergedProps(result, propsString, debug) {
  const propsParts = splitRespectingBrackets(propsString, '.');
  if (debug) console.log(`[Reski Debug] Found ${propsParts.length} property parts to merge`);
  
  propsParts.forEach(part => {
    try {
      const propObj = JSON.parse(part);
      if (debug) console.log(`[Reski Debug] Parsed property object with keys: ${Object.keys(propObj).join(', ')}`);
      Object.assign(result.props, propObj);
    } catch (e) {
      console.error(`[Reski Error] Failed to parse property: ${e.message}`, part);
    }
  });
}

function processSingleProps(result, propsString, debug) {
  try {
    result.props = JSON.parse(propsString);
    if (debug) console.log(`[Reski Debug] Parsed props with keys: ${Object.keys(result.props).join(', ')}`);
  } catch (e) {
    console.error(`[Reski Error] Failed to parse properties: ${e.message}`, propsString);
  }
}

function processTemplate(parts, result, debug, isRoot = false) {
  if (parts.length <= 4 || !parts[4].trim()) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing template: ${parts[4].substring(0, 50)}${parts[4].length > 50 ? '...' : ''}`);
    let templateName = parts[4].trim().split(/[\[{(<]/)[0];
    if (debug) console.log(`[Reski Debug] Template name: ${templateName}`);
    
    const params = [];
    processTemplateDeclarations(parts[4], result, debug, isRoot);
    processTemplateParameters(parts[4], params, debug);
    
    const definitionParts = parts.slice(0, 4).map(part => part.trim());
    while (definitionParts.length > 1 && definitionParts[definitionParts.length - 1] === '') { 
      definitionParts.pop();
    }
    
    const cleanDefinition = `[${definitionParts.join(':')}]`;
    if (debug) console.log(`[Reski Debug] Clean template definition: ${cleanDefinition}`);
    
    try {
      const parsedDefinition = parse(cleanDefinition, {}, { debug }, false, true);
      delete parsedDefinition.template;
      
      result.template = {
        [templateName]: { o: parsedDefinition, p: params }
      };
      
      if (debug) console.log(`[Reski Debug] Template defined: ${templateName} with ${params.length} parameters`);

      if (params.length === 0) {
        delete result.template[templateName].p;
        if (debug) console.log(`[Reski Debug] Removed empty parameters from template ${templateName}`);
      }
    } catch (e) {
      console.error(`[Reski Error] Failed to parse template definition: ${e.message}`, cleanDefinition);
      result.template = {};
    }
  } catch (err) {
    console.error(`[Reski Error] Error processing template: ${err.message}`);
  }
}

function processTemplateDeclarations(templateStr, result, debug, isRoot) {
  const hideDeclaration = templateStr[0] == '(' && templateStr[templateStr.length - 1] == ')';
  
  if (hideDeclaration) {
    if (debug) console.log(`[Reski Debug] Hide declaration detected`);
    result.hideComp = true;
    if (isRoot) {
      console.warn("[Reski Warning] Root element can not be hidden when declared as a template.");
      delete result.hideComp;
    }
  }
}

function processTemplateParameters(templateStr, params, debug) {
  const valueParams = (templateStr.includes('<') && templateStr.endsWith('>'));
  const arrayParams = (templateStr.includes('[') && templateStr.endsWith(']'));

  if (valueParams) {
    processValueParameters(templateStr, params, debug);
  }
  
  if (arrayParams) {
    processArrayParameters(templateStr, params, debug);
  }
}

function processValueParameters(templateStr, params, debug) {
  if (debug) console.log(`[Reski Debug] Processing value parameters`);
  templateStr.replace(/\<([^)]+)\>/g, (match, par) => {
    const toPush = par.split(',');
    if (debug) console.log(`[Reski Debug] Found ${toPush.length} value parameters`);
    
    for (const p of toPush) {
      try {
        const is = value => {
          if (value.endsWith('"') || value.endsWith("'")) return 'string';
          if (value.endsWith("]")) return 'array';
          return 'object';
        };
        
        const getCleanValue = (value, type) => {
          if (type === 'string') return value.replace(/^["'](.*)["']$/, '$1');
          if (type === 'array') return value.replace(/^\[(.*)\]$/, '$1');
          if (type === 'object') return value.replace(/^\{(.*)\}$/, '$1');
          return value;
        };
        
        const type = is(p);
        const value = getCleanValue(p.trim(), type);
        
        params.push({type, value});
        if (debug) console.log(`[Reski Debug] Added parameter: ${type} => ${value}`);
      } catch (err) {
        console.error(`[Reski Error] Failed to process value parameter: ${err.message}`);
      }
    }
  });
}

function processArrayParameters(templateStr, params, debug) {
  if (debug) console.log(`[Reski Debug] Processing array parameters`);
  templateStr.replace(/\[([^)]+)\]/g, (match, par) => {
    const paramsParts = par.split(',');
    if (debug) console.log(`[Reski Debug] Found ${paramsParts.length} array parameters`);
    
    paramsParts.forEach(p => {
      try {
        params.push({type: 'array', value: p.trim()});
        if (debug) console.log(`[Reski Debug] Added array parameter: ${p.trim()}`);
      } catch (err) {
        console.error(`[Reski Error] Failed to process array parameter: ${err.message}`);
      }
    });
  });
}

function processDynamicData(parts, result, data, restrictOverwrite, debug) {
  if (parts.length <= 5 || !parts[5].trim()) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing dynamic data: ${parts[5].substring(0, 50)}${parts[5].length > 50 ? '...' : ''}`);
    result.data = { ...data };
    
    const passedData = JSON.parse(parts[5]);
    if (debug) console.log(`[Reski Debug] Parsed data with keys: ${Object.keys(passedData).join(', ')}`);
    
    checkForFunctions(passedData);
    
    Object.keys(passedData).forEach(key => {
      if (!restrictOverwrite.includes(key)) {
        result.data[key] = passedData[key];
        if (debug) console.log(`[Reski Debug] Added data: ${key}`);
      } else if (debug) {
        console.log(`[Reski Debug] Skipped restricted key: ${key}`);
      }
    });
  } catch (err) {
    console.error(`[Reski Error] Failed to process dynamic data: ${err.message}`);
  }
}

function cleanupEmptyProperties(result) {
  if (!result.classes || result.classes.length === 0) delete result.classes;
  if (!result.children || result.children.length === 0) delete result.children;
  if (!result.props || Object.keys(result.props).length === 0) delete result.props;
  if (!result.data || Object.keys(result.data).length === 0) delete result.data;
  if (!result.template || Object.keys(result.template).length === 0) delete result.template;
}

function processRootLevelTemplates(result, debug) {
  if (!result.children) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing root level children and templates`);
    result.children = result.children.filter(Boolean);
    
    for (let i = 0; i < result.children.length; i++) {
      const child = result.children[i];
      
      if (!child.template) continue;
      
      if (debug) console.log(`[Reski Debug] Child ${i} has template definition`);
      
      if (!result.template) {
        result.template = {};
        if (debug) console.log(`[Reski Debug] Created template collection`);
      }
      
      Object.entries(child.template).forEach(([key, value]) => {
        if (result.template[key] && JSON.stringify(result.template[key]) !== JSON.stringify(value)) {
          console.warn(`[Reski Warning] Template '${key}' is being overwritten with a different definition`);
        }
        
        result.template[key] = value;
        if (debug) console.log(`[Reski Debug] Updated template: ${key}`);
      });
      
      if (child.hideComp) {
        if (debug) console.log(`[Reski Debug] Hiding child component ${i}`);
        result.children[i] = null;
      } else {
        if (debug) console.log(`[Reski Debug] Converting child ${i} to template reference`);
        result.children[i] = { name: Object.keys(child.template)[0] };
      }
    }

    result.children = result.children.filter(Boolean);
    if (debug) console.log(`[Reski Debug] After template processing: ${result.children.length} children remain`);
  } catch (err) {
    console.error(`[Reski Error] Error processing templates: ${err.message}`);
  }
}

function processRootLevelParameters(result, debug) {
  if (!result.children) return;
  
  try {
    if (debug) console.log(`[Reski Debug] Processing raw parameters and loops at root level`);
    
    const newChildren = [];
    const toProcess = [...result.children];
    
    for (const child of toProcess) {
      if (child.raw) {
        const renderedComponent = processRawParameters(child, result, debug);
        if (renderedComponent) newChildren.push(renderedComponent);
      } else if (child.loop) {
        const renderedComponents = processLoopConstruct(child, result, debug);
        if (renderedComponents.length) newChildren.push(...renderedComponents);
      } else {
        newChildren.push(child);
      }
    }
    
    result.children = newChildren;
    if (debug) console.log(`[Reski Debug] After parameter and loop processing: ${result.children.length} children remain`);
  } catch (err) {
    console.error(`[Reski Error] Error processing raw parameters and loops: ${err.message}`);
  }
}

function processRawParameters(child, result, debug) {
  try {
    const templateName = child.name;
    if (debug) console.log(`[Reski Debug] Processing raw parameters for ${templateName}`);
    
    if (!result.template || !result.template[templateName]) {
      console.warn(`[Reski Warning] Template '${templateName}' not found`);
      return null;
    }
    
    const template = result.template[templateName];
    
    if (!template.p || !Array.isArray(template.p)) {
      console.warn(`[Reski Warning] Template '${templateName}' doesn't have parameter definitions`);
      return null;
    }
    
    if (debug) console.log(`[Reski Debug] Template ${templateName} has ${template.p.length} parameters, child provides ${child.raw.length}`);
    const templateData = {};
    
    for (let j = 0; j < child.raw.length && j < template.p.length; j++) {
      const paramDefinition = template.p[j];
      const paramValue = child.raw[j];
      
      try {
        if (debug) console.log(`[Reski Debug] Processing parameter ${j}: ${paramValue} (expected type: ${paramDefinition.type})`);
        const processedValue = processParameterValue(paramValue, result.data, debug);
        
        if (validateParameterType(processedValue, paramDefinition.type)) {
          templateData[paramDefinition.value] = processedValue;
          if (debug) console.log(`[Reski Debug] Parameter validated and assigned: ${paramDefinition.value}`);
        } else {
          console.error(`[Reski Error] Parameter type mismatch for '${paramDefinition.value}'. Expected ${paramDefinition.type} but got ${Array.isArray(processedValue) ? 'array' : typeof processedValue}`);
        }
      } catch (e) {
        console.error(`[Reski Error] Failed to process parameter '${paramDefinition.value}': ${e.message}`);
      }
    }
    
    return {
      name: templateName,
      params: templateData
    };
  } catch (err) {
    console.error(`[Reski Error] Error processing raw parameters: ${err.message}`);
    return null;
  }
}

function processParameterValue(paramValue, data, debug) {
  if (paramValue.startsWith('"') || paramValue.startsWith("'")) {
    const processedValue = paramValue.replace(/^["'](.*)["']$/, '$1');
    if (debug) console.log(`[Reski Debug] String parameter: ${processedValue}`);
    return processedValue;
  } 
  
  if (paramValue.startsWith('[') && paramValue.endsWith(']')) {
    return processArrayParameter(paramValue, data, debug);
  } 
  
  if (paramValue.startsWith('{') && paramValue.endsWith('}')) {
    return processObjectParameter(paramValue, data, debug);
  }
  
  const processedValue = evaluateExpression(paramValue, data);
  if (debug) console.log(`[Reski Debug] Evaluated expression: ${paramValue} => ${JSON.stringify(processedValue)}`);
  return processedValue;
}

function processArrayParameter(paramValue, data, debug) {
  const innerContent = paramValue.substring(1, paramValue.length - 1);
  if (innerContent.includes(',') || 
      (innerContent.startsWith('"') && innerContent.endsWith('"')) || 
      (innerContent.match(/^\d+$/) && !innerContent.includes('.')) || 
      (innerContent.startsWith('{') && innerContent.endsWith('}'))) {
    try {
      const processedValue = JSON.parse(paramValue);
      if (debug) console.log(`[Reski Debug] Parsed JSON array: ${JSON.stringify(processedValue)}`);
      return processedValue;
    } catch (e) {
      const varName = paramValue.replace(/^\[|\]$/g, '');
      const processedValue = evaluateExpression(varName, data);
      if (debug) console.log(`[Reski Debug] Evaluated expression: ${varName} => ${JSON.stringify(processedValue)}`);
      return processedValue;
    }
  } else {
    const varName = paramValue.replace(/^\[|\]$/g, '');
    const processedValue = evaluateExpression(varName, data);
    if (debug) console.log(`[Reski Debug] Evaluated variable: ${varName} => ${JSON.stringify(processedValue)}`);
    return processedValue;
  }
}

function processObjectParameter(paramValue, data, debug) {
  try {
    const processedValue = JSON.parse(paramValue);
    if (debug) console.log(`[Reski Debug] Parsed JSON object: ${JSON.stringify(processedValue)}`);
    return processedValue;
  } catch (e) {
    const varName = paramValue.replace(/^\{|\}$/g, '');
    const processedValue = evaluateExpression(varName, data);
    if (debug) console.log(`[Reski Debug] Evaluated object reference: ${varName} => ${JSON.stringify(processedValue)}`);
    return processedValue;
  }
}

function processLoopConstruct(child, result, debug) {
  try {
    if (debug) console.log(`[Reski Debug] Processing loop: ${JSON.stringify(child.loop)}`);
    const arrayValue = child.loop.match(/\[([^)]+)\]/)[1];
    if (debug) console.log(`[Reski Debug] Loop array expression: ${arrayValue}`);

    const array = Array.isArray(child.loop) ? child.loop : evaluateExpression(arrayValue, result.data);
    if (!Array.isArray(array)) {
      throw new Error(`Loop expression did not evaluate to an array: ${arrayValue}`);
    }
    
    if (debug) console.log(`[Reski Debug] Loop array length: ${array.length}`);
    
    const template = child.name.split(/[\[{(<]/)[0];
    if (debug) console.log(`[Reski Debug] Loop template: ${template}`);
    
    const renderedArray = [];
    for (let j = 0; j < array.length; j++) {
      try {
        const values = array[j];
        if (debug) console.log(`[Reski Debug] Processing loop item ${j}: ${JSON.stringify(Object.keys(values))}`);
        
        if (hasNoFunctions(values)) {
          renderedArray.push({
            name: template,
            params: values
          });
        }
      } catch (err) {
        console.error(`[Reski Error] Error processing loop item ${j}: ${err.message}`);
      }
    }
    
    if (debug) console.log(`[Reski Debug] Generated ${renderedArray.length} components from loop`);
    return renderedArray;
  } catch (err) {
    console.error(`[Reski Error] Failed to process loop: ${err.message}`);
    return [];
  }
}

function hasNoFunctions(obj) {
  for (const v of Object.values(obj)) {
    if (typeof v === 'function') {
      console.error(`[Reski Error] Functions can't be rendered through Array Iterations`);
      return false;
    }
  }
  return true;
}

function checkForFunctions(obj) {
  if (!obj || typeof obj !== 'object') return;
  
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'function') {
      console.warn(`[Reski Warning] Can't pass raw function to Reski components: ${k}`);
      delete obj[k];
    } else if (obj[k] && typeof obj[k] === 'object' && !Array.isArray(obj[k])) {
      checkForFunctions(obj[k]);
    } else if (Array.isArray(obj[k])) {
      obj[k].forEach(item => {
        if (item && typeof item === 'object') {
          checkForFunctions(item);
        }
      });
    }
  }
}

function validateParameterType(value, expectedType) {
  try {
    if (expectedType === 'string') return typeof value === 'string';
    if (expectedType === 'array') return Array.isArray(value);
    if (expectedType === 'object') return typeof value === 'object' && value !== null && !Array.isArray(value);
    return true; // Default case - no type specified
  } catch (error) {
    console.error(`[Reski Error] Error in type validation: ${error.message}`);
    return false;
  }
}

function splitRespectingColons(string) {
  try {
    const result = [];
    let current = '';
    let bracketDepth = 0;
    let inQuotes = false;
    
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      
      if (char === '"' && (i === 0 || string[i-1] !== '\\')) {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }
      
      if (!inQuotes) {
        if (char === '[' || char === '{') bracketDepth++;
        else if (char === ']' || char === '}') bracketDepth--;
      }
      
      if (char === ':' && bracketDepth === 0 && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) result.push(current);
    return result;
  } catch (error) {
    console.error(`[Reski Error] Error in splitRespectingColons: ${error.message}`);
    throw error;
  }
}

function splitRespectingBrackets(string, delimiter = '.') {
  try {
    const result = [];
    let current = '';
    let bracketDepth = 0;
    let inQuotes = false;
    
    for (let i = 0; i < string.length; i++) {
      const char = string[i];
      
      if (char === '"' && (i === 0 || string[i-1] !== '\\')) {
        inQuotes = !inQuotes;
        current += char;
        continue;
      }
      
      if (!inQuotes) {
        if (char === '[' || char === '{') bracketDepth++;
        else if (char === ']' || char === '}') bracketDepth--;
      }
      
      if (char === delimiter && bracketDepth === 0 && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    if (current) result.push(current);
    return result;
  } catch (error) {
    console.error(`[Reski Error] Error in splitRespectingBrackets: ${error.message}`);
    throw error;
  }
}