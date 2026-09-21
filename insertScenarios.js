const fs = require('fs');
const path = require('path');

const scenariosKo = {
  bark: [
    { thought: '누구야!! 내 영역에서 당장 나가!! 😠', behavior: '경계성 짖음 · 영역 방어', signal: '지속적 짖음 감지', confidence: 98 },
    { thought: '빨리 문 열어! 나가고 싶다 멍!!', behavior: '요구 짖음 · 행동 촉구', signal: '간헐적 요구 짖음 감지', confidence: 98 },
    { thought: '집사 온다!! 나 여기 있어 멍!!', behavior: '환영 짖음 · 재회 흥분', signal: '반복 짖음 패턴 감지', confidence: 99 },
    { thought: '냄새가 이상해! 조심해 멍멍!!', behavior: '경보 짖음 · 위협 인식', signal: '연속 짖음 버스트 감지', confidence: 94 },
    { thought: '저 소리 들었어?! 나한테 맡겨 멍!!', behavior: '탐지 짖음 · 청각 자극 반응', signal: '외부 자극 반응 짖음', confidence: 96 }
  ],
  whine: [
    { thought: '집사 어디 가... 나 혼자 두고 가지마 🥺', behavior: '분리 불안 신호 · 애착 표현', signal: '고주파 낑낑 감지', confidence: 96 },
    { thought: '배고파... 고기 줘... 꼬르륵 🍖', behavior: '식욕 호소 신호 · 요구 표현', signal: '지속 고주파 발성 감지', confidence: 94 },
    { thought: '발바닥이 이상해... 아픈 거 같아 😢', behavior: '통증/불편 신호 · 주의 필요', signal: '낮은 낑낑 + 자세 변화', confidence: 88 },
    { thought: '너무 신나! 빨리 산책 가자 낑낑!', behavior: '흥분 억제 신호 · 기대감', signal: '흥분성 고주파 발성', confidence: 95 },
    { thought: '무서운 냄새... 집사 옆에 딱 붙어있어야지 😰', behavior: '불안 카밍 신호 · 보호 요청', signal: '불안성 낑낑 발성', confidence: 91 }
  ],
  growl: [
    { thought: '가까이 오지 마. 여긴 내 구역이야 😤', behavior: '경고 그로울 · 영역 주장', signal: '저주파 지속 그로울 감지', confidence: 98 },
    { thought: '저거 내 거야! 건들지 마 👀', behavior: '자원 방어 그로울 · 소유 반응', signal: '자원 앞 저주파 발성', confidence: 95 },
    { thought: '나 지금 사냥 놀이 모드다! 어흥 🎮', behavior: '플레이 그로울 · 놀이 초대', signal: '플레이 중 저주파 발성', confidence: 89 },
    { thought: '뭔가 맘에 안 들어... 지켜보고 있다 🤨', behavior: '불만 그로울 · 불쾌 신호', signal: '간헐적 저주파 그로울', confidence: 93 }
  ],
  active: [
    { thought: '뭔가 있다 킁킁! 냄새 추적 시작! 🔍', behavior: '무성 탐색 · 후각 주도 이동', signal: '고모션 + 저음량 · 탐색 행동', confidence: 95 },
    { thought: '내 구역 순찰 중! 이상 무 🐾', behavior: '순찰 보행 · 영역 확인 행동', signal: '규칙적 이동 패턴 감지', confidence: 93 },
    { thought: '저기 꿀잼 냄새! 빨리 가보자 🎾', behavior: '자발적 이동 · 놀이 탐색', signal: '빠른 이동 + 귀 전방 직립', confidence: 96 },
    { thought: '달리고 싶어! 전속력으로 고고 🏃', behavior: '과잉 에너지 · 운동 욕구', signal: '전신 근육 긴장 + 이동 반복', confidence: 97 },
    { thought: '여기도 저기도 다 볼 거야! 바쁘다 바빠 👀', behavior: '다방향 주의 · 활발 탐색', signal: '빠른 시선 이동 + 체중 전방', confidence: 91 }
  ],
  calm: [
    { thought: '집사 옆이 최고야~ 행복해 ☀️', behavior: '이완 안정 · 신뢰 유대 신호', signal: '낮은 모션 + 정상 호흡', confidence: 98 },
    { thought: '킁킁... 집사 오늘 고기 먹었네? 👃', behavior: '후각 환경 분석 · 이완 탐색', signal: '비강 확장 · 느린 이동', confidence: 92 },
    { thought: '졸려... 눈이 자꾸 감긴다 😴', behavior: '수면 전 이완 · 경계 완화', signal: '순막 이완 + 호흡 느림', confidence: 96 },
    { thought: '오늘 산책도 밥도 완벽했다 🍖', behavior: '만족 이완 · 세로토닌 상태', signal: '꼬리 낮은 와깅 + 눈 부드러움', confidence: 99 },
    { thought: '누구 냄새지? 기다려볼까 ⏳', behavior: '수동 대기 · 자극 기다림', signal: '귀 측면 경청 + 저모션', confidence: 90 },
    { thought: '집사 기분 좋아보이네! 나도 좋다 🐶', behavior: '정서 동기화 · 공감 반응', signal: '시선 추적 + 꼬리 서행 와깅', confidence: 94 }
  ]
};

const scenariosEn = {
  bark: [
    { thought: 'Who is it!! Get out of my territory!! 😠', behavior: 'Alert Barking · Territorial', signal: 'Continuous Barking Detected', confidence: 98 },
    { thought: 'Open the door! I wanna go out!!', behavior: 'Demand Barking · Action Urged', signal: 'Intermittent Demand Barking', confidence: 98 },
    { thought: "My human is here!! I'm here!!", behavior: 'Welcome Barking · Excitement', signal: 'Repeated Barking Pattern', confidence: 99 },
    { thought: 'Strange smell! Be careful!!', behavior: 'Warning Barking · Threat Detected', signal: 'Continuous Bark Burst', confidence: 94 },
    { thought: 'Did you hear that?! Leave it to me!!', behavior: 'Detection Barking · Auditory Response', signal: 'External Stimulus Barking', confidence: 96 }
  ],
  whine: [
    { thought: "Where are you going... Don't leave me 🥺", behavior: 'Separation Anxiety · Attachment', signal: 'High-frequency Whine', confidence: 96 },
    { thought: 'Hungry... give me meat... 🍖', behavior: 'Appetite Appeal · Demand', signal: 'Continuous High-freq Vocalization', confidence: 94 },
    { thought: "My paw feels weird... I think it hurts 😢", behavior: 'Pain/Discomfort · Attention Needed', signal: 'Low Whine + Posture Change', confidence: 88 },
    { thought: "So excited! Let's go for a walk!", behavior: 'Excitement Suppression · Anticipation', signal: 'Excited High-freq Vocalization', confidence: 95 },
    { thought: 'Scary smell... I should stay close 😰', behavior: 'Anxiety Calming · Protection Request', signal: 'Anxious Whining', confidence: 91 }
  ],
  growl: [
    { thought: "Don't come closer. This is my turf 😤", behavior: 'Warning Growl · Territorial', signal: 'Low-freq Continuous Growl', confidence: 98 },
    { thought: "That's mine! Don't touch it 👀", behavior: 'Resource Guarding · Ownership', signal: 'Low-freq Vocalization at Resource', confidence: 95 },
    { thought: "I'm in hunting play mode! Rawr 🎮", behavior: 'Play Growl · Play Invitation', signal: 'Low-freq Vocalization during Play', confidence: 89 },
    { thought: "I don't like this... I'm watching you 🤨", behavior: 'Displeasure Growl · Uncomfortable', signal: 'Intermittent Low-freq Growl', confidence: 93 }
  ],
  active: [
    { thought: "Something's here sniff sniff! Tracking! 🔍", behavior: 'Silent Search · Olfactory Driven', signal: 'High Motion + Low Vol · Searching', confidence: 95 },
    { thought: 'Patrolling my area! All clear 🐾', behavior: 'Patrol Walk · Area Check', signal: 'Regular Movement Pattern', confidence: 93 },
    { thought: "Fun smell over there! Let's go 🎾", behavior: 'Spontaneous Movement · Play Search', signal: 'Fast Movement + Ears Forward', confidence: 96 },
    { thought: 'I wanna run! Full speed ahead 🏃', behavior: 'Excess Energy · Exercise Desire', signal: 'Full Body Tension + Repetitive Move', confidence: 97 },
    { thought: 'Gonna check everywhere! So busy 👀', behavior: 'Multi-direction Attention · Active Search', signal: 'Fast Gaze Shift + Forward Weight', confidence: 91 }
  ],
  calm: [
    { thought: 'Next to my human is the best~ So happy ☀️', behavior: 'Relaxed · Trust Bond Signal', signal: 'Low Motion + Normal Breathing', confidence: 98 },
    { thought: 'Sniff... Did you eat meat today? 👃', behavior: 'Olfactory Analysis · Relaxed Search', signal: 'Nasal Expansion · Slow Move', confidence: 92 },
    { thought: 'Sleepy... My eyes are closing 😴', behavior: 'Pre-sleep Relaxation · Guard Down', signal: 'Nictitating Membrane Relaxed', confidence: 96 },
    { thought: "Today's walk and food were perfect 🍖", behavior: 'Satisfied Relaxed · Serotonin State', signal: 'Low Tail Wag + Soft Eyes', confidence: 99 },
    { thought: "Whose smell is this? I'll wait ⏳", behavior: 'Passive Wait · Stimulus Wait', signal: 'Ears Listening + Low Motion', confidence: 90 },
    { thought: "You look happy! I'm happy too 🐶", behavior: 'Emotional Sync · Empathy Response', signal: 'Gaze Tracking + Slow Tail Wag', confidence: 94 }
  ]
};

const scenariosJa = {
  bark: [
    { thought: '誰だ!! 僕の領域から出て行け!! 😠', behavior: '警戒吠え · 領域防衛', signal: '持続的な吠え検知', confidence: 98 },
    { thought: '早くドア開けて! 外に出たいワン!!', behavior: '要求吠え · 行動促し', signal: '断続的な要求吠え検知', confidence: 98 },
    { thought: 'ご主人様だ!! 僕ここだよワン!!', behavior: '歓迎吠え · 再会の興奮', signal: '反復的な吠えパターン', confidence: 99 },
    { thought: '変な匂いがする! 気をつけてワン!!', behavior: '警報吠え · 脅威認識', signal: '連続的な吠えバースト', confidence: 94 },
    { thought: 'あの音聞こえた?! 僕に任せて!!', behavior: '探知吠え · 聴覚刺激反応', signal: '外部刺激反応の吠え', confidence: 96 }
  ],
  whine: [
    { thought: 'どこ行くの... 僕を一人にしないで 🥺', behavior: '分離不安サイン · 愛着表現', signal: '高周波のクンクン鳴き', confidence: 96 },
    { thought: 'お腹すいた... お肉ちょうだい... 🍖', behavior: '食欲アピール · 要求表現', signal: '持続的な高周波発声', confidence: 94 },
    { thought: '足の裏が変... 痛いみたい 😢', behavior: '痛み/不快サイン · 注意喚起', signal: '低い鳴き声 + 姿勢変化', confidence: 88 },
    { thought: 'すごく楽しい! 早く散歩行こう!', behavior: '興奮抑制サイン · 期待感', signal: '興奮性高周波発声', confidence: 95 },
    { thought: '怖い匂い... ぴったりくっついてよう 😰', behavior: '不安カーミングサイン · 保護要請', signal: '不安性のクンクン鳴き', confidence: 91 }
  ],
  growl: [
    { thought: '近づかないで。ここは僕の場所だ 😤', behavior: '警告のうなり声 · 領域主張', signal: '低周波持続うなり検知', confidence: 98 },
    { thought: 'それ僕の! 触らないで 👀', behavior: '資源防衛うなり · 所有反応', signal: '資源前の低周波発声', confidence: 95 },
    { thought: '今狩り遊びモードだぞ! ガオー 🎮', behavior: '遊びうなり · 遊びの誘い', signal: '遊び中の低周波発声', confidence: 89 },
    { thought: 'なんか気に入らない... 見張ってるぞ 🤨', behavior: '不満うなり · 不快サイン', signal: '断続的な低周波うなり', confidence: 93 }
  ],
  active: [
    { thought: '何かあるクンクン! 匂い追跡開始! 🔍', behavior: '無声探索 · 嗅覚主導の移動', signal: '高モーション+低音量 · 探索', confidence: 95 },
    { thought: '僕のエリアパトロール中! 異常なし 🐾', behavior: 'パトロール歩行 · 領域確認', signal: '規則的な移動パターン', confidence: 93 },
    { thought: 'あっちから面白い匂い! 行ってみよう 🎾', behavior: '自発的移動 · 遊び探索', signal: '速い移動 + 耳が前方直立', confidence: 96 },
    { thought: '走りたい! 全速力でゴーゴー 🏃', behavior: '過剰エネルギー · 運動欲求', signal: '全身の筋肉緊張+移動反復', confidence: 97 },
    { thought: 'あっちもこっちも見なきゃ! 大忙し 👀', behavior: '多方向注意 · 活発な探索', signal: '速い視線移動 + 体重前方', confidence: 91 }
  ],
  calm: [
    { thought: '隣が一番いいな〜 幸せ ☀️', behavior: '弛緩安定 · 信頼の絆サイン', signal: '低モーション + 正常呼吸', confidence: 98 },
    { thought: 'クンクン... 今日お肉食べたね? 👃', behavior: '嗅覚環境分析 · 弛緩探索', signal: '鼻腔拡張 · ゆっくり移動', confidence: 92 },
    { thought: '眠い... 目が閉じちゃう 😴', behavior: '睡眠前の弛緩 · 警戒緩和', signal: '瞬膜弛緩 + 呼吸が遅い', confidence: 96 },
    { thought: '今日の散歩もご飯も完璧だった 🍖', behavior: '満足弛緩 · セロトニン状態', signal: '尻尾の低いワギング+柔らかい目', confidence: 99 },
    { thought: '誰の匂い? 待ってみよう ⏳', behavior: '受動的待機 · 刺激待ち', signal: '耳側面の傾聴 + 低モーション', confidence: 90 },
    { thought: '機嫌良さそう! 僕も嬉しい 🐶', behavior: '情動同期 · 共感反応', signal: '視線追跡 + 尻尾の徐行ワギング', confidence: 94 }
  ]
};

const scenariosEs = {
  bark: [
    { thought: '¡¿Quién es?! ¡Fuera de mi territorio! 😠', behavior: 'Ladrido de Alerta · Defensa', signal: 'Ladrido Continuo Detectado', confidence: 98 },
    { thought: '¡Abre la puerta! ¡Quiero salir!', behavior: 'Ladrido de Demanda · Urgencia', signal: 'Ladrido de Demanda Intermitente', confidence: 98 },
    { thought: '¡Mi humano está aquí! ¡Estoy aquí!', behavior: 'Ladrido de Bienvenida · Emoción', signal: 'Patrón de Ladridos Repetidos', confidence: 99 },
    { thought: '¡Olor extraño! ¡Cuidado!', behavior: 'Ladrido de Advertencia · Amenaza', signal: 'Ráfaga de Ladridos Continuos', confidence: 94 },
    { thought: '¡¿Escuchaste eso?! ¡Déjamelo a mí!', behavior: 'Ladrido de Detección · Respuesta', signal: 'Respuesta a Estímulo Externo', confidence: 96 }
  ],
  whine: [
    { thought: '¿A dónde vas...? No me dejes solo 🥺', behavior: 'Ansiedad por Separación', signal: 'Lloriqueo de Alta Frecuencia', confidence: 96 },
    { thought: 'Hambriento... dame carne... 🍖', behavior: 'Apelación de Apetito · Demanda', signal: 'Vocalización Continua Alta', confidence: 94 },
    { thought: 'Mi pata se siente rara... creo que duele 😢', behavior: 'Dolor/Incomodidad · Atención', signal: 'Lloriqueo Bajo + Cambio Postura', confidence: 88 },
    { thought: '¡Qué emoción! ¡Vamos a pasear!', behavior: 'Supresión de Emoción · Anticipación', signal: 'Vocalización Emocionada Alta', confidence: 95 },
    { thought: 'Olor asustadizo... me quedaré cerca 😰', behavior: 'Calmar Ansiedad · Protección', signal: 'Lloriqueo Ansioso', confidence: 91 }
  ],
  growl: [
    { thought: 'No te acerques. Este es mi territorio 😤', behavior: 'Gruñido de Advertencia · Territorial', signal: 'Gruñido Continuo Bajo', confidence: 98 },
    { thought: '¡Eso es mío! No lo toques 👀', behavior: 'Defensa de Recursos', signal: 'Vocalización Baja en Recurso', confidence: 95 },
    { thought: '¡Modo caza activado! Grrr 🎮', behavior: 'Gruñido de Juego · Invitación', signal: 'Vocalización Baja en Juego', confidence: 89 },
    { thought: 'No me gusta esto... te vigilo 🤨', behavior: 'Gruñido de Disgusto · Incómodo', signal: 'Gruñido Bajo Intermitente', confidence: 93 }
  ],
  active: [
    { thought: '¡Sniff sniff! ¡Rastreando olor! 🔍', behavior: 'Búsqueda Silenciosa · Olfato', signal: 'Alto Movimiento + Bajo Vol', confidence: 95 },
    { thought: '¡Patrullando mi área! Todo despejado 🐾', behavior: 'Paseo de Patrulla · Revisión', signal: 'Patrón de Movimiento Regular', confidence: 93 },
    { thought: '¡Olor divertido! ¡Vamos! 🎾', behavior: 'Movimiento Espontáneo · Juego', signal: 'Movimiento Rápido + Orejas Adelante', confidence: 96 },
    { thought: '¡Quiero correr! A toda velocidad 🏃', behavior: 'Exceso de Energía · Ejercicio', signal: 'Tensión Corporal + Movimiento', confidence: 97 },
    { thought: '¡Revisaré todo! Tan ocupado 👀', behavior: 'Atención Multidireccional', signal: 'Cambio Rápido de Mirada', confidence: 91 }
  ],
  calm: [
    { thought: 'Junto a ti es lo mejor~ Tan feliz ☀️', behavior: 'Relajado · Señal de Confianza', signal: 'Bajo Movimiento + Respiración Normal', confidence: 98 },
    { thought: 'Sniff... ¿Comiste carne hoy? 👃', behavior: 'Análisis Olfativo · Búsqueda', signal: 'Expansión Nasal · Mov Lento', confidence: 92 },
    { thought: 'Sueño... Mis ojos se cierran 😴', behavior: 'Relajación Pre-sueño', signal: 'Membrana Nictitante Relajada', confidence: 96 },
    { thought: 'El paseo y comida fueron perfectos 🍖', behavior: 'Satisfecho Relajado · Serotonina', signal: 'Movimiento de Cola Bajo + Ojos Suaves', confidence: 99 },
    { thought: '¿De quién es este olor? Esperaré ⏳', behavior: 'Espera Pasiva · Estímulo', signal: 'Orejas Escuchando + Mov Bajo', confidence: 90 },
    { thought: '¡Te ves feliz! Yo también lo estoy 🐶', behavior: 'Sincronización Emocional', signal: 'Seguimiento de Mirada + Cola', confidence: 94 }
  ]
};

const filepath = path.join(__dirname, 'web-app/src/i18n/translations.ts');
let content = fs.readFileSync(filepath, 'utf8');

function inject(langContent, keySearch, scenariosObj) {
  const pieces = langContent.split(keySearch);
  const first = pieces[0];
  const second = pieces.slice(1).join(keySearch);
  const newStr = keySearch + ",\n      \"liveScenarios\": " + JSON.stringify(scenariosObj, null, 6);
  return first + newStr + second;
}

content = inject(content, '"afLock": "오토포커스"', scenariosKo);
content = inject(content, '"afLock": "Auto Focus"', scenariosEn);
content = inject(content, '"afLock": "オートフォーカス"', scenariosJa);
content = inject(content, '"afLock": "Enfoque Automático"', scenariosEs);

fs.writeFileSync(filepath, content);
console.log("Translations updated");
