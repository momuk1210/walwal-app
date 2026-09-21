const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/i18n/translations.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/"peopleCount": "명",/g, `"peopleCount": "명",\n        "filterUpcoming": "함께산책해요",\n        "filterJoined": "내 산책",\n        "filterPast": "지난 산책",`);

content = content.replace(/"peopleCount": "people",/g, `"peopleCount": " people",\n        "filterUpcoming": "Upcoming",\n        "filterJoined": "My Walks",\n        "filterPast": "Past Walks",`);

content = content.replace(/"peopleCount": "人",/g, `"peopleCount": "人",\n        "filterUpcoming": "今後の散歩",\n        "filterJoined": "私の散歩",\n        "filterPast": "過去の散歩",`);

content = content.replace(/"peopleCount": "personas",/g, `"peopleCount": " personas",\n        "filterUpcoming": "Próximos",\n        "filterJoined": "Mis Paseos",\n        "filterPast": "Paseos Pasados",`);

// Add type definitions
content = content.replace(/peopleCount: string;/g, `peopleCount: string;\n    filterUpcoming: string;\n    filterJoined: string;\n    filterPast: string;`);

fs.writeFileSync(path, content, 'utf8');
console.log('Translations patched successfully');
