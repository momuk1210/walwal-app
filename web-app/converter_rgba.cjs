const fs = require('fs');

const filepath = "e:/workspace/walwal-app/web-app/src/components/ARCameraView.tsx";
let content = fs.readFileSync(filepath, 'utf-8');

// Replace specific dark rgba backgrounds
const replacements = [
  [/background: 'rgba\(15, 23, 42, 0\.85\)'/g, "background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/background: 'rgba\(13, 17, 23, 0\.97\)'/g, "background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/background: 'rgba\(20, 24, 33, 0\.94\)'/g, "background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/background: 'rgba\(20, 24, 33, 0\.95\)'/g, "background: 'rgba(255, 255, 255, 0.95)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/background: 'rgba\(15, 20, 30, 0\.96\)'/g, "background: 'rgba(255, 255, 255, 0.96)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/background: 'rgba\(0, 0, 0, 0\.72\)'/g, "background: 'rgba(255, 255, 255, 0.9)', boxShadow: '0 8px 30px rgba(0,0,0,0.1)'"],
  [/color: '#fff'/g, "color: '#2D3748'"],
  [/color: '#CBD5E1'/g, "color: '#718096'"],
  [/color: '#94A3B8'/g, "color: '#3b4a5d'"],
  [/color: '#E2E8F0'/g, "color: '#4A5568'"],
  [/border: '1px solid rgba\(255,255,255,0\.15\)'/g, "border: '1px solid rgba(0,0,0,0.05)'"],
  [/border: '1px solid rgba\(255,255,255,0\.1\)'/g, "border: '1px solid rgba(0,0,0,0.05)'"],
  [/#FF7E36/g, "#FFB320"],
  [/color: '#2D3748', fontSize: '0\.62rem', fontWeight: 800/g, "color: '#fff', fontSize: '0.62rem', fontWeight: 800"],
  [/color: '#2D3748', fontSize: '0\.58rem', fontWeight: 800/g, "color: '#fff', fontSize: '0.58rem', fontWeight: 800"],
  [/color: '#2D3748', fontSize: '0\.6rem', fontWeight: 800/g, "color: '#fff', fontSize: '0.6rem', fontWeight: 800"],
  [/color: '#2D3748', fontSize: '0\.52rem', fontWeight: 900/g, "color: '#fff', fontSize: '0.52rem', fontWeight: 900"]
];

for (const [pattern, repl] of replacements) {
  content = content.replace(pattern, repl);
}

// Restore color on colored background labels
content = content.replace(/background: '#FFB320', color: '#2D3748'/g, "background: '#FFB320', color: '#fff'");
content = content.replace(/background: '#2EC4B6', color: '#2D3748'/g, "background: '#2EC4B6', color: '#fff'");

fs.writeFileSync(filepath, content, 'utf-8');
console.log("Updated ARCameraView");
