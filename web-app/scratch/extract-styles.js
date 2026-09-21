import fs from 'fs';
import path from 'path';

const tsxPath = path.resolve('src/components/ARCameraView.tsx');
const cssPath = path.resolve('src/styles/ARCameraView.css');

let tsxContent = fs.readFileSync(tsxPath, 'utf8');

const styleRegex = /style=\{\{([\s\S]*?)\}\}/g;

let match;
let cssContent = '';
let classIndex = 1;

// To handle replacements properly without messing up indices, we can use String.prototype.replace
let newTsxContent = tsxContent.replace(styleRegex, (fullMatch, styleBody) => {
  // Check for dynamic indicators
  if (
    styleBody.includes('?') || 
    styleBody.includes('$') || 
    styleBody.includes('audioLevel') || 
    styleBody.includes('behaviorState') || 
    styleBody.includes('zoomLevel') || 
    styleBody.includes('isCameraLive') ||
    styleBody.includes('bubble') ||
    styleBody.includes('BUBBLE_W') ||
    styleBody.includes('Math.') ||
    styleBody.includes('i % 2') ||
    styleBody.includes('targetDog') ||
    styleBody.includes('isOpen') ||
    styleBody.includes('=>') ||
    styleBody.includes('...') // spread operator like ...(bubbleBelow ? ...)
  ) {
    return fullMatch; // keep inline
  }

  // Convert styleBody (JS object format) to CSS format
  // Example: 
  // background: '#FFFFFF',
  // borderRadius: '100px',
  // ->
  // background: #FFFFFF;
  // border-radius: 100px;
  
  let cssRules = styleBody
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => {
      let trimmed = line.trim();
      if (trimmed.endsWith(',')) trimmed = trimmed.slice(0, -1);
      
      const colonIdx = trimmed.indexOf(':');
      if (colonIdx === -1) return null;
      
      let prop = trimmed.slice(0, colonIdx).trim();
      let val = trimmed.slice(colonIdx + 1).trim();
      
      // Remove quotes from val if it's a string
      if ((val.startsWith("'") && val.endsWith("'")) || (val.startsWith('"') && val.endsWith('"'))) {
        val = val.slice(1, -1);
      }
      
      // Convert camelCase to kebab-case
      prop = prop.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
      
      return `  ${prop}: ${val};`;
    })
    .filter(Boolean)
    .join('\n');

  if (!cssRules) return fullMatch;

  const className = `ar-style-${classIndex++}`;
  
  cssContent += `.${className} {\n${cssRules}\n}\n\n`;
  
  return `className="${className}"`;
});

// We need to add the CSS import to the TSX if it's not there
if (!newTsxContent.includes("import '../styles/ARCameraView.css';")) {
  newTsxContent = newTsxContent.replace(
    "import { OwnerNoteModal } from './OwnerNoteModal';", 
    "import { OwnerNoteModal } from './OwnerNoteModal';\nimport '../styles/ARCameraView.css';"
  );
}

fs.writeFileSync(tsxPath, newTsxContent, 'utf8');

let existingCss = '';
if (fs.existsSync(cssPath)) {
  existingCss = fs.readFileSync(cssPath, 'utf8') + '\n';
}
fs.writeFileSync(cssPath, existingCss + cssContent, 'utf8');

console.log(`Extracted ${classIndex - 1} static styles.`);
