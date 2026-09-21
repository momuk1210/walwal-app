const fs = require('fs');

const path = 'e:/workspace/walwal-app/web-app/src/components/ProfileView.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetStr = `const [activePetIndex, setActivePetIndex] = useState<number>(0);`;

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
        }
        return p;
      });
      if (changed) {
        localStorage.setItem('WALWAL_PETS', JSON.stringify(nextPets));
      }
      return nextPets;
    });
  }, [language]);

  const [activePetIndex, setActivePetIndex] = useState<number>(0);
`;

code = code.replace(targetStr, replacement);
fs.writeFileSync(path, code, 'utf8');
console.log('ProfileView synced');
