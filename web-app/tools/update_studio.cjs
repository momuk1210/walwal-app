const fs = require('fs');
let content = fs.readFileSync('src/components/ShortformStudio.tsx', 'utf-8');

// 1. Remove select and regenerate button (lines 482-534 approx, basically the div containing them)
const regex1 = /\{\/\* Minimal Dog & Punchline Controls \*\/\}[\s\S]*?<\/div>/;
content = content.replace(regex1, '');

// 2. Adjust Canvas Generation
const canvasRegex = /\/\/ Top Captions[\s\S]*?resolve\(canvas\.toDataURL\('image\/png'\)\);/;
const newCanvasGen = `// Top Profile Area
        const avatarSize = 120;
        const padding = 60;
        const textX = padding + avatarSize + 40;
        
        // WalWal Logo Watermark (Top Right)
        ctx.textAlign = 'right';
        ctx.font = 'bold 54px sans-serif';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.fillText('Wal.Wal', 1080 - padding, padding + 70);
        
        // Let's load the avatar image properly
        const avatarImg = new Image();
        avatarImg.crossOrigin = 'anonymous';
        avatarImg.src = selectedBreed.avatar;
        avatarImg.onload = () => {
          ctx.save();
          ctx.beginPath();
          ctx.arc(padding + avatarSize/2, padding + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatarImg, padding, padding, avatarSize, avatarSize);
          ctx.restore();
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(padding + avatarSize/2, padding + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
          ctx.stroke();
          
          // Name and Tag
          ctx.textAlign = 'left';
          ctx.font = 'bold 50px sans-serif';
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
          ctx.shadowBlur = 12;
          ctx.fillText(selectedBreed.name, textX, padding + 55);
          
          ctx.font = '40px sans-serif';
          ctx.fillStyle = '#F1F5F9';
          ctx.fillText((selectedBreed.personalityTags[0] || '#파워인싸') + ' (' + selectedBreed.personality + ')', textX, padding + 110);

          // Bottom Captions (Speech Bubble Style)
          ctx.shadowBlur = 0; // Remove text shadow for bubble text
          
          const words = thought.split(' ');
          let lines = [];
          let line = '';
          ctx.font = 'bold 54px sans-serif';
          for (let n = 0; n < words.length; n++) {
            const testLine = line + words[n] + ' ';
            const metrics = ctx.measureText(testLine);
            if (metrics.width > 800 && n > 0) {
              lines.push(line);
              line = words[n] + ' ';
            } else {
              line = testLine;
            }
          }
          lines.push(line);
          
          const bubblePadding = 60;
          const lineHeight = 80;
          const bubbleHeight = (lines.length * lineHeight) + (bubblePadding * 2) - 20;
          const bubbleY = 1920 - bubbleHeight - 120;
          
          // Draw Bubble Background
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.beginPath();
          ctx.roundRect(80, bubbleY, 1080 - 160, bubbleHeight, 40);
          ctx.fill();
          
          // Draw Bubble Tail
          ctx.beginPath();
          ctx.moveTo(140, bubbleY);
          ctx.lineTo(170, bubbleY - 40);
          ctx.lineTo(200, bubbleY);
          ctx.fill();
          
          // Draw Text
          ctx.fillStyle = '#2D3748';
          ctx.textAlign = 'center';
          lines.forEach((l, i) => {
            ctx.fillText(l.trim(), 540, bubbleY + bubblePadding + 40 + (i * lineHeight));
          });
          
          resolve(canvas.toDataURL('image/png'));
        };
        avatarImg.onerror = () => resolve(canvas.toDataURL('image/png'));`;
content = content.replace(canvasRegex, newCanvasGen);

// 3. Update DOM Preview
const domRegex = /\/\/ Top Text Overlay[\s\S]*?<\/div>\s*<\/div>/;
const newDom = `// Top Profile & Watermark Overlay
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            right: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            pointerEvents: 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={selectedBreed.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }} />
              <div style={{ textShadow: '0 2px 8px rgba(0,0,0,0.9)', textAlign: 'left' }}>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>{selectedBreed.name}</div>
                <div style={{ fontSize: '0.75rem', fontWeight: 500, color: '#F1F5F9', marginTop: '2px' }}>{selectedBreed.personalityTags[0] || '#파워인싸'} ({selectedBreed.personality})</div>
              </div>
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.8)', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
              Wal.Wal
            </div>
          </div>

          {/* Bottom Speech Bubble Overlay */}
          <div style={{
            position: 'absolute',
            bottom: '30px',
            left: '20px',
            right: '20px',
            pointerEvents: 'none'
          }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '24px',
              padding: '20px 24px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              position: 'relative'
            }}>
              {/* Bubble Tail */}
              <div style={{
                position: 'absolute',
                top: '-12px',
                left: '24px',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderBottom: '12px solid rgba(255, 255, 255, 0.95)'
              }} />
              <div style={{
                fontSize: '0.95rem',
                fontWeight: 800,
                color: '#2D3748',
                lineHeight: 1.5,
                textAlign: 'center',
                wordBreak: 'keep-all'
              }}>
                "{thought}"
              </div>
            </div>
          </div>
        </div>`;
content = content.replace(domRegex, newDom);

// 4. Increase photo card size by reducing margins
content = content.replace(/padding: '24px',/g, "padding: '12px',");
content = content.replace(/borderRadius: '32px',/g, "borderRadius: '24px',");
content = content.replace(/height: '70vh',/g, "height: '75vh',");
content = content.replace(/maxHeight: '600px',/g, "maxHeight: '680px',");

fs.writeFileSync('src/components/ShortformStudio.tsx', content, 'utf-8');
