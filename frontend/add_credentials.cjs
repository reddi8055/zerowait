const fs = require('fs');
const path = require('path');

const srcDir = path.join(process.cwd(), 'src');

function findAndReplaceFetch(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findAndReplaceFetch(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Simple regex to find fetch calls that don't have options yet
      // This is rudimentary but works for `fetch('url')` -> `fetch('url', { credentials: 'include' })`
      // For those that already have options, we add credentials: 'include'
      
      content = content.replace(/fetch\(([^,]+)\s*\)/g, 'fetch($1, { credentials: "include" })');
      
      // For fetch with options
      content = content.replace(/fetch\(([^,]+),\s*\{/g, 'fetch($1, { credentials: "include", ');

      fs.writeFileSync(fullPath, content);
    }
  }
}

findAndReplaceFetch(srcDir);
console.log('Done replacing fetch');
