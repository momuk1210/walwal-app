const fs = require('fs');
const p = 'e:/workspace/walwal-app/web-app/src/components/RadarView.tsx';
let code = fs.readFileSync(p, 'utf8');
code = code.replace(
  /const \[apiKey, setApiKey\] = useState<string>\(\(\) => [^;]+;/,
  "const [apiKey, setApiKey] = useState<string>(() => import.meta.env.VITE_GOOGLE_MAPS_API_KEY || localStorage.getItem('WALWAL_GMAP_KEY') || 'AIzaSyB54iZeCimiGT75286sRj_M-cLS-cOjKqQ');"
);
fs.writeFileSync(p, code, 'utf8');
console.log('API_KEY_INJECTED_SUCCESSFULLY');
