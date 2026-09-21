import fs from 'fs';
import path from 'path';

const tsxPath = path.resolve('src/components/ARCameraView.tsx');
let tsxContent = fs.readFileSync(tsxPath, 'utf8');

tsxContent = tsxContent.replace(/style=\{\{ flex: '1, ([^}]+)'' \}\}/g, (match, p1) => {
  return `style={{ flex: 1, ${p1} }}`;
});

tsxContent = tsxContent.replace(/style=\{\{ fontSize: ''([^}]+)' \}\}/g, (match, p1) => {
  return `style={{ fontSize: '${p1} }}`;
});

fs.writeFileSync(tsxPath, tsxContent, 'utf8');
console.log('Fixed syntax errors.');
