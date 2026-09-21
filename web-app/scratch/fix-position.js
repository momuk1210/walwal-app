import fs from 'fs';
import path from 'path';

const tsxPath = path.resolve('src/components/ARCameraView.tsx');
let tsxContent = fs.readFileSync(tsxPath, 'utf8');

tsxContent = tsxContent.replace(/style=\{\{ position: ''absolute', inset: 0, pointerEvents: 'none', zIndex: 35' \}\}/g, "style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35 }}");

tsxContent = tsxContent.replace(/style=\{\{ position: ''absolute', inset: 0, pointerEvents: 'none', zIndex: 50' \}\}/g, "style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 50 }}");

fs.writeFileSync(tsxPath, tsxContent, 'utf8');
console.log('Fixed position missing quotes.');
