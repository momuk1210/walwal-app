const fs = require('fs');
const path = require('path');

const baseDir = 'e:/workspace/walwal-app/web-app/src';

const filesToPatch = [
  'App.tsx',
  'components/ARCameraView.tsx',
  'components/CommunityView.tsx',
  'components/FeedView.tsx',
  'components/MeetupChatModal.tsx',
  'components/ProfileView.tsx',
  'components/RadarView.tsx'
];

filesToPatch.forEach(relPath => {
  const file = path.join(baseDir, relPath);
  if (!fs.existsSync(file)) return;

  let code = fs.readFileSync(file, 'utf8');

  // Add getMockDogs import if it's missing
  if (code.includes('MOCK_DOGS') && !code.includes('getMockDogs')) {
    code = code.replace(/import \{([^}]*)MOCK_DOGS([^}]*)\} from '(.*mockDogs)';/, "import { $1MOCK_DOGS, getMockDogs$2 } from '$3';");
  }

  if (!code.includes('const { t, language } = useTranslation();') && code.includes('const { t } = useTranslation();')) {
      code = code.replace('const { t } = useTranslation();', 'const { t, language } = useTranslation();');
  }

  // Ensure App.tsx has useTranslation if it needs it
  if (relPath === 'App.tsx' && !code.includes('const { t, language }')) {
     code = code.replace('const { t } = useTranslation();', 'const { t, language } = useTranslation();');
  }

  let lines = code.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].includes('import ')) {
      lines[i] = lines[i].replace(/\bMOCK_DOGS\b/g, 'getMockDogs(language)');
    }
  }
  
  fs.writeFileSync(file, lines.join('\n'), 'utf8');
});
console.log('Components updated');
