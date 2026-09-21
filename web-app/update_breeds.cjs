const fs = require('fs');
let content = fs.readFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', 'utf-8');

const breeds = {
  ko: ['말티즈', '푸들', '포메라니안', '치와와', '시추', '요크셔테리어', '코카 스패니얼', '비글', '진돗개', '웰시코기', '골든 리트리버', '저먼 셰퍼드', '시베리안 허스키', '테리어', '닥스훈트', '스피츠', '스태그하운드', '포인터', '리트리버', '컴패니언'],
  en: ['Maltese', 'Poodle', 'Pomeranian', 'Chihuahua', 'Shih Tzu', 'Yorkshire Terrier', 'Cocker Spaniel', 'Beagle', 'Jindo', 'Welsh Corgi', 'Golden Retriever', 'German Shepherd', 'Siberian Husky', 'Terrier', 'Dachshund', 'Spitz', 'Staghound', 'Pointer', 'Retriever', 'Companion Dog'],
  ja: ['マルチーズ', 'プードル', 'ポメラニアン', 'チワワ', 'シーズー', 'ヨークシャーテリア', 'コッカースパニエル', 'ビーグル', '珍島犬', 'ウェルシュコーギー', 'ゴールデンレトリバー', 'ジャーマンシェパード', 'シベリアンハスキー', 'テリア', 'ダックスフント', 'スピッツ', 'スタッグハウンド', 'ポインター', 'レトリバー', 'コンパニオンドッグ'],
  es: ['Bichón Maltés', 'Caniche', 'Pomerania', 'Chihuahua', 'Shih Tzu', 'Yorkshire Terrier', 'Cocker Spaniel', 'Beagle', 'Jindo', 'Corgi Galés', 'Golden Retriever', 'Pastor Alemán', 'Husky Siberiano', 'Terrier', 'Dachshund', 'Spitz', 'Staghound', 'Pointer', 'Retriever', 'Perro de Compañía']
};

const regexKo = /\"breedOptions\":\s*\[[\s\S]*?\]/g;
let matchCount = 0;
content = content.replace(regexKo, (match) => {
  if (matchCount === 0) {
    matchCount++;
    return '\"breedOptions\": ' + JSON.stringify(breeds.ko, null, 2).replace(/\n/g, '\n      ');
  } else if (matchCount === 1) {
    matchCount++;
    return '\"breedOptions\": ' + JSON.stringify(breeds.en, null, 2).replace(/\n/g, '\n      ');
  }
  return match;
});

// Since ja and es don't have breedOptions, we inject them into profile object.
// Match "ja": { ... "profile": { and append
content = content.replace(/(\"ja\":\s*\{\s*[\s\S]*?\"profile\":\s*\{)/, (m, p1) => {
  return p1 + '\n      \"breedOptions\": ' + JSON.stringify(breeds.ja, null, 2).replace(/\n/g, '\n      ') + ',';
});
content = content.replace(/(\"es\":\s*\{\s*[\s\S]*?\"profile\":\s*\{)/, (m, p1) => {
  return p1 + '\n      \"breedOptions\": ' + JSON.stringify(breeds.es, null, 2).replace(/\n/g, '\n      ') + ',';
});

fs.writeFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', content, 'utf-8');
console.log('Updated translations.ts');
