export default function engrave(input, data = {}) {
  if (typeof input !== 'string') {
    console.error('Input must be a string');
    return input;
  }
  
  if (!input.includes('[(') || !input.includes(')]')) {
    return input;
  }
  
  return input.replace(/\[\(([^)]+)\)\]/g, (match, expression) => {
    return `["${evaluateExpression(expression, data)}"]`;
  });
}

export function evaluateExpression(expression, data) {
  if (!expression || typeof expression !== 'string' || !data) {
    console.warn(`Expression evaluation failed: Invalid input - Expression: "${expression}", Data:`, data);
    return undefined;
  }

  try {
    const path = expression.replace(/\[(\w+)\]/g, '.$1').split('.');
    
    const cleanPath = path.filter(segment => segment.length > 0);
    
    let result = data;
    let lastValidSegment = '';
    
    for (let i = 0; i < cleanPath.length; i++) {
      const segment = cleanPath[i];
      lastValidSegment = segment;
      
      if (result === undefined || result === null) {
        console.warn(`Property access failed: "${expression}" - Path "${cleanPath.slice(0, i).join('.')}" is ${result === null ? 'null' : 'undefined'}`);
        return undefined;
      }
      
      result = result[segment];
    }
    
    if (result === undefined) {
      console.warn(`Property "${lastValidSegment}" in expression "${expression}" is undefined`);
    }
    
    return result;
  } catch (e) {
    console.error(`Error accessing property: ${expression}`, e);
    return undefined;
  }
}