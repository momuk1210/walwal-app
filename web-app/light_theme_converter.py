import os
import re

files_to_process = [
    "e:/workspace/walwal-app/web-app/src/components/ARCameraView.tsx",
    "e:/workspace/walwal-app/web-app/src/components/ShortformStudio.tsx",
    "e:/workspace/walwal-app/web-app/src/components/ProfileView.tsx",
    "e:/workspace/walwal-app/web-app/src/components/OwnerNoteModal.tsx",
    "e:/workspace/walwal-app/web-app/src/components/ProModal.tsx",
    "e:/workspace/walwal-app/web-app/src/components/VirtualChatModal.tsx",
]

replacements = [
    (r"#0D1117", r"#F8F9FB"),
    (r"#FF7E36", r"#FFB320"),
    (r"rgba\(15, 23, 42, 0\.85\)", r"rgba(255, 255, 255, 0.9)"),
    (r"rgba\(20, 24, 33, 0\.94\)", r"rgba(255, 255, 255, 0.95)"),
    (r"rgba\(13, 17, 23, 0\.97\)", r"rgba(255, 255, 255, 0.95)"),
    (r"rgba\(0, 0, 0, 0\.65\)", r"rgba(255, 255, 255, 0.9)"),
    (r"rgba\(0, 0, 0, 0\.7\)", r"rgba(255, 255, 255, 0.9)"),
    (r"rgba\(255,255,255,0\.15\)", r"rgba(0,0,0,0.05)"),
    (r"rgba\(255,255,255,0\.1\)", r"rgba(0,0,0,0.05)"),
    (r"rgba\(255,255,255,0\.2\)", r"rgba(0,0,0,0.08)"),
    (r"color: '#fff'", r"color: '#2D3748'"),
    (r"color: '#94A3B8'", r"color: '#3b4a5d'"),
    (r"background: '#1F2937'", r"background: '#FFFFFF'"),
    (r"background: 'rgba\(26, 31, 41, 0\.6\)'", r"background: '#FFFFFF'"),
    (r"background: 'linear-gradient\(135deg, #FF7E36, #FFBF00\)'", r"background: '#FFB320'"),
    (r"border: '1px solid rgba\(255,255,255,0.1\)'", r"border: '1px solid rgba(0,0,0,0.05)'"),
    (r"color: '#CBD5E1'", r"color: '#718096'"),
]

for filepath in files_to_process:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    for pattern, repl in replacements:
        content = re.sub(pattern, repl, content)
    
    # Fix specific color overrides for buttons (Keep white text on colored buttons)
    content = content.replace("background: '#FFB320',\n                color: '#2D3748'", "background: '#FFB320',\n                color: '#fff'")
    content = content.replace("background: '#38c5b7',\n                color: '#2D3748'", "background: '#38c5b7',\n                color: '#fff'")
    content = content.replace("background: '#EF4444',\n                color: '#2D3748'", "background: '#EF4444',\n                color: '#fff'")

    # Special handling for ARCameraView.tsx background (Keep it #000 for the camera view)
    if "ARCameraView.tsx" in filepath:
        content = content.replace("background: '#F8F9FB'", "background: '#000'")
        # Some white text on transparent backgrounds needs to stay white
        content = content.replace("color: '#2D3748', fontSize: '0.78rem', fontWeight: 900", "color: '#fff', fontSize: '0.78rem', fontWeight: 900")
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Updated: {filepath}")
