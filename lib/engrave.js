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
  try {
    return expression.split('.').reduce((obj, prop) => {
      if (obj === undefined || obj === null) return '';
      return obj[prop] !== undefined ? obj[prop] : '';
    }, data);
  } catch (e) {
    console.error(`Error evaluating expression: ${expression}`, e);
    return '';
  }
}