const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Builds and copies a package to the node_modules directory
 * @param {string} packageName - The name of the package (e.g., 'tml-parser')
 * @param {string} packageNamespace - The namespace of the package (e.g., 'parser')
 */
function buildAndCopyPackage(packageName, packageNamespace) {
  // Path to the package
  const packagePath = path.resolve(__dirname, `../../${packageName}`);

  // Check if the path exists
  if (!fs.existsSync(packagePath)) {
    console.error(`Package ${packageName} not found at ${packagePath}`);
    process.exit(1);
  }

  console.log(`Building @typedml/${packageNamespace} package...`);

  // Build the package
  execSync('yarn build', {
    cwd: packagePath,
    stdio: 'inherit'
  });

  console.log(`@typedml/${packageNamespace} package built successfully`);

  // Create node_modules/@typedml directory if it doesn't exist
  const tmlModulesDir = path.resolve(__dirname, '../node_modules/@typedml');
  if (!fs.existsSync(tmlModulesDir)) {
    fs.mkdirSync(tmlModulesDir, { recursive: true });
  }

  // Copy the package files
  const packageDestPath = path.resolve(tmlModulesDir, packageNamespace);
  if (!fs.existsSync(packageDestPath)) {
    fs.mkdirSync(packageDestPath, { recursive: true });
  }

  // Copy package.json
  const packageJsonSrc = path.resolve(packagePath, 'package.json');
  const packageJsonDest = path.resolve(packageDestPath, 'package.json');
  fs.copyFileSync(packageJsonSrc, packageJsonDest);

  // Create dist directory
  const distDir = path.resolve(packageDestPath, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  // Copy dist files
  const srcDistDir = path.resolve(packagePath, 'dist');
  const files = fs.readdirSync(srcDistDir);
  for (const file of files) {
    const srcFile = path.resolve(srcDistDir, file);
    const destFile = path.resolve(distDir, file);

    // Skip if not a regular file (e.g., socket, directory)
    try {
      const stats = fs.statSync(srcFile);
      if (stats.isFile()) {
        fs.copyFileSync(srcFile, destFile);
      } else {
        console.log(`Skipping non-file: ${srcFile}`);
      }
    } catch (err) {
      console.warn(`Warning: Could not copy ${srcFile}: ${err.message}`);
    }
  }

  console.log(`Copied ${packageName} package from ${packagePath} to ${packageDestPath}`);
}

try {
  // Build and copy the parser package
  buildAndCopyPackage('tml-parser', 'parser');

  // Build and copy the utils package
  buildAndCopyPackage('tml-utils', 'utils');

  console.log('Preparation completed successfully');
} catch (error) {
  console.error('Error preparing package:', error);
  process.exit(1);
}
