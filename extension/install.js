import { execSync } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isVSCodeInstalled = () => {
  try {
    execSync('code --version', { timeout: 2000, stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
};

const installExtension = () => {
  try {
    const possiblePaths = [
      path.join(__dirname, 'vscode-reski-0.1.0.vsix'),
      path.join(__dirname, 'extension', 'vscode-reski-0.1.0.vsix'),
      path.join(__dirname, 'vscode-reski-0.1.0.vsix'),
      path.join(__dirname, 'dist', 'vscode-reski-0.1.0.vsix')
    ];
    
    let validVsixPath = null;
    for (const vsixPath of possiblePaths) {
      if (existsSync(vsixPath)) {
        validVsixPath = vsixPath;
        break;
      }
    }
    
    if (!validVsixPath) {
      return;
    }
    
    try {
      execSync(`code --uninstall-extension resekai.vscode-reski`, { stdio: 'ignore' });
    } catch (uninstallError) {
      // Silently continue regardless of error
    }

    try {
      execSync(`code --install-extension "${validVsixPath}"`, { stdio: 'ignore' });
    } catch (installError) {
      // Silently fail
    }
  } catch (error) {
    // Silent fail for any other errors
  }
};

if (isVSCodeInstalled()) {
  installExtension();
}