const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/data/mockDogs.ts';
let code = fs.readFileSync(path, 'utf8');

// Replace export const MOCK_DOGS with const MOCK_DOGS_KO
code = code.replace('export const MOCK_DOGS: DogProfile[] = [', 'const MOCK_DOGS_KO: DogProfile[] = [');

// Append English translations and the getter
const appendCode = `
const MOCK_DOGS_EN: DogProfile[] = [
  {
    ...MOCK_DOGS_KO[0],
    name: 'Bori',
    breed: 'Golden Retriever',
    ownerName: 'Bori Mom',
    personality: ['#SocialButterfly', '#Friendly', '#SnackExpert'],
    recentThought: '"Sniff sniff... 100% sausage in bro\\'s pocket!! Should I start the tail propeller? 🍖"',
    soundPattern: 'Woof (High pitch)',
    posePattern: 'Tail wagging + paws crossed',
    conversationLog: [
      { speaker: 'Bori', text: 'Hey doggy friend! Sniffing your butt!!', time: 'Just now' },
      { speaker: 'Peanut', text: 'Hey watch it! I smell first!', time: 'Just now' },
      { speaker: 'Bori', text: 'Hehe I can tell what you ate today by the smell!', time: '1m ago' }
    ]
  },
  {
    ...MOCK_DOGS_KO[1],
    name: 'Peanut',
    breed: 'Welsh Corgi',
    ownerName: 'Corgi Papa',
    personality: ['#ShortLegs', '#Stubborn', '#Energetic'],
    recentThought: '"Don\\'t ignore my short legs! My pride is 2 meters high 😤"',
    soundPattern: 'Bark! (Loud)',
    posePattern: 'Ears perked up, intense stare',
    conversationLog: []
  },
  {
    ...MOCK_DOGS_KO[2],
    name: 'Cloud',
    breed: 'Pomeranian',
    ownerName: 'Cloud Mom',
    personality: ['#Timid', '#MommyBoy', '#Fluffy'],
    recentThought: '"Mom... let\\'s go home... that big dog is scary 🥺"',
    soundPattern: 'Yip yip (Quietly)',
    posePattern: 'Hiding behind owner',
    conversationLog: []
  },
  {
    ...MOCK_DOGS_KO[3],
    name: 'Mochi',
    breed: 'Shiba Inu',
    ownerName: 'Shiba Owner',
    personality: ['#Independent', '#Clean', '#Doge'],
    recentThought: '"I don\\'t want to walk that way. I\\'m going to plant my feet here 🐕"',
    soundPattern: 'Awoo (Softly)',
    posePattern: 'Refusing to move',
    conversationLog: []
  }
];

export const MOCK_DOGS = MOCK_DOGS_KO;

export const getMockDogs = (language: string): DogProfile[] => {
  return language === 'ko' ? MOCK_DOGS_KO : MOCK_DOGS_EN;
};
`;

fs.writeFileSync(path, code + appendCode, 'utf8');
console.log('mockDogs.ts updated');
