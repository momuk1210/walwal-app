const fs = require('fs');
let content = fs.readFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', 'utf-8');

const additions = {
  ko: { genderLabel: "성별", genderMale: "남아 (Male)", genderFemale: "여아 (Female)" },
  en: { genderLabel: "Gender", genderMale: "Male", genderFemale: "Female" },
  ja: { genderLabel: "性別", genderMale: "オス (Male)", genderFemale: "メス (Female)" },
  es: { genderLabel: "Género", genderMale: "Macho (Male)", genderFemale: "Hembra (Female)" }
};

for (const lang in additions) {
  const regex = new RegExp(`(\\"${lang}\\":\\s*\\{\\s*[\\s\\S]*?\\"profile\\":\\s*\\{)`);
  const injection = `\n      "genderLabel": "${additions[lang].genderLabel}",\n      "genderMale": "${additions[lang].genderMale}",\n      "genderFemale": "${additions[lang].genderFemale}",`;
  content = content.replace(regex, `$1${injection}`);
}

fs.writeFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', content, 'utf-8');
console.log('Updated gender translations');
