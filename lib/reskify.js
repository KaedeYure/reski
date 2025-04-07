export default function reskify(component) {
  if (!component || typeof component !== 'object') {
    throw new Error('Invalid component: Must be an object');
  }

  if (!component.name) {
    throw new Error('Invalid component: Must have a name property');
  }

  let result = '[' + component.name;

  if (component.classes && Array.isArray(component.classes) && component.classes.length > 0) {
    result += ':' + component.classes.join('.');
  } else {
    result += ':';
  }

  if (component.children && Array.isArray(component.children) && component.children.length > 0) {
    result += ':';
    
    const childStrings = component.children.map(child => {
      if (child.name === 'text') {
        return '[' + JSON.stringify(child.content) + ']';
      } else {
        return reskify(child);
      }
    });

    result += childStrings.join('.');
  } else {
    result += ':';
  }

  if (component.props && typeof component.props === 'object' && Object.keys(component.props).length > 0) {
    result += ':';
    
    const propsStr = JSON.stringify(component.props);
    result += propsStr;
  }

  result += ']';
  return result;
}