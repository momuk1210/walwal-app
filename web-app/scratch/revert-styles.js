import fs from 'fs';
import path from 'path';

const tsxPath = path.resolve('src/components/ARCameraView.tsx');
const cssPath = path.resolve('src/styles/ARCameraView.css');

let tsxContent = fs.readFileSync(tsxPath, 'utf8');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// Parse CSS file into a map of className -> style object string
const classMap = {};
const cssBlocks = cssContent.split('}').map(b => b.trim()).filter(Boolean);

cssBlocks.forEach(block => {
  const [selector, rules] = block.split('{');
  if (!selector || !rules) return;
  const className = selector.trim().replace('.', '');
  if (!className.startsWith('ar-style-')) return;

  // Convert rules back to React style object
  const ruleLines = rules.split('\n').map(l => l.trim()).filter(Boolean);

  let isMalformedSingleLine = false;
  let restoredStyleString = '';

  if (ruleLines.length === 1 && ruleLines[0].includes("', ")) {
    isMalformedSingleLine = true;
    // Example: font-size: 0.8rem', fontWeight: 700, color: '#333', lineHeight: 1.35, marginBottom: '4px;
    let line = ruleLines[0];
    if (line.endsWith(';')) line = line.slice(0, -1);
    const colonIdx = line.indexOf(':');
    let prop = line.slice(0, colonIdx).trim();
    // Convert kebab back to camel
    prop = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
    let val = line.slice(colonIdx + 1).trim(); // "0.8rem', fontWeight: ..."
    // The original was `prop: 'val'`
    restoredStyleString = `${prop}: '${val}'`;
  } else {
    // Normal multiline rules
    const styleProps = ruleLines.map(line => {
      let l = line.trim();
      if (l.endsWith(';')) l = l.slice(0, -1);
      const colonIdx = l.indexOf(':');
      if (colonIdx === -1) return '';
      let prop = l.slice(0, colonIdx).trim();
      prop = prop.replace(/-([a-z])/g, g => g[1].toUpperCase());
      let val = l.slice(colonIdx + 1).trim();

      // If it looks like a number, keep it as string if it has units, or maybe just wrap everything in quotes unless it's a number.
      // But in React, strings are quoted. My script stripped quotes!
      // Let's just wrap in single quotes.
      // Wait, what if the original didn't have quotes? Like zIndex: 35. 
      // If it's purely digits, maybe it wasn't quoted. Let's just quote everything, React handles numeric strings in styles fine in most cases, or we can check if it's a pure number.
      if (!isNaN(Number(val))) {
        return `${prop}: ${val}`;
      } else {
        return `${prop}: '${val}'`;
      }
    }).filter(Boolean);
    restoredStyleString = '\n' + styleProps.join(',\n') + '\n';
  }

  classMap[className] = `style={{ ${restoredStyleString} }}`;
});

// Now replace className="ar-style-N" with the style object
for (const [className, styleObj] of Object.entries(classMap)) {
  const regex = new RegExp(`className="${className}"`, 'g');
  tsxContent = tsxContent.replace(regex, styleObj);
  // Also handle the case where we fixed duplicate class name: className="page-root ar-style-1"
  const regex2 = new RegExp(`className="([^"]*)\\b${className}\\b([^"]*)"`, 'g');
  tsxContent = tsxContent.replace(regex2, (match, p1, p2) => {
    let newClass = `${p1}${p2}`.trim();
    if (newClass) {
      return `className="${newClass}" ${styleObj}`;
    } else {
      return styleObj;
    }
  });
}

// Remove the CSS import
tsxContent = tsxContent.replace("import '../styles/ARCameraView.css';\n", "");
tsxContent = tsxContent.replace("import '../styles/ARCameraView.css';", "");

fs.writeFileSync(tsxPath, tsxContent, 'utf8');
console.log('Restoration complete!');
