export default function parse(string) {
  string = string.replace(/\r?\n/g, ' ');
  if (!string.startsWith('[') || !string.endsWith(']')) {
    throw new Error('Invalid Reski String: Must be wrapped in square brackets');
  }
  
  const content = string.substring(1, string.length - 1);
  const result = {};
  const parts = splitRespectingColons(content);
  
  result.name = parts[0].trim();
  
  if (parts.length > 1 && parts[1].trim()) {
    result.classes = parts[1].split('.').map(c => c.trim()).filter(c => c);
  }
  
  if (parts.length > 2 && parts[2].trim()) {
    result.children = [];
    const childrenParts = splitRespectingBrackets(parts[2], '.');
    
    childrenParts.forEach(part => {
      part = part.trim();
      if (part.startsWith('[') && part.endsWith(']')) {
        const innerContent = part.slice(1, -1);
        
        if (innerContent.startsWith('"') && innerContent.endsWith('"')) {
          try {
            const textContent = JSON.parse(innerContent);
            result.children.push({
              name: 'text',
              content: textContent
            });
          } catch (e) {
            console.error("Failed to parse text content:", innerContent);
          }
        } 
        else if (innerContent.includes(':')) {
          try {
            const nestedComponent = parse(part);
            result.children.push(nestedComponent);
          } catch (e) {
            console.error("Failed to parse nested component:", innerContent);
          }
        }
        else {
          result.children.push({
            name: innerContent
          });
        }
      }
    });
  }
  
  if (parts.length > 3 && parts[3].trim()) {
    result.props = {};
    const propsString = parts[3].trim();
    
    if (propsString.includes('}.{')) {
      const propsParts = splitRespectingBrackets(propsString, '.');
      propsParts.forEach(part => {
        try {
          const propObj = JSON.parse(part);
          Object.assign(result.props, propObj);
        } catch (e) {
          console.error("Failed to parse property:", part);
        }
      });
    } 
    else {
      try {
        const propObj = JSON.parse(propsString);
        result.props = propObj;
      } catch (e) {
        console.error("Failed to parse properties:", propsString);
      }
    }
  }
  
  if (!result.classes || result.classes.length === 0) delete result.classes;
  if (!result.children || result.children.length === 0) delete result.children;
  if (!result.props || Object.keys(result.props).length === 0) delete result.props;
  
  return result;
}

function splitRespectingColons(string) {
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
}

function splitRespectingBrackets(string, delimiter = '.') {
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
}