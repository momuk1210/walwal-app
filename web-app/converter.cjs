const fs = require('fs');

const filesToProcess = [
    "e:/workspace/walwal-app/web-app/src/components/ARCameraView.tsx",
    "e:/workspace/walwal-app/web-app/src/components/ShortformStudio.tsx",
    "e:/workspace/walwal-app/web-app/src/components/OwnerNoteModal.tsx",
    "e:/workspace/walwal-app/web-app/src/components/ProModal.tsx",
    "e:/workspace/walwal-app/web-app/src/components/VirtualChatModal.tsx"
];

const replacements = [
    [/background: '#0D1117'/g, "background: '#F8F9FB'"],
    [/background: '#14171E'/g, "background: '#FFFFFF'"],
    [/background: 'rgba\\(20, 24, 33, 0\\.94\\)'/g, "background: 'rgba(255, 255, 255, 0.95)'"],
    [/background: 'rgba\\(15, 23, 42, 0\\.85\\)'/g, "background: 'rgba(255, 255, 255, 0.9)'"],
    [/background: 'rgba\\(13, 17, 23, 0\\.97\\)'/g, "background: 'rgba(255, 255, 255, 0.95)'"],
    [/background: 'rgba\\(0, 0, 0, 0\\.85\\)'/g, "background: 'rgba(0, 0, 0, 0.4)'"],
    [/background: 'rgba\\(0, 0, 0, 0\\.72\\)'/g, "background: 'rgba(255, 255, 255, 0.9)'"],
    [/background: 'rgba\\(0, 0, 0, 0\\.65\\)'/g, "background: 'rgba(255, 255, 255, 0.9)'"],
    [/background: '#1F2937'/g, "background: '#FFFFFF'"],
    [/background: 'rgba\\(26, 31, 41, 0\\.6\\)'/g, "background: '#FFFFFF'"],
    [/background: '#161B22'/g, "background: '#FFFFFF'"],
    [/border: '1px solid rgba\\(255,255,255,0\\.1\\)'/g, "border: '1px solid rgba(0,0,0,0.05)'"],
    [/border: '1px solid rgba\\(255,255,255,0\\.15\\)'/g, "border: '1px solid rgba(0,0,0,0.05)'"],
    [/color: '#fff'/g, "color: '#2D3748'"],
    [/color: '#CBD5E1'/g, "color: '#718096'"],
    [/color: '#94A3B8'/g, "color: '#3b4a5d'"],
    [/#FF7E36/g, "#FFB320"],
    [/className="glass-panel"/g, "style={{ background: '#FFFFFF', boxShadow: '0 8px 30px rgba(0,0,0,0.03)' }}"],
    [/boxShadow: '0 10px 40px rgba\\(0,0,0,0\\.8\\)'/g, "boxShadow: '0 20px 60px rgba(0,0,0,0.1)'"],
    [/boxShadow: '0 10px 30px rgba\\(0,0,0,0\\.8\\)'/g, "boxShadow: '0 15px 40px rgba(0,0,0,0.08)'"],
    [/boxShadow: '0 8px 25px rgba\\(0,0,0,0\\.7\\)'/g, "boxShadow: '0 12px 30px rgba(0,0,0,0.08)'"],
    [/boxShadow: '0 6px 24px rgba\\(0,0,0,0\\.8\\)'/g, "boxShadow: '0 10px 25px rgba(0,0,0,0.06)'"]
];

for (const filepath of filesToProcess) {
    if (!fs.existsSync(filepath)) {
        console.log(`File not found: ${filepath}`);
        continue;
    }

    let content = fs.readFileSync(filepath, 'utf-8');

    for (const [pattern, repl] of replacements) {
        content = content.replace(pattern, repl);
    }

    // Fix buttons that should keep white text on #FFB320 background
    content = content.replace(/background: '#FFB320',\n\s*color: '#2D3748'/g, "background: '#FFB320',\n              color: '#fff'");
    content = content.replace(/background: '#EF4444',\n\s*color: '#2D3748'/g, "background: '#EF4444',\n              color: '#fff'");
    content = content.replace(/background: '#38c5b7',\n\s*color: '#2D3748'/g, "background: '#38c5b7',\n              color: '#fff'");
    content = content.replace(/background: 'linear-gradient\(135deg, #FFB320, #FFBF00\)',\n\s*border: 'none',\n\s*borderRadius: '14px',\n\s*padding: '8px 12px',\n\s*color: '#2D3748'/g, "background: '#FFB320',\n              border: 'none',\n              borderRadius: '16px',\n              padding: '10px 14px',\n              color: '#fff'");

    // ARCameraView special cases
    if (filepath.includes('ARCameraView.tsx')) {
        content = content.replace(/background: '#F8F9FB'/g, "background: '#000'"); // keep camera back black
        // Fix some white text overlays that were incorrectly turned to dark text
        content = content.replace(/color: '#2D3748', fontSize: '0.62rem', fontWeight: 800/g, "color: '#fff', fontSize: '0.62rem', fontWeight: 800");
        content = content.replace(/color: '#2D3748', fontSize: '0.58rem', fontWeight: 800/g, "color: '#fff', fontSize: '0.58rem', fontWeight: 800");
    }

    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Updated: ${filepath}`);
}
