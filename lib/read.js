import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import parse from './parse.js';

export function readFile(filePath) {
  const normalizedPath = path.normalize(filePath);
  
  try {
    return fs.readFileSync(normalizedPath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(chalk.red(`File not found: '${normalizedPath}'`));
    } else {
      console.error(chalk.red(`Error reading file '${normalizedPath}': ${error.message}`));
    }
    return null;
  }
}

export function readFileAsync(filePath) {
  const normalizedPath = path.normalize(filePath);
  
  return new Promise((resolve) => {
    fs.readFile(normalizedPath, 'utf-8', (err, data) => {
      if (err) {
        if (err.code === 'ENOENT') {
          console.error(chalk.red(`File not found: '${normalizedPath}'`));
        } else {
          console.error(chalk.red(`Error reading file '${normalizedPath}': ${err.message}`));
        }
        resolve(null);
        return;
      }
      
      resolve(data);
    });
  });
}

export function load(filePath) {
  const fileContent = readFile(filePath);
  
  if (!fileContent) {
    return null;
  }
  
  try {
    return parse(fileContent);
  } catch (error) {
    return null;
  }
}