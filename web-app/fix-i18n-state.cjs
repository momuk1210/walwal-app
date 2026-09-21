const fs = require('fs');

function replaceFile(path, replacer) {
  let content = fs.readFileSync(path, 'utf8');
  content = replacer(content);
  fs.writeFileSync(path, content, 'utf8');
}

// 1. ProfileView.tsx - clear localStorage or ignore mock dog from localStorage if language changes?
// Better: just delete WALWAL_PETS entirely in App.tsx on mount to force mock data usage for this demo.
replaceFile('e:/workspace/walwal-app/web-app/src/App.tsx', code => {
  if (!code.includes('localStorage.removeItem')) {
    code = code.replace(/const App: React.FC = \(\) => \{/, "const App: React.FC = () => {\n  React.useEffect(() => { localStorage.removeItem('WALWAL_PETS'); }, []);");
  }
  return code;
});

// 2. FeedView.tsx - dynamically update feedPosts on language change
replaceFile('e:/workspace/walwal-app/web-app/src/components/FeedView.tsx', code => {
  let newCode = code.replace(
    /const \[feedPosts, setFeedPosts\] = useState\(\(\) => getMockDogs\(language\)\.map\(dog => \(\{[\s\S]*?shares: 11\n  \}\)\)\);/g,
    `const [feedPosts, setFeedPosts] = useState<any[]>([]);

  React.useEffect(() => {
    setFeedPosts(prev => {
      return getMockDogs(language).map((dog, idx) => {
        const existing = prev[idx];
        return {
          ...dog,
          likes: existing ? existing.likes : Math.floor(Math.random() * 30) + 10,
          liked: existing ? existing.liked : false,
          comments: existing ? existing.comments : [
            { id: Date.now() + Math.random(), author: t.community?.hostMom || 'Mom', text: dog.recentThought }
          ],
          showComments: existing ? existing.showComments : false,
          shares: existing ? existing.shares : 11
        };
      });
    });
  }, [language, t]);`
  );
  
  // also fix "오늘 우리 댕댕이들의 속마음"
  newCode = newCode.replace(/오늘 우리 댕댕이들의 속마음/g, '{t.community.subtitle}');
  
  return newCode;
});

// 3. CommunityView.tsx - dynamically rebuild meetups
replaceFile('e:/workspace/walwal-app/web-app/src/components/CommunityView.tsx', code => {
  let newCode = code;
  
  // we can just use `getMockDogs(language)` inside the `localizedMeetups` instead of INITIAL_MEETUPS
  newCode = newCode.replace(
    /const localizedMeetups: WalkMeetup\[\] = \[[\s\S]*?\];/g,
    `const localizedMeetups: WalkMeetup[] = [
    { ...INITIAL_MEETUPS[0], hostDog: getMockDogs(language)[0].name, hostOwner: getMockDogs(language)[0].ownerName, participants: [getMockDogs(language)[0], getMockDogs(language)[1], getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m1.title, location: t.community.mock.m1.location, time: t.community.mock.m1.time, tag: t.community.mock.m1.tag },
    { ...INITIAL_MEETUPS[1], hostDog: getMockDogs(language)[1].name, hostOwner: getMockDogs(language)[1].ownerName, participants: [getMockDogs(language)[1], getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m2.title, location: t.community.mock.m2.location, time: t.community.mock.m2.time, tag: t.community.mock.m2.tag },
    { ...INITIAL_MEETUPS[2], hostDog: getMockDogs(language)[2].name, hostOwner: getMockDogs(language)[2].ownerName, participants: [getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m3.title, location: t.community.mock.m3.location, time: t.community.mock.m3.time, tag: t.community.mock.m3.tag }
  ];`
  );
  
  return newCode;
});

// 4. Update myDog fallback in ProfileView, ARCameraView, CommunityView, FeedView, MeetupChatModal
// The easiest way is to add a hook or just remove localStorage check since App.tsx clears it. 
// But wait, if App.tsx clears it, they will still only load ONCE on mount! 
// Let's replace useState(() => { ... }) for myDog with just a regular assignment.
const filesToUpdateMyDog = [
  'e:/workspace/walwal-app/web-app/src/components/FeedView.tsx',
  'e:/workspace/walwal-app/web-app/src/components/MeetupChatModal.tsx',
  'e:/workspace/walwal-app/web-app/src/components/CommunityView.tsx'
];

filesToUpdateMyDog.forEach(file => {
  replaceFile(file, code => {
    return code.replace(
      /const \[myDog\] = useState\(\(\) => \{[\s\S]*?return getMockDogs\(language\)\[0\];\n  \}\);/g,
      `const myDog = getMockDogs(language)[0];`
    );
  });
});

console.log('Done');
