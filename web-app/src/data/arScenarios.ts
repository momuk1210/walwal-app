export interface LiveScenario {
  thought: string;
  behavior: string;
  signal: string;
  confidence: number;
}

export type DogBehaviorState = 'bark' | 'whine' | 'growl' | 'active' | 'calm';

export interface Pack3Turn {
  stage: string;
  dogs: { thought: string; behavior: string; conf: number }[];
}

export const AR_SCENARIOS_I18N: Record<string, {
  live: Record<DogBehaviorState, LiveScenario[]>;
  pack3: Pack3Turn[];
}> = {
  ko: {
    live: {
      bark: [
        { thought: '야!! 거기 누구야! 내 구역이다 멍멍!!', behavior: '경계 짖음 · 영역 방어 반응 97%', signal: '고음량 짖음 감지', confidence: 97 },
        { thought: '집사 온다!! 나 여기 있어 멍!!', behavior: '환영 짖음 · 재회 흥분 99%', signal: '반복 짖음 패턴 감지', confidence: 99 },
        { thought: '냄새가 이상해! 조심해 멍멍!!', behavior: '경보 짖음 · 위협 인식 94%', signal: '연속 짖음 버스트 감지', confidence: 94 },
        { thought: '저 소리 들었어?! 나한테 맡겨 멍!!', behavior: '탐지 짖음 · 청각 자극 반응 96%', signal: '외부 자극 반응 짖음', confidence: 96 },
        { thought: '빨리 문 열어! 나가고 싶다 멍!!', behavior: '요구 짖음 · 행동 촉구 98%', signal: '간헐적 요구 짖음 감지', confidence: 98 }
      ],
      whine: [
        { thought: '집사 어디 가... 나 혼자 두고 가지마', behavior: '분리 불안 신호 · 애착 표현 96%', signal: '고주파 낑낑 감지', confidence: 96 },
        { thought: '배고파... 고기 줘... 꼬르륵', behavior: '식욕 호소 신호 · 요구 표현 94%', signal: '지속 고주파 발성 감지', confidence: 94 },
        { thought: '발바닥이 이상해... 아픈 거 같아', behavior: '통증/불편 신호 · 주의 필요 88%', signal: '낮은 낑낑 + 자세 변화', confidence: 88 },
        { thought: '너무 신나! 빨리 산책 가자 낑낑!', behavior: '흥분 억제 신호 · 기대감 95%', signal: '흥분성 고주파 발성', confidence: 95 },
        { thought: '무서운 냄새... 집사 옆에 딱 붙어있어야지', behavior: '불안 카밍 신호 · 보호 요청 91%', signal: '불안성 낑낑 발성', confidence: 91 }
      ],
      growl: [
        { thought: '가까이 오지 마. 여긴 내 구역이야', behavior: '경고 그로울 · 영역 주장 98%', signal: '저주파 지속 그로울 감지', confidence: 98 },
        { thought: '저거 내 거야! 건들지 마', behavior: '자원 방어 그로울 · 소유 반응 95%', signal: '자원 앞 저주파 발성', confidence: 95 },
        { thought: '나 지금 사냥 놀이 모드다! 어흥', behavior: '플레이 그로울 · 놀이 초대 89%', signal: '플레이 중 저주파 발성', confidence: 89 },
        { thought: '뭔가 맘에 안 들어... 지켜보고 있다', behavior: '불만 그로울 · 불쾌 신호 93%', signal: '간헐적 저주파 그로울', confidence: 93 }
      ],
      active: [
        { thought: '뭔가 있다 킁킁! 냄새 추적 시작!', behavior: '무성 탐색 · 후각 주도 이동 95%', signal: '고모션 + 저음량 · 탐색 행동', confidence: 95 },
        { thought: '내 구역 순찰 중! 이상 무', behavior: '순찰 보행 · 영역 확인 행동 93%', signal: '규칙적 이동 패턴 감지', confidence: 93 },
        { thought: '저기 꿀잼 냄새! 빨리 가보자', behavior: '자발적 이동 · 놀이 탐색 96%', signal: '빠른 이동 + 귀 전방 직립', confidence: 96 },
        { thought: '달리고 싶어! 전속력으로 고고', behavior: '과잉 에너지 · 운동 욕구 97%', signal: '전신 근육 긴장 + 이동 반복', confidence: 97 },
        { thought: '여기도 저기도 다 볼 거야! 바쁘다 바빠', behavior: '다방향 주의 · 활발 탐색 91%', signal: '빠른 시선 이동 + 체중 전방', confidence: 91 }
      ],
      calm: [
        { thought: '집사 옆이 최고야~ 행복해', behavior: '이완 안정 · 신뢰 유대 신호 98%', signal: '낮은 모션 + 정상 호흡', confidence: 98 },
        { thought: '킁킁... 집사 오늘 고기 먹었네?', behavior: '후각 환경 분석 · 이완 탐색 92%', signal: '비강 확장 · 느린 이동', confidence: 92 },
        { thought: '졸려... 눈이 자꾸 감긴다', behavior: '수면 전 이완 · 경계 완화 96%', signal: '순막 이완 + 호흡 느림', confidence: 96 },
        { thought: '오늘 산책도 밥도 완벽했다', behavior: '만족 이완 · 세로토닌 상태 99%', signal: '꼬리 낮은 와깅 + 눈 부드러움', confidence: 99 },
        { thought: '누구 냄새지? 기다려볼까', behavior: '수동 대기 · 자극 기다림 90%', signal: '귀 측면 경청 + 저모션', confidence: 90 },
        { thought: '집사 기분 좋아보이네! 나도 좋다', behavior: '정서 동기화 · 공감 반응 94%', signal: '시선 추적 + 꼬리 서행 와깅', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: '1단계: 시선 고정 & 간식 냄새 포착',
        dogs: [
          { thought: '오! 주머니에 간식 냄새 킁킁!', behavior: '귀 32° 전방 직립 · 호기심 96%', conf: 96 },
          { thought: '형아 폼 미쳤다! 내가 제일 먼저 꼬리친다 멍!', behavior: '가슴 활짝 폄 · 리더십 자세 98%', conf: 98 },
          { thought: '얌전히 있으면 간식 떨어지겠지? 헤헤', behavior: '고개 15° 갸우뚱 · 애교 신호 97%', conf: 97 }
        ]
      },
      {
        stage: '2단계: 카밍 시그널 & 착한 척하기',
        dogs: [
          { thought: '앞발 모았으니까 얼른 찍고 간식 줘!', behavior: '앞발런지 교차 · 대기 신호 95%', conf: 95 },
          { thought: '오늘 산책 완벽했지? 꼬리 살랑~', behavior: '꼬리 수평 3.1Hz 와깅 · 호의 99%', conf: 99 },
          { thought: '손이 주머니로 간다! 드디어 나온다 멍!', behavior: '입술 이완 헐떡임 · 기대감 98%', conf: 98 }
        ]
      },
      {
        stage: '3단계: 간식 쟁탈전 & 합동 애교 발사',
        dogs: [
          { thought: '형아들 비켜! 간식은 내가 먼저!', behavior: '체중 전방 이동 · 적극 탐색 97%', conf: 97 },
          { thought: '막내야 줄 서! 하나씩 먹어야 착한 댕댕이지!', behavior: '귀 쫑긋 정렬 · 맏형 모드 98%', conf: 98 },
          { thought: '냠냠 최고다 멍! 다 먹고 뛰자!', behavior: '프로펠러 꼬리 와깅 · 극찬 케미 99%', conf: 99 }
        ]
      }
    ]
  },
  zh: {
    live: {
      bark: [
        { thought: '喂！！那边是谁！这是我的领地！汪汪！！', behavior: '警惕吠叫 · 领地防御 97%', signal: '检测到高分贝吠叫', confidence: 97 },
        { thought: '主人回来啦！！我在这儿呢！汪！', behavior: '欢迎吠叫 · 重逢兴奋 99%', signal: '检测到重复吠叫', confidence: 99 },
        { thought: '气味有点奇怪！小心点！汪汪！', behavior: '警戒吠叫 · 威胁识别 94%', signal: '检测到急促吠叫', confidence: 94 },
        { thought: '听见那声音了吗？！交给我吧！汪！', behavior: '警觉吠叫 · 听觉刺激 96%', signal: '检测到外界刺激叫声', confidence: 96 },
        { thought: '快开门！我要出去散步！汪汪！', behavior: '请求吠叫 · 迫切外出 98%', signal: '检测到持续诉求叫声', confidence: 98 }
      ],
      whine: [
        { thought: '主人要去哪… 别留我一只狗在家呜呜', behavior: '分离焦虑 · 依恋表现 96%', signal: '检测到高频呜咽声', confidence: 96 },
        { thought: '肚子好饿… 给我肉肉吃… 咕噜噜', behavior: '求食信号 · 需求表达 94%', signal: '持续高频呜咽发声', confidence: 94 },
        { thought: '小肉垫感觉怪怪的… 好像有点痛', behavior: '不适信号 · 需注意观察 88%', signal: '低沉呜咽 + 姿势改变', confidence: 88 },
        { thought: '好兴奋！快带我出去玩嘛呜呜！', behavior: '兴奋抑制 · 强烈期待 95%', signal: '兴奋性高频发声', confidence: 95 },
        { thought: '有害怕的气味… 我要紧挨着主人', behavior: '安定信号 · 寻求保护 91%', signal: '焦虑呜咽发声', confidence: 91 }
      ],
      growl: [
        { thought: '不要靠近我！这是我的地盘！', behavior: '示警低吼 · 宣告领地 98%', signal: '持续低频低吼', confidence: 98 },
        { thought: '那是我的玩具！不许碰！', behavior: '护物低吼 · 占有反应 95%', signal: '护卫低频发声', confidence: 95 },
        { thought: '我现在是捕猎游戏模式！嗷呜～', behavior: '游戏低吼 · 邀请玩耍 89%', signal: '玩耍伴随低吼', confidence: 89 },
        { thought: '有点不顺心… 我正在盯着你呢', behavior: '不悦低吼 · 警告信号 93%', signal: '间歇性低频示警', confidence: 93 }
      ],
      active: [
        { thought: '发现线索了嗅嗅！追踪气味开始！', behavior: '专注嗅闻 · 探索行进 95%', signal: '高动作 + 静音探索', confidence: 95 },
        { thought: '正在巡逻我的地盘！一切正常！', behavior: '巡视步态 · 确认环境 93%', signal: '规律巡视移动', confidence: 93 },
        { thought: '那边有超好玩的味道！快过去看看！', behavior: '自主探索 · 寻找乐趣 96%', signal: '敏捷移动 + 耳朵前竖', confidence: 96 },
        { thought: '好想狂奔！全速前进冲冲冲！', behavior: '活力过剩 · 运动欲望 97%', signal: '肌肉紧绷 + 奔跑姿态', confidence: 97 },
        { thought: '这里那里我都想闻个遍！忙得很呢！', behavior: '多方位注意力 · 活跃探索 91%', signal: '视线快速转移 + 前倾', confidence: 91 }
      ],
      calm: [
        { thought: '待在主人身边最幸福啦～', behavior: '极度放松 · 信任依恋 98%', signal: '平稳动作 + 正常呼吸', confidence: 98 },
        { thought: '嗅嗅… 主人今天偷偷吃肉了吧？', behavior: '嗅觉分析 · 悠闲探索 92%', signal: '鼻翼微动 + 缓慢踱步', confidence: 92 },
        { thought: '好困呀… 眼睛快要睁不开了', behavior: '睡前放松 · 放下戒备 96%', signal: '眼睑放松 + 呼吸平缓', confidence: 96 },
        { thought: '今天的散步和饭饭都很完美！满足！', behavior: '满足安详 · 快乐分泌 99%', signal: '尾巴轻摆 + 眼神温和', confidence: 99 },
        { thought: '是谁的味道呢？等等看吧', behavior: '被动等候 · 观察刺激 90%', signal: '耳朵侧转 + 安静等待', confidence: 90 },
        { thought: '主人心情看起来很好！我也好开心！', behavior: '情绪同步 · 共情反应 94%', signal: '视线注视 + 慢速摇尾', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: '第1阶段：锁定视线 & 嗅到零食',
        dogs: [
          { thought: '哇！口袋里有零食的香味！嗅嗅！', behavior: '耳朵前竖32° · 充满好奇 96%', conf: 96 },
          { thought: '大哥帅呆了！我先摇尾巴示好汪！', behavior: '挺起胸膛 · 首领姿态 98%', conf: 98 },
          { thought: '乖乖坐好就会掉肉干吧？嘿嘿', behavior: '歪头15° · 撒娇卖萌 97%', conf: 97 }
        ]
      },
      {
        stage: '第2阶段：安定信号 & 乖巧营业',
        dogs: [
          { thought: '前爪并拢摆好pose啦，拍完快给肉干！', behavior: '前肢平放 · 等待口令 95%', conf: 95 },
          { thought: '今天散步超级棒对吧？尾巴摇摇～', behavior: '水平摇尾3.1Hz · 友好 99%', conf: 99 },
          { thought: '手往口袋里摸了！终于要掏出来啦汪！', behavior: '嘴唇微张 · 满满期待 98%', conf: 98 }
        ]
      },
      {
        stage: '第3阶段：零食争夺 & 联合撒娇',
        dogs: [
          { thought: '哥哥们让开！美味零食我先吃！', behavior: '重心前移 · 积极争抢 97%', conf: 97 },
          { thought: '小老弟排好队！排队吃才是乖狗狗！', behavior: '耳朵竖直 · 大哥风范 98%', conf: 98 },
          { thought: '好好吃汪！吃完一起去草坪赛跑！', behavior: '螺旋式摇尾 · 超高默契 99%', conf: 99 }
        ]
      }
    ]
  },
  en: {
    live: {
      bark: [
        { thought: 'Hey!! Who is there?! My turf! Woof!!', behavior: 'Alert Bark · Territory Defense 97%', signal: 'Loud Bark Detected', confidence: 97 },
        { thought: 'Human is back!! I am right here! Woof!!', behavior: 'Welcome Bark · Excited Reunion 99%', signal: 'Repetitive Bark Pattern', confidence: 99 },
        { thought: 'Weird smell! Be careful! Woof!!', behavior: 'Alarm Bark · Threat Notice 94%', signal: 'Continuous Burst Bark', confidence: 94 },
        { thought: 'Hear that?! Leave it to me! Woof!!', behavior: 'Detection Bark · Auditory Stimulus 96%', signal: 'External Stimulus Reaction', confidence: 96 },
        { thought: 'Open the door quick! Wanna go out! Woof!!', behavior: 'Demand Bark · Urging Action 98%', signal: 'Intermittent Demand Bark', confidence: 98 }
      ],
      whine: [
        { thought: 'Where are you going... Don\'t leave me alone', behavior: 'Separation Anxiety · Attachment 96%', signal: 'High-Pitch Whine Detected', confidence: 96 },
        { thought: 'So hungry... Need meat treats...', behavior: 'Hunger Appeal · Demand Whine 94%', signal: 'Sustained High Whine', confidence: 94 },
        { thought: 'My paw feels funny... A bit sore', behavior: 'Discomfort Signal · Needs Attention 88%', signal: 'Low Whine + Stance Shift', confidence: 88 },
        { thought: 'So thrilled! Let\'s go for walkies whine!', behavior: 'Excitement Overflow · High Hope 95%', signal: 'High-Frequency Excited Whine', confidence: 95 },
        { thought: 'Scary scent... Staying right by human', behavior: 'Calming Signal · Seeking Protection 91%', signal: 'Anxious Whine Vocalization', confidence: 91 }
      ],
      growl: [
        { thought: 'Back off! This is my spot!', behavior: 'Warning Growl · Territorial 98%', signal: 'Low-Frequency Continuous Growl', confidence: 98 },
        { thought: 'That\'s mine! Don\'t touch!', behavior: 'Resource Guarding Growl 95%', signal: 'Low Growl Over Resource', confidence: 95 },
        { thought: 'Game mode ON! Grrr let\'s play!', behavior: 'Play Growl · Playful Invite 89%', signal: 'Playful Vocalization', confidence: 89 },
        { thought: 'Not happy about this... Watching you', behavior: 'Discontent Growl · Warning 93%', signal: 'Intermittent Low Growl', confidence: 93 }
      ],
      active: [
        { thought: 'Found something! Scent tracking start!', behavior: 'Silent Search · Olfactory Movement 95%', signal: 'High Motion + Silent Sniffing', confidence: 95 },
        { thought: 'Patrolling my territory! All clear!', behavior: 'Patrol Gait · Checking Area 93%', signal: 'Regular Motion Tracking', confidence: 93 },
        { thought: 'Exciting smell ahead! Let\'s hurry!', behavior: 'Self-Driven Move · Play Search 96%', signal: 'Rapid Move + Pricked Ears', confidence: 96 },
        { thought: 'Wanna run fast! Full speed ahead!', behavior: 'High Energy · Exercise Drive 97%', signal: 'Tense Muscles + Running Pace', confidence: 97 },
        { thought: 'Gotta check everything! Busy busy!', behavior: 'Multi-Direction Focus · Active 91%', signal: 'Fast Glances + Forward Weight', confidence: 91 }
      ],
      calm: [
        { thought: 'Best place is beside my human~ Happy', behavior: 'Deep Relax · Trust Bond 98%', signal: 'Low Motion + Normal Breathing', confidence: 98 },
        { thought: 'Sniff... Human ate something good today?', behavior: 'Olfactory Exploration · Relaxed 92%', signal: 'Slow Movement + Sniffing', confidence: 92 },
        { thought: 'Sleepy... Eyes getting so heavy', behavior: 'Pre-Sleep Relax · Lowered Guard 96%', signal: 'Gentle Breathing + Droopy Eyes', confidence: 96 },
        { thought: 'Walk and dinner were both perfect today', behavior: 'Satisfied Relax · Serotonin Boost 99%', signal: 'Soft Tail Wag + Soft Eyes', confidence: 99 },
        { thought: 'Whose scent is this? Let\'s wait and see', behavior: 'Passive Wait · Observing Stimulus 90%', signal: 'Attentive Ears + Low Motion', confidence: 90 },
        { thought: 'Human looks happy! I\'m happy too!', behavior: 'Emotional Sync · Empathy Response 94%', signal: 'Eye Contact + Gentle Wag', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: 'Stage 1: Locked Eyes & Catching Snack Scent',
        dogs: [
          { thought: 'Sniff sniff! Treats in the pocket!', behavior: 'Ears Pricked 32° · Curious 96%', conf: 96 },
          { thought: 'Big brother looks cool! I\'ll wag first woof!', behavior: 'Chest Out · Leader Posture 98%', conf: 98 },
          { thought: 'If I sit still, treats will drop right? Hehe', behavior: 'Head Tilt 15° · Cute Charm 97%', conf: 97 }
        ]
      },
      {
        stage: 'Stage 2: Calming Signals & Being a Good Dog',
        dogs: [
          { thought: 'Paws together! Take photo and give treats!', behavior: 'Paws Front · Waiting Signal 95%', conf: 95 },
          { thought: 'Great walk today right? Tail wagging~', behavior: 'Tail Wag 3.1Hz · Friendly 99%', conf: 99 },
          { thought: 'Hand is moving to pocket! Here it comes woof!', behavior: 'Relaxed Panting · High Hope 98%', conf: 98 }
        ]
      },
      {
        stage: 'Stage 3: Treat Rush & Collective Cuteness',
        dogs: [
          { thought: 'Out of the way! Treats are mine first!', behavior: 'Forward Lean · Active Pursuit 97%', conf: 97 },
          { thought: 'Little bro get in line! One by one!', behavior: 'Ears Aligned · Eldest Mode 98%', conf: 98 },
          { thought: 'Yummy best day ever! Let\'s run after this!', behavior: 'Propeller Wag · Peak Chemistry 99%', conf: 99 }
        ]
      }
    ]
  },
  ja: {
    live: {
      bark: [
        { thought: 'おい！！誰だ！僕の縄張りだワン！！', behavior: '警戒吠え · 縄張り防衛 97%', signal: '高音量吠え声検知', confidence: 97 },
        { thought: '飼い主さん来た！！僕ここだよワン！！', behavior: '歓迎吠え · 再会の興奮 99%', signal: '反復吠えパターン検知', confidence: 99 },
        { thought: '変な匂いがする！気をつけてワン！！', behavior: '警報吠え · 脅威認識 94%', signal: '連続バースト吠え検知', confidence: 94 },
        { thought: '今の音聞いた？！僕に任せてワン！！', behavior: '探知吠え · 聴覚刺激 96%', signal: '外部刺激への反応', confidence: 96 },
        { thought: '早くドア開けて！お散歩行こうワン！！', behavior: '要求吠え · 行動催促 98%', signal: '要求吠え声検知', confidence: 98 }
      ],
      whine: [
        { thought: 'どこ行くの… 一人にしないでクゥン', behavior: '分離不安 · 愛情アピール 96%', signal: '高周波鳴き声検知', confidence: 96 },
        { thought: 'お腹空いた… お肉ちょうだい…', behavior: '食欲アピール · 要求表現 94%', signal: '持続的高周波鳴き声', confidence: 94 },
        { thought: '足が痛いかも…', behavior: '違和感シグナル · 要注意 88%', signal: '低いクゥン鳴き + 姿勢変化', confidence: 88 },
        { thought: '嬉しすぎる！早くお散歩行こう！', behavior: '興奮抑制 · 期待感 95%', signal: '興奮性高周波鳴き声', confidence: 95 },
        { thought: '怖い匂い… 飼い主さんの隣にいよう', behavior: '不安カーミング · 保護要求 91%', signal: '不安鸣き声検知', confidence: 91 }
      ],
      growl: [
        { thought: '近づかないで。僕の場所だぞ', behavior: '警告威嚇 · 縄張り主張 98%', signal: '低周波持続グロウル', confidence: 98 },
        { thought: 'それは僕の宝物だ！触るな', behavior: '所有防衛 · 守り行動 95%', signal: '所有物前の低周波発声', confidence: 95 },
        { thought: '今ハンティングごっこ中！ウゥー！', behavior: 'プレイ威嚇 · 遊びの誘い 89%', signal: '遊び中の低周波発声', confidence: 89 },
        { thought: 'なんか気に食わない… 見張ってるぞ', behavior: '不満威嚇 · 不快シグナル 93%', signal: '断続的低周波威嚇', confidence: 93 }
      ],
      active: [
        { thought: '何かいるクンクン！匂い追跡スタート！', behavior: '無声探索 · 嗅覚主導移動 95%', signal: '高モーション + 静かな探索', confidence: 95 },
        { thought: '縄張りをパトロール中！異常なし！', behavior: 'パトロール歩行 · 巡回行動 93%', signal: '規則的移動パターン', confidence: 93 },
        { thought: 'あっちから楽しそうな匂い！早く行こう', behavior: '自発的移動 · 遊びの探索 96%', signal: '素早い移動 + 耳前向き', confidence: 96 },
        { thought: '全力で走りたい！ダッシュだ！', behavior: 'エネルギー過剰 · 運動欲求 97%', signal: '筋肉緊張 + 走行態勢', confidence: 97 },
        { thought: 'ここもあそこも見なきゃ！忙しい忙しい', behavior: '多方向への関心 · 活発探索 91%', signal: '素早い視線移動 + 前傾', confidence: 91 }
      ],
      calm: [
        { thought: '飼い主さんの隣が一番落ち着く〜幸せ', behavior: 'リラックス · 信頼シグナル 98%', signal: '低モーション + 正常呼吸', confidence: 98 },
        { thought: 'クンクン… 今日美味しいもの食べたでしょ？', behavior: '嗅覚分析 · ゆったり探索 92%', signal: 'ゆっくり移動 + 嗅覚動作', confidence: 92 },
        { thought: '眠い… 目がとろんとしてきた', behavior: '睡眠前リラックス · 警戒解除 96%', signal: '呼吸ゆっくり + 目がトロン', confidence: 96 },
        { thought: '今日のお散歩もご飯も最高だったワン', behavior: '満足リラックス · 幸福感 99%', signal: '尻尾ゆっくり + 優しい表情', confidence: 99 },
        { thought: '誰の匂いかな？待ってみよう', behavior: '待機行動 · 刺激待ち 90%', signal: '耳側方 + じっと待機', confidence: 90 },
        { thought: '飼い主さん楽しそう！僕も嬉しいワン！', behavior: '感情同調 · 共感反応 94%', signal: '視線合わせ + 尻尾フリフリ', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: 'ステップ1: 視線固定とおやつの匂い',
        dogs: [
          { thought: 'あっ！ポケットからおやつのいい匂い！', behavior: '耳32°直立 · 好奇心 96%', conf: 96 },
          { thought: '兄貴カッコいい！僕が一番に尻尾振るぞワン！', behavior: '胸張り · リーダー姿勢 98%', conf: 98 },
          { thought: 'お利口にしてたらおやつ落ちてくるよね？えへへ', behavior: '首15°かしげ · 愛嬌 97%', conf: 97 }
        ]
      },
      {
        stage: 'ステップ2: カーミングシグナルとお利口ポーズ',
        dogs: [
          { thought: '前足揃えたから早く撮っておやつ頂戴！', behavior: '前足揃え · 待機シグナル 95%', conf: 95 },
          { thought: '今日のお散歩完璧だったでしょ？フリフリ〜', behavior: '尻尾3.1Hzワギング · 好意 99%', conf: 99 },
          { thought: '手がおやつに向かった！いよいよ出るぞワン！', behavior: '表情リラックス · 期待 98%', conf: 98 }
        ]
      },
      {
        stage: 'ステップ3: おやつ争奪戦と合同アピール',
        dogs: [
          { thought: 'お兄ちゃん達どいて！おやつは僕が先！', behavior: '重心前傾 · 積極アピール 97%', conf: 97 },
          { thought: '末っ子並んで！順番に食べるのが良い子だ！', behavior: '耳ピン直立 · 長男モード 98%', conf: 98 },
          { thought: 'うまうま最高だワン！食べたら走ろう！', behavior: 'プロペラ尻尾 · 抜群の相性 99%', conf: 99 }
        ]
      }
    ]
  },
  es: {
    live: {
      bark: [
        { thought: '¡¡Oye!! ¿Quién anda ahí? ¡Mi territorio! ¡Guau!', behavior: 'Ladrido de alerta · Defensa 97%', signal: 'Ladrido fuerte detectado', confidence: 97 },
        { thought: '¡Llegó mi humano! ¡Aquí estoy! ¡Guau!', behavior: 'Ladrido de bienvenida · Alegría 99%', signal: 'Patrón de ladrido repetitivo', confidence: 99 },
        { thought: '¡Olor raro! ¡Ten cuidado! ¡Guau!', behavior: 'Ladrido de alarma · Detección 94%', signal: 'Ráfaga de ladridos continua', confidence: 94 },
        { thought: '¿Oíste eso? ¡Déjamelo a mí! ¡Guau!', behavior: 'Ladrido detector · Estímulo 96%', signal: 'Reacción a estímulo exterior', confidence: 96 },
        { thought: '¡Abre la puerta ya! ¡Quiero pasear! ¡Guau!', behavior: 'Ladrido de petición · Paseo 98%', signal: 'Ladrido exigente detectado', confidence: 98 }
      ],
      whine: [
        { thought: '¿A dónde vas...? No me dejes solito', behavior: 'Ansiedad por separación · Cariño 96%', signal: 'Gemido agudo detectado', confidence: 96 },
        { thought: 'Tengo hambre... Dame premios ricos...', behavior: 'Petición de comida · Gemido 94%', signal: 'Gemido continuo detectado', confidence: 94 },
        { thought: 'Mi patita se siente rara... Me duele un poco', behavior: 'Molestia · Requiere atención 88%', signal: 'Gemido suave + cambio de postura', confidence: 88 },
        { thought: '¡Qué emoción! ¡Vamos de paseo ya!', behavior: 'Emoción desbordada · Ilusión 95%', signal: 'Gemido agudo de alegría', confidence: 95 },
        { thought: 'Olor extraño... Me quedo pegado a mi humano', behavior: 'Señal de calma · Protección 91%', signal: 'Gemido de inseguridad', confidence: 91 }
      ],
      growl: [
        { thought: '¡No te acerques! Esta es mi zona', behavior: 'Gruñido de aviso · Territorial 98%', signal: 'Gruñido grave continuo', confidence: 98 },
        { thought: '¡Eso es mío! ¡Ni lo toques!', behavior: 'Protección de objeto · Posesión 95%', signal: 'Gruñido sobre recurso', confidence: 95 },
        { thought: '¡Modo cacería activado! ¡Grrr vamos a jugar!', behavior: 'Gruñido de juego · Invitación 89%', signal: 'Gruñido juguetón', confidence: 89 },
        { thought: 'Algo no me gusta... Te estoy vigilando', behavior: 'Gruñido de queja · Disgusto 93%', signal: 'Gruñido de advertencia', confidence: 93 }
      ],
      active: [
        { thought: '¡Hay algo aquí! ¡Rastreo iniciado!', behavior: 'Búsqueda silenciosa · Olfato 95%', signal: 'Gran movimiento + rastreo', confidence: 95 },
        { thought: '¡Patrullando mi territorio! Todo despejado', behavior: 'Paso de patrulla · Inspección 93%', signal: 'Patrón de movimiento rítmico', confidence: 93 },
        { thought: '¡Huele a diversión por allá! ¡Vamos rápido!', behavior: 'Exploración activa · Curiosidad 96%', signal: 'Paso ágil + orejas alzadas', confidence: 96 },
        { thought: '¡Quiero correr a toda velocidad!', behavior: 'Energía alta · Ganas de correr 97%', signal: 'Músculos listos para carrera', confidence: 97 },
        { thought: '¡Quiero oler todo aquí y allá! ¡Qué día!', behavior: 'Atención múltiple · Activo 91%', signal: 'Mirada rápida + postura alerta', confidence: 91 }
      ],
      calm: [
        { thought: 'Al lado de mi humano se está genial~ Feliz', behavior: 'Relax profundo · Vínculo 98%', signal: 'Poco movimiento + respiración suave', confidence: 98 },
        { thought: 'Sniff... ¿Mi humano comió algo rico hoy?', behavior: 'Exploración olfativa relajada 92%', signal: 'Movimiento lento + olfateo', confidence: 92 },
        { thought: 'Qué sueño... Se me cierran los ojitos', behavior: 'Relajación pre-siesta · Guardia baja 96%', signal: 'Respiración tranquila + ojos pesados', confidence: 96 },
        { thought: 'El paseo y la comida estuvieron perfectos', behavior: 'Satisfacción plena · Bienestar 99%', signal: 'Cola suave + mirada tierna', confidence: 99 },
        { thought: '¿De quién es este olor? Esperaré a ver', behavior: 'Espera pasiva · Atento 90%', signal: 'Orejas atentas + postura quieta', confidence: 90 },
        { thought: '¡Mi humano se ve feliz! ¡Yo también!', behavior: 'Empatía canina · Sincronización 94%', signal: 'Contacto visual + cola feliz', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: 'Paso 1: Mirada Fija y Olor a Premios',
        dogs: [
          { thought: '¡Huelo premios en el bolsillo! ¡Sniff!', behavior: 'Orejas erguidas 32° · Curioso 96%', conf: 96 },
          { thought: '¡El hermano mayor se ve genial! ¡Muevo la cola primero!', behavior: 'Pecho erguido · Porte de líder 98%', conf: 98 },
          { thought: 'Si me porto bien, ¿me cae premio? Jeje', behavior: 'Cabeza ladeada 15° · Tierno 97%', conf: 97 }
        ]
      },
      {
        stage: 'Paso 2: Señales de Calma y Pose de Buen Chico',
        dogs: [
          { thought: '¡Patitas juntas! ¡Toma la foto y dame premio!', behavior: 'Patas alineadas · Espera 95%', conf: 95 },
          { thought: '¿El paseo de hoy fue perfecto, verdad? Moviendo cola~', behavior: 'Movimiento de cola 3.1Hz 99%', conf: 99 },
          { thought: '¡Su mano va al bolsillo! ¡Ya viene el premio!', behavior: 'Boca relajada · Gran ilusión 98%', conf: 98 }
        ]
      },
      {
        stage: 'Paso 3: Lluvia de Premios y Ternura Grupal',
        dogs: [
          { thought: '¡Hermanos a un lado! ¡El premio es mío primero!', behavior: 'Inclinación frontal · Activo 97%', conf: 97 },
          { thought: '¡Hermanito haz fila! ¡Uno a uno con orden!', behavior: 'Orejas firmes · Modo hermano mayor 98%', conf: 98 },
          { thought: '¡Qué delicia guau! ¡A correr después de comer!', behavior: 'Cola en hélice · Gran química 99%', conf: 99 }
        ]
      }
    ]
  },
  fr: {
    live: {
      bark: [
        { thought: 'Hé !! Qui est là ?! C\'est mon territoire ! Ouaf !!', behavior: 'Aboiement d\'alerte · Défense 97%', signal: 'Aboiement sonore détecté', confidence: 97 },
        { thought: 'Mon humain arrive !! Je suis là ! Ouaf !!', behavior: 'Aboiement de fête · Retrouvailles 99%', signal: 'Aboiement joyeux répété', confidence: 99 },
        { thought: 'Odeur bizarre ! Attention ! Ouaf !!', behavior: 'Aboiement d\'alarme · Danger 94%', signal: 'Rafale d\'aboiements continus', confidence: 94 },
        { thought: 'Tu as entendu ça ?! Laisse-moi gérer ! Ouaf !!', behavior: 'Aboiement de détection · Éveil 96%', signal: 'Réaction aux bruits extérieurs', confidence: 96 },
        { thought: 'Ouvre vite la porte ! Je veux sortir ! Ouaf !!', behavior: 'Aboiement d\'insistance · Promenade 98%', signal: 'Aboiement de demande détecté', confidence: 98 }
      ],
      whine: [
        { thought: 'Où vas-tu... Ne me laisse pas tout seul', behavior: 'Anxiété de séparation · Attachement 96%', signal: 'Gémissement aigu détecté', confidence: 96 },
        { thought: 'J\'ai faim... Donne-moi une friandise...', behavior: 'Demande de nourriture · Gémissement 94%', signal: 'Gémissement continu détecté', confidence: 94 },
        { thought: 'Ma patte me fait bizarre... Ça fait un peu mal', behavior: 'Inconfort · Attention requise 88%', signal: 'Gémissement doux + changement de posture', confidence: 88 },
        { thought: 'Trop excité ! En route pour la promenade !', behavior: 'Excitation débordante · Impatience 95%', signal: 'Gémissement aigu d\'excitation', confidence: 95 },
        { thought: 'Odeur effrayante... Je reste collé à mon maître', behavior: 'Signal d\'apaisement · Protection 91%', signal: 'Gémissement d\'insécurité', confidence: 91 }
      ],
      growl: [
        { thought: 'Ne t\'approche pas ! C\'est mon endroit !', behavior: 'Grognement d\'avertissement 98%', signal: 'Grognement grave continu', confidence: 98 },
        { thought: 'C\'est à moi ! N\'y touche pas !', behavior: 'Protection d\'objet · Possession 95%', signal: 'Grognement de garde d\'objet', confidence: 95 },
        { thought: 'Mode jeu activé ! Grrr viens jouer !', behavior: 'Grognement de jeu · Invitation 89%', signal: 'Vocalisation de jeu', confidence: 89 },
        { thought: 'Un truc me déplaît... Je te surveille', behavior: 'Grognement de mécontentement 93%', signal: 'Grognement d\'avertissement', confidence: 93 }
      ],
      active: [
        { thought: 'Il y a quelque chose ! Pistage olfactif lancé !', behavior: 'Recherche silencieuse · Olfaction 95%', signal: 'Grand mouvement + flairage', confidence: 95 },
        { thought: 'En patrouille sur mon territoire ! RAS !', behavior: 'Marche de patrouille · Inspection 93%', signal: 'Mouvement régulier détecté', confidence: 93 },
        { thought: 'Super odeur par là-bas ! Allons-y vite !', behavior: 'Exploration autonome · Curiosité 96%', signal: 'Allure vive + oreilles dressées', confidence: 96 },
        { thought: 'Envie de courir à toute vitesse ! C\'est parti !', behavior: 'Énergie débordante · Envie de courir 97%', signal: 'Muscles prêts pour la course', confidence: 97 },
        { thought: 'Je veux tout renifler partout ! Quelle journée !', behavior: 'Attention multidirectionnelle 91%', signal: 'Regard vif + posture alerte', confidence: 91 }
      ],
      calm: [
        { thought: 'Le meilleur endroit, c\'est près de mon humain~ Heureux', behavior: 'Relaxation profonde · Lien fort 98%', signal: 'Peu de mouvement + souffle paisible', confidence: 98 },
        { thought: 'Renifle... Mon maître a mangé un truc bon aujourd\'hui ?', behavior: 'Exploration olfactive détendue 92%', signal: 'Pas lents + reniflement doux', confidence: 92 },
        { thought: 'Sommeil... Mes paupières deviennent si lourdes', behavior: 'Détente avant sieste · Garde baissée 96%', signal: 'Respiration lente + yeux mi-clos', confidence: 96 },
        { thought: 'La balade et le repas étaient parfaits aujourd\'hui', behavior: 'Satisfaction totale · Bien-être 99%', signal: 'Queue douce + regard tendre', confidence: 99 },
        { thought: 'C\'est l\'odeur de qui ? Attendons voir', behavior: 'Attente passive · À l\'écoute 90%', signal: 'Oreilles attentives + corps calme', confidence: 90 },
        { thought: 'Mon maître a l\'air heureux ! Moi aussi alors !', behavior: 'Empathie canine · Synchronisation 94%', signal: 'Regard attentif + queue qui bat', confidence: 94 }
      ]
    },
    pack3: [
      {
        stage: 'Étape 1 : Regard Fixé & Odeur de Friandises',
        dogs: [
          { thought: 'Renifle renifle ! Des friandises dans la poche !', behavior: 'Oreilles dressées à 32° · Curieux 96%', conf: 96 },
          { thought: 'Le grand frère est trop classe ! Je remue la queue d\'abord !', behavior: 'Torse bombé · Allure de chef 98%', conf: 98 },
          { thought: 'Si je reste bien sage, j\'aurai une friandise ? Hihi', behavior: 'Tête penchée à 15° · Mignon 97%', conf: 97 }
        ]
      },
      {
        stage: 'Étape 2 : Signaux d\'Apaisement & Pose de Bon Chien',
        dogs: [
          { thought: 'Pattes bien alignées ! Prends la photo et donne !', behavior: 'Pattes avant prêtes · Attente 95%', conf: 95 },
          { thought: 'Super promenade aujourd\'hui non ? Queue qui bat~', behavior: 'Battement de queue 3.1Hz 99%', conf: 99 },
          { thought: 'La main va dans la poche ! Ça arrive enfin ouaf !', behavior: 'Bouche détendue · Plein d\'espoir 98%', conf: 98 }
        ]
      },
      {
        stage: 'Étape 3 : Ruée sur les Friandises & Câlin Collectif',
        dogs: [
          { thought: 'Poussez-vous les frères ! La friandise est à moi d\'abord !', behavior: 'Poussée vers l\'avant · Actif 97%', conf: 97 },
          { thought: 'Petit frère fais la queue ! Chacun son tour !', behavior: 'Oreilles droites · Rôle de grand frère 98%', conf: 98 },
          { thought: 'Miam quel régal ouaf ! On court après avoir mangé !', behavior: 'Queue en hélice · Parfaite entente 99%', conf: 99 }
        ]
      }
    ]
  }
};

export const getLiveDogScenarios = (lang: string = 'ko'): Record<DogBehaviorState, LiveScenario[]> => {
  return AR_SCENARIOS_I18N[lang]?.live || AR_SCENARIOS_I18N.ko.live;
};

export const getPack3Turns = (lang: string = 'ko'): Pack3Turn[] => {
  return AR_SCENARIOS_I18N[lang]?.pack3 || AR_SCENARIOS_I18N.ko.pack3;
};
