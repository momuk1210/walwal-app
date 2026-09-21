const fs = require('fs');
const tsCode = fs.readFileSync('e:/workspace/walwal-app/web-app/src/data/breedProfiles.ts', 'utf8');
// Extract BREED_DEFINITIONS JSON array
const jsonStart = tsCode.indexOf('[');
const jsonEnd = tsCode.lastIndexOf(']');
const arrayStr = tsCode.slice(jsonStart, jsonEnd + 1);
// Evaluate safely
const BREED_DEFINITIONS = eval('(' + arrayStr + ')');
module.exports = { BREED_DEFINITIONS };
