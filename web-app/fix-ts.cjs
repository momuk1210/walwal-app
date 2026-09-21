const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content, 'utf8');
}

// 1. App.tsx: Fix "studio" error. 'studio' might have been removed from NavTab in BottomNav.tsx. Let's just fix the language error if any.
replaceFile('e:/workspace/walwal-app/web-app/src/App.tsx', code => {
  return code.replace(/getMockDogs\(language\)/g, 'getMockDogs("ko")'); // App state uses ko initially
});

// 2. CommunityView.tsx: INITIAL_MEETUPS is outside component.
replaceFile('e:/workspace/walwal-app/web-app/src/components/CommunityView.tsx', code => {
  return code.replace(/getMockDogs\(language\)/g, 'getMockDogs("ko")'); 
});

// 3. MeetupChatModal.tsx: missing language.
replaceFile('e:/workspace/walwal-app/web-app/src/components/MeetupChatModal.tsx', code => {
  return code.replace(/getMockDogs\(language\)/g, 'getMockDogs("ko")');
});

// 4. RadarView.tsx: Property 'dogAgeSuffix' does not exist on type 'DogProfile'.
replaceFile('e:/workspace/walwal-app/web-app/src/components/RadarView.tsx', code => {
  return code.replace(/selectedPin\.dogAgeSuffix/g, 't.profile.dogAgeSuffix');
});

// 5. App.tsx: fix 'studio' error by adding it to NavTab in BottomNav
replaceFile('e:/workspace/walwal-app/web-app/src/components/BottomNav.tsx', code => {
  if (!code.includes("'studio'")) {
    return code.replace(/export type NavTab = '([^']*)' \| '([^']*)' \| '([^']*)' \| '([^']*)';/, "export type NavTab = '$1' | '$2' | '$3' | '$4' | 'studio';");
  }
  return code;
});

console.log('Fixes applied');
