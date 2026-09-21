const fs = require('fs');
let content = fs.readFileSync('src/i18n/translations.ts', 'utf-8');

// Remove from JSON objects
content = content.replace(/\s*"removeWatermark":\s*"[^"]+",?/g, '');
content = content.replace(/\s*"watermarkFree":\s*"[^"]+",?/g, '');
content = content.replace(/\s*"watermarkFreeTier":\s*"[^"]+",?/g, '');

fs.writeFileSync('src/i18n/translations.ts', content, 'utf-8');
console.log('Translations cleaned successfully.');
