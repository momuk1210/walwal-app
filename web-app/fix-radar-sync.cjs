const fs = require('fs');

const path = 'e:/workspace/walwal-app/web-app/src/components/RadarView.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
  useEffect(() => {
    if (selectedPin) {
      const updated = getMockDogs(language).find(d => d.id === selectedPin.id);
      if (updated) setSelectedPin(updated);
    }
  }, [language]);

  const nearbySuffix = t.radar.nearby;
`;

code = code.replace(`  const nearbySuffix = t.radar.nearby;`, replacement);

fs.writeFileSync(path, code, 'utf8');
console.log('RadarView synced');
