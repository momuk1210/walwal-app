const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/i18n/translations.ts';
let code = fs.readFileSync(path, 'utf8');

const jaPersonalities = `
      "presetPersonalities": [
        "#超陽キャ",
        "#人間みんな友達",
        "#おやつ検査官",
        "#おしり食パン",
        "#短足の誇り",
        "#おやつハンター",
        "#イケワン",
        "#マルチーズの気性",
        "#好奇心旺盛",
        "#甘えん坊",
        "#ママっ子",
        "#散歩中毒"
      ],`;

const esPersonalities = `
      "presetPersonalities": [
        "#SúperSociable",
        "#AmigoDeTodos",
        "#InspectorDeSnacks",
        "#TraseroDePan",
        "#OrgulloPatasCortas",
        "#CazadorDeSnacks",
        "#PerritoConEstilo",
        "#MaltésLuchador",
        "#ExploradorCurioso",
        "#Cariñoso",
        "#NiñoDeMamá",
        "#AdictoAlPaseo"
      ],`;

// We inject it right before "breedOptions" in ja and es sections
// The regex below finds "ja": { ... "profile": { ... "breedOptions": [
let newCode = code.replace(/("ja":\s*\{[\s\S]*?"profile":\s*\{[\s\S]*?)("breedOptions":\s*\[)/, (match, p1, p2) => {
    return p1 + jaPersonalities.trim() + "\n      " + p2;
});

newCode = newCode.replace(/("es":\s*\{[\s\S]*?"profile":\s*\{[\s\S]*?)("breedOptions":\s*\[)/, (match, p1, p2) => {
    return p1 + esPersonalities.trim() + "\n      " + p2;
});

fs.writeFileSync(path, newCode, 'utf8');
console.log('Fixed tags');
