const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/components/ProfileView.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
  // Sync mock dogs in localStorage whenever language changes
  React.useEffect(() => {
    setPets(prev => {
      let changed = false;
      const nextPets = prev.map(p => {
        if (p.id.startsWith('dog-')) {
          const mockMatch = getMockDogs(language).find(m => m.id === p.id);
          if (mockMatch && (p.name !== mockMatch.name || p.age !== mockMatch.age)) {
            changed = true;
            return {
              ...p,
              name: mockMatch.name,
              breed: mockMatch.breed,
              personality: mockMatch.personality,
              recentThought: mockMatch.recentThought,
              ownerName: mockMatch.ownerName,
              age: mockMatch.age // also overrides '2살' with '2' if mock data has '2'
            };
          }
        } else {
          // Demo translation for user-added custom dogs
          const demoTranslations = {
            '딸기': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            '초코': { ko: '초코', en: 'Choco', ja: 'チョコ', es: 'Choco' },
            'Strawberry': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            'イチゴ': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            'Fresa': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' }
          };
          
          if (demoTranslations[p.name]) {
             const translatedName = demoTranslations[p.name][language] || demoTranslations[p.name]['en'];
             if (p.name !== translatedName) {
                 changed = true;
                 return { ...p, name: translatedName };
             }
          }
        }
        return p;
      });
      if (changed) {
        localStorage.setItem('WALWAL_PETS', JSON.stringify(nextPets));
      }
      return nextPets;
    });
  }, [language]);
`;

code = code.replace(/\/\/ Sync mock dogs in localStorage whenever language changes[\s\S]*?\}, \[language\]\);/, replacement.trim());
fs.writeFileSync(path, code, 'utf8');
console.log('ProfileView synced with custom translations');
