const fs = require('fs');
const path = require('path');

const sourceDir = '/vercel/share/v0-project/src';
const targetDir = '/vercel/share/v0-next-shadcn/src';

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function copyFilesRecursively(source, target) {
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      ensureDir(targetPath);
      copyFilesRecursively(sourcePath, targetPath);
    } else if (entry.isFile()) {
      try {
        const content = fs.readFileSync(sourcePath, 'utf8');
        fs.writeFileSync(targetPath, content, 'utf8');
        console.log(`Copied: ${entry.name}`);
      } catch (err) {
        console.error(`Error copying ${entry.name}:`, err.message);
      }
    }
  }
}

console.log('Starting bulk file copy...');
ensureDir(targetDir);
copyFilesRecursively(sourceDir, targetDir);
console.log('Bulk copy complete!');
