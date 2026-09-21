const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/components/ShortformStudio.tsx';
let lines = fs.readFileSync(path, 'utf8').split('\n');

lines[87] = '      ctx.fillText(`?? ${selectedBreed.name} (${selectedBreed.breedKr} 전용 페르소나)`, 140, 1030);';
lines[111] = '      ctx.fillText(`?? 왈왈 (WalWal) - [${selectedBreed.breedKr}] 견종특화 속마음`, 80, 90);';
lines[236] = '            <Wand2 size={14} /> {selectedBreed.breedKr + " 대사 다시뽑기"}';
lines[263] = '          {downloading ? "카드 렌더링 중..." : `[${selectedBreed.breedKr}] 웹툰 컷 PNG 다운로드`}';

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log('SF_FIXED_PERFECTLY');
