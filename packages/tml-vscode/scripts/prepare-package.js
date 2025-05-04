const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Path to the parser package
let parserPath = path.resolve(__dirname, '../../tml-parser');

// Check if the path exists
if (!fs.existsSync(parserPath)) {
  console.error(`Parser package not found at ${parserPath}`);
  process.exit(1);
}

console.log('Building @tml/parser package...');
try {
  // Build the parser package
  execSync('yarn build', {
    cwd: parserPath,
    stdio: 'inherit'
  });

  console.log('@tml/parser package built successfully');

  // Create node_modules/@tml directory if it doesn't exist
  const tmlModulesDir = path.resolve(__dirname, '../node_modules/@tml');
  if (!fs.existsSync(tmlModulesDir)) {
    fs.mkdirSync(tmlModulesDir, { recursive: true });
  }

  // Copy the parser package files
  const parserDestPath = path.resolve(tmlModulesDir, 'parser');
  if (!fs.existsSync(parserDestPath)) {
    fs.mkdirSync(parserDestPath, { recursive: true });
  }

  // Copy package.json
  const packageJsonSrc = path.resolve(parserPath, 'package.json');
  const packageJsonDest = path.resolve(parserDestPath, 'package.json');
  fs.copyFileSync(packageJsonSrc, packageJsonDest);

  // Create dist directory
  const distDir = path.resolve(parserDestPath, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy dist files
  const srcDistDir = path.resolve(parserPath, 'dist');
  const files = fs.readdirSync(srcDistDir);
  for (const file of files) {
    const srcFile = path.resolve(srcDistDir, file);
    const destFile = path.resolve(distDir, file);
    fs.copyFileSync(srcFile, destFile);
  }

  console.log(`Copied parser package from ${parserPath} to ${parserDestPath}`);

  console.log('Preparation completed successfully');
} catch (error) {
  console.error('Error preparing package:', error);
  process.exit(1);
}
