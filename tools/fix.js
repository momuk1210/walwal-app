const fs = require('fs');

// Fix ARCameraView.tsx
const arPath = 'e:/workspace/walwal-app/web-app/src/components/ARCameraView.tsx';
let ar = fs.readFileSync(arPath, 'utf8');
ar = ar.replace('top: ${dogPose.y - 25}%,', 'top: `${dogPose.y - 25}%`,');
ar = ar.replace('left: ${dogPose.x - 30}%,', 'left: `${dogPose.x - 30}%`,');
ar = ar.replace('top: ${Math.max(14, dogPose.y - 36)}%,', 'top: `${Math.max(14, dogPose.y - 36)}%`,');
ar = ar.replace('height: ${Math.min(100, Math.max(15, val))}%,', 'height: `${Math.min(100, Math.max(15, val))}%`,');
fs.writeFileSync(arPath, ar, 'utf8');

// Fix ShortformStudio.tsx
const sfPath = 'e:/workspace/walwal-app/web-app/src/components/ShortformStudio.tsx';
let sf = fs.readFileSync(sfPath, 'utf8');
sf = sf.replace(/ctx\.fillText\(.*전용 페르소나\).*\);/, 'ctx.fillText(`?? ${selectedBreed.name} (${selectedBreed.breedKr} 전용 페르소나)`, 140, 1030);');
sf = sf.replace(/ctx\.fillText\(.*견종특화 속마음.*\);/, 'ctx.fillText(`?? 왈왈 (WalWal) - [${selectedBreed.breedKr}] 견종특화 속마음`, 80, 90);');
sf = sf.replace(/link\.download = .*;/g, 'link.download = `walwal-${selectedBreed.breedKr}-${selectedBreed.name}.png`;');
sf = sf.replace(/\{selectedBreed\.breedKr\} 대사 다시뽑기/g, '{selectedBreed.breedKr} + " 대사 다시뽑기"');
sf = sf.replace(/\[\{selectedBreed\.breedKr\}\] 웹툰 컷 PNG 다운로드/g, '"[" + selectedBreed.breedKr + "] 웹툰 컷 PNG 다운로드"');
fs.writeFileSync(sfPath, sf, 'utf8');

console.log('FIX_APPLIED_SUCCESSFULLY');
