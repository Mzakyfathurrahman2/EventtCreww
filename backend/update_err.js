const fs = require('fs');
const path = require('path');

const dir = 'src/controllers';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.js')) results.push(file);
    }
  });
  return results;
}

const files = walk(dir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Change async (req, res) to async (req, res, next)
  content = content.replace(/async\s*\(\s*req\s*,\s*res\s*\)\s*=>/g, "async (req, res, next) =>");

  // Replace res.status(500) inside catch blocks with next(error/err)
  // We look for catch (xxx) { ... }
  content = content.replace(/catch\s*\(\s*([a-zA-Z0-9_]+)\s*\)\s*\{([\s\S]*?)\}/g, (match, errName, catchBody) => {
    // If catchBody contains res.status(500) or res.status(error.status || 500)
    let newBody = catchBody.replace(/res\.status\(\s*500\s*\)\.json\([^)]+\);?/g, `next(${errName});`);
    newBody = newBody.replace(/res\.status\(\s*error\.status\s*\|\|\s*500\s*\)\.json\([^)]+\);?/g, `next(${errName});`);
    return `catch (${errName}) {${newBody}}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated', file);
  }
});
