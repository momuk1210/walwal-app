import fs from 'fs';
import path from 'path';

const tsxPath = path.resolve('src/components/ARCameraView.tsx');
let tsxContent = fs.readFileSync(tsxPath, 'utf8');

// Fix flex 1 missing closing quote
tsxContent = tsxContent.replace(/style=\{\{ flex: 1, display: 'flex', alignItems: 'center \}\}/g, "style={{ flex: 1, display: 'flex', alignItems: 'center' }}");

tsxContent = tsxContent.replace(/style=\{\{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px \}\}/g, "style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}");

tsxContent = tsxContent.replace(/style=\{\{ flex: 1, display: 'flex', justifyContent: 'flex-end \}\}/g, "style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}");

// Fix fontSize missing closing quote
tsxContent = tsxContent.replace(/style=\{\{ fontSize: '0.65rem', color: '#333', fontWeight: 800 \}\}/g, "style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800 }}"); // Wait, this one didn't have a missing quote?
// Wait, my regex was /style=\{\{ fontSize: ''([^}]+)' \}\}/g -> style={{ fontSize: '${p1} }}
// For line 1047, original before fix-syntax was: style={{ fontSize: ''0.65rem', color: '#333', fontWeight: 800' }}
// After fix-syntax: style={{ fontSize: '0.65rem', color: '#333', fontWeight: 800 }}
// Wait! If it's `fontWeight: 800 }}`, there is NO missing quote! It's correct!
// Why did the build fail on line 1047 then?
// Let's check line 1047 again.

fs.writeFileSync(tsxPath, tsxContent, 'utf8');
console.log('Fixed flex lines.');
