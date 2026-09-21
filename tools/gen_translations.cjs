const fs = require('fs');

const translations = {
  ko: {
    appTitle: 'WalWal AR ¡¤ °ßÁ¾ Æ¯È­ AI',
    subtitle: 'AI ½Ç½Ã°£ ¹ø¿ª±â',
    tabs: {
      ar: 'AR Åë¿ª',
      radar: '·¹ÀÌ´õ',
      studio: '¼ôÆû½ºÆ©µğ¿À',
      community: '»êÃ¥¸ğÀÓ',
      profile: '¸¶ÀÌÆê'
    },
    ar: {
      ethologyBtn: '°ßÁ¾Çàµ¿ÇĞ',
      liveWebcam: 'À¥Ä· ON',
      simulator: '½Ã¹Ä·¹ÀÌÅÍ',
      retranslate: '´Ù½Ã¹ø¿ª',
      captureShorts: '¼ôÆûÀúÀå',
      audioFreq: 'À½¼º ÁÖÆÄ¼ö °¨Áö',
      speechSuffix: 'ÀÇ ÁøÂ¥ ¼Ó¸¶À½',
      ethologyModalTitle: 'Çàµ¿ÇĞ(Ethology) ºĞ¼® ±âÁØ',
      tailInterpretation: '²¿¸® Èçµé±â ÇØ¼®',
      barkInterpretation: 'Â¢´Â ¼Ò¸® ÇØ¼®',
      personaTitle: '¼ºÇâ Æä¸£¼Ò³ª'
    },
    studio: {
      title: '°ßÁ¾ Æ¯È­ À¥Å÷ ½ºÆ©µğ¿À',
      subtitle: '°íÀ¯ ¼ºÇâÀÌ ±êµç ÀÎ½ºÅ¸/¼ôÆû ÄÆÅ÷ »ı¼º±â',
      removeWatermark: '¿öÅÍ¸¶Å© ¾ø¾Ö±â',
      reRollQuip: '´ë»ç ´Ù½Ã»Ì±â',
      downloadPng: 'À¥Å÷ ÄÆ PNG ´Ù¿î·Îµå',
      downloading: 'Ä«µå ·»´õ¸µ Áß...',
      watermarkFree: '? WalWal Pro VIP ¿öÅÍ¸¶Å© ¾øÀ½ (4K)',
      watermarkFreeTier: '? WalWal AI °ßÁ¾Æ¯È­ ¹ø¿ª (¹«·á ¹öÀü)'
    },
    radar: {
      title: '¿Ğ¿Ğ ·¹ÀÌ´õ',
      dogsNearby: 'ÁÖº¯ ¹İ°æ »êÃ¥ ÁßÀÎ ´ó´óÀÌ',
      startVirtualChat: '°¡»ó ´ëÈ­ Æ¼Å°Å¸Ä« ½Ã¹Ä·¹ÀÌ¼Ç',
      sendNote: '°ßÁÖ ÂÊÁö',
      myLocation: '³» À§Ä¡ (¼­¿ï½£ ¼º¼öµ¿)',
      apiKeyModalTitle: 'Google Maps JavaScript API Å° ¼³Á¤',
      apiKeyModalDesc: 'Google Cloud Console¿¡¼­ ¹ß±Ş¹ŞÀº API Å°¸¦ ÀÔ·ÂÇÏ½Ã¸é °ø½Ä ±¸±Û Áöµµ Å¸ÀÏ·Î Áï½Ã ÀüÈ¯µË´Ï´Ù.',
      mapTypeToggle: 'Áöµµ Å¸ÀÏ ÀüÈ¯'
    },
    pro: {
      badge: 'WALWAL PRO VIP',
      heading: '´ó´óÀÌÀÇ ¼Ó¸¶À½À»',
      highlight: 'ÇÑ°è ¾øÀÌ ¹«Á¦ÇÑÀ¸·Î ¿³º¸¼¼¿ä',
      tagline: 'Àü ¼¼°è ÆêÆÔÁ·À» À§ÇÑ ±Û·Î¹ú 1À§ AR ¹ø¿ª±â',
      benefit1: '½Ç½Ã°£ AR Åë¿ª & Æ¼Å°Å¸Ä« ¹«Á¦ÇÑ',
      benefit2: '¿öÅÍ¸¶Å© ¿ÏÀü Á¦°Å & 4K °íÈ­Áú ÀúÀå',
      benefit3: '¿Ğ¿Ğ ·¹ÀÌ´õ ¹İ°æ 5km ¹«Á¦ÇÑ È®Àå',
      benefit4: 'AI ¹İ·Á°ß À½¼º/Çàµ¿ Á¤¹Ğ ºĞ¼® ¸®Æ÷Æ®',
      cta: '7ÀÏ ¹«·á Ã¼Çè ½ÃÀÛÇÏ±â',
      activeText: 'ÀÌ¹Ì Pro ÇÃ·£ ÀÌ¿ë ÁßÀÔ´Ï´Ù',
      trialDesc: '7ÀÏ°£ 100% ¹«·á Ã¼Çè ¡¤ ÀÌÈÄ ¿ù $6.99 ÀÚµ¿ ÀüÈ¯'
    },
    breedQuips: {
      golden: {
        ko: ['¿Í! »õ·Î¿î Ä£±¸´Ù! ³ª¶û ´çÀå ³îÀÚ! ¿Â¸öÀ¸·Î È¯¿µÇØ!! ??', 'Àú±â Çü¾Æ ÁÖ¸Ó´Ï¿¡ ¼Ò½ÃÁö ³¿»õ ³­´Ù! ²¿¸® ¸ğÅÍ 300% °¡µ¿!! ??'],
        en: ['OMG a new friend! Play with me right now! I love everyone!! ??', 'I smell sausages in your pocket! Tail propeller at 300%!! ??'],
        ja: ['ªïª¡£¡ãæª·ª¤ªªéÒÓ¹ªÀ£¡ĞÑª¹ª°ìé?ªËë´ªÜª¦£¡£¡??', 'ª¢ªÎªªúüªµªóªÎ«İ«±«Ã«Èª«ªé«½?«»?«¸ªÎ?ª¤ª¬ª¹ªë£¡Í¶Ú­îïËÒ£¡£¡??'],
        es: ['¢®Un nuevo amigo! ¢®Juega conmigo ahora mismo! ¢®Los amo a todos! ??', '¢®Huelo salchichas en tu bolsillo! ¢®Cola a maxima velocidad! ??']
      },
      shiba: {
        ko: ['³Ê ³ªÇÑÅ× °ü½É °®Áö ¸¶¶ó. ²¿¸® Èçµç °Ç ±âºĞ ÁÁ¾Æ¼­°¡ ¾Æ´Ï¶ó ¹İµ¿ ÃßÁø·ÂÀÌ´Ù. ???', '´« ¸¶ÁÖÃÆ´Ù°í Ä£±¸ ¸ÔÀ» »ı°¢ ¸¶. ³» ÆÛ½º³Î ½ºÆäÀÌ½º 2¹ÌÅÍ À¯ÁöÇØ¶ó.'],
        en: ['Do not look at me. Wiggling my tail was just recoil propulsion. ???', 'Keep your 6-foot distance. We are not friends just because we made eye contact.'],
        ja: ['ŞçªË?ªïªëªÊ¡£Í¶Ú­ªòòÉªÃª¿ªÎªÏÚãÔÑªÎõÏòäÕôªÀ¡£???', 'ÙÍª¬ùêªÃª¿ª«ªéªÃªÆéÒÓ¹?ö¢ªêª¹ªëªÊ¡£2mªÎËå×îªòÜÁªÆ¡£'],
        es: ['No me mires. Mover la cola fue solo propulsion de retroceso. ???', 'Manten tu distancia de 2 metros. No somos amigos solo por cruzar miradas.']
      },
      maltese: {
        ko: ['¸»Æ¼Áî´Â ÂüÁö ¾Ê¾Æ! Áı»ç¾ß ³ªÇÑÅ× ÁıÁßÇØ! ´Ù¸¥ °³ ÃÄ´Ùº¸Áö ¸¶ ¾Ó¾Ó!! ??', '³»°¡ ±Í¿±´Ù°í ¸¸¸¸ÇÏ°Ô º¸Áö ¸¶¶ó! ³» ¾È¿¡ ¸Í¼öÀÇ ÇÇ°¡ Èå¸¥´Ù! ??'],
        en: ['Maltese never holds back! Human, focus on ME! Stop looking at other dogs! ??', 'Do not underestimate my cuteness! The blood of a fierce beast runs in me! ??'],
        ja: ['«Ş«ë«Á?«ºªÏä²Ø·ª·ªÊª¤£¡ª´ñ«ìÑ?¡¢ŞçªÀª±ªËó¢ñéª·ªÆ£¡öâªÎÌ³ªòÌ¸ªÊª¤ªÇ£¡??', 'Ê¦äñª¤ª«ªéªÃªÆÊöª¯Ì¸ªëªÊ£¡ŞçªÎñéªËªÏØí?ªÎúìª¬×µªìªÆª¤ªë£¡??'],
        es: ['¢®El Maltes no se guarda nada! ¢®Humano, mirame solo a mi! ??', '¢®No subestimes mi ternura! ¢®Por mis venas corre sangre de fiera! ??']
      },
      corgi: {
        ko: ['´Ù¸®´Â Âª¾Æµµ ³» ¾ûµ¢ÀÌ ¸ğÅÍ È¸Àü¼ö´Â ºĞ´ç 3000RPMÀÌ´Ù ¾Á·è¾Á·è! ??', '´Ù¸® ±æ´Ù°í À¯¼¼ ¶³Áö ¸¶¶ó! ³» ¹«°ÔÁß½ÉÀÌ Áö±¸»ó¿¡¼­ Á¦ÀÏ ¾ÈÁ¤ÀûÀÌ´Ù ÄÈÄÈ!'],
        en: ['My legs may be short, but my booty RPM is 3000 per minute! ??', 'Do not brag about your long legs! My center of gravity is superior!'],
        ja: ['ğëªÏÓ­ª¯ªÆªâªªÍ¶ªÎüŞ??ªÏ?İÂ3000üŞªÀ«ï«ó£¡«×«ê«×«ê£¡??', 'ğëª¬íşª¤ª«ªéªÃªÆêÎíåªëªÊ£¡ŞçªÎñìãıªÎî¸ªµª³ª½ò¸ÍÔ£¡'],
        es: ['¢®Mis patas seran cortas, pero mi cola gira a 3000 RPM! ??', '¢®No presumas de patas largas! ¢®Mi centro de gravedad es invencible!']
      },
      pome: {
        ko: ['³ª ¼Ø»çÅÁ ¾Æ´Ï´Ù! ¸Í¼ö´Ù! ¾îÈï! ºñµÑ±â ³Ê ³» ±¸¿ª¿¡¼­ ´çÀå ²¨Á® ¾Ó¾Ó! ??', '³» ÅĞ 120% ºÎÇ®¾ú´Ù! ÀÌ ¾ĞµµÀûÀÎ »çÀÚ °¥±â¿¡ ´Ùµé ±âÀıÇÏ°ÚÁö?! ??'],
        en: ['I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! ??', 'My fur expanded by 120%! Kneel before my majestic lion mane! ??'],
        ja: ['ŞçªÏØúª¢ªáª¸ªãªÊª¤£¡Øí?ªÀ£¡«Ï«Èªè¡¢ŞçªÎ?íåªêª«ªéõóªÆú¼ª±£¡??', 'Ù¾Õáª¬120%ø³ªéªóªÀ£¡ª³ªÎ?ÓîîÜªÊ«é«¤«ª«óªÎ?ªËªÒªìÜÑª¹ª¬ª¤ª¤£¡??'],
        es: ['¢®No soy un algodon de azucar! ¢®Soy un depredador! ¢®Paloma, vete de mi territorio! ??', '¢®Mi pelaje se inflo un 120%! ¢®Arrodillense ante mi melena de leon! ??']
      },
      poodle: {
        ko: ['Áı»ç¾ß Ç¥Á¤º¸´Ï Áö±İ ÁËÃ¥°¨ µå´Â Å¸ÀÌ¹ÖÀÌ³×? °í°³ 45µµ °¼¿ì¶× ½ÃÀü! °£½Ä µæÅÛ ??', 'ÀÎ°£µéÀÌ ³¯ ±Í¿©¿öÇÏ´Â ÆĞÅÏÀ» ¿Ïº®È÷ µ¥ÀÌÅÍÈ­Çß´Ù. ¿Ïº®ÇÑ ¾Ö±³ Ãâ·Â Áß!'],
        en: ['Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired ??', 'I have fully calculated human psychology. Executing optimal cuteness algorithm!'],
        ja: ['ª´ñ«ìÑ?¡¢ĞÑñª?ÊïªòÊïª¸ªÆªëªÊ£¿âÏªò45Óøª«ª·ª²ªëĞüªò?ÔÑ£¡ªªªäªÄ«²«Ã«È??', 'ìÑÊàª¬ŞçªòÊ¦äñª¤ªÈŞÖª¦«Ñ«¿?«óªòèÇîï«Ç?«¿ûù¡£èÇÛıªÊäñÎãªòõóÕôñé£¡'],
        es: ['El humano parece culpable. ¢®Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido ??', 'He calculado la psicologia humana. ¢®Ejecutando algoritmo de ternura!']
      }
    }
  },
  en: {
    appTitle: 'WalWal AR ¡¤ Breed AI',
    subtitle: 'Real-time AI Dog Translator',
    tabs: {
      ar: 'AR Cam',
      radar: 'Radar',
      studio: 'Shorts Studio',
      community: 'Meetups',
      profile: 'My Pet'
    },
    ar: {
      ethologyBtn: 'Ethology',
      liveWebcam: 'Webcam ON',
      simulator: 'Sim Mode',
      retranslate: 'Rethink',
      captureShorts: 'Save Story',
      audioFreq: 'Audio Frequency',
      speechSuffix: '\'s Real Mind',
      ethologyModalTitle: 'Canine Ethology Insights',
      tailInterpretation: 'Tail Wagging Meaning',
      barkInterpretation: 'Bark Acoustic Pattern',
      personaTitle: 'Breed Persona'
    },
    studio: {
      title: 'Breed Comic Studio',
      subtitle: 'Create viral story & 4-cut webtoon cards',
      removeWatermark: 'Remove Watermark',
      reRollQuip: 'Rethink Punchline',
      downloadPng: 'Download Comic PNG',
      downloading: 'Rendering...',
      watermarkFree: '? WalWal Pro VIP No Watermark (4K)',
      watermarkFreeTier: '? WalWal AI Dog Translator (Free Tier)'
    },
    radar: {
      title: 'WalWal Radar',
      dogsNearby: 'Dogs walking nearby',
      startVirtualChat: 'Start Virtual AI Tiki-Taka Chat',
      sendNote: 'Message Owner',
      myLocation: 'My Location (Seoul Forest)',
      apiKeyModalTitle: 'Google Maps JavaScript API Key Setup',
      apiKeyModalDesc: 'Enter your Google Cloud Console API Key to instantly enable official Google Map tiles.',
      mapTypeToggle: 'Switch Map View'
    },
    pro: {
      badge: 'WALWAL PRO VIP',
      heading: 'Discover Your Dog\'s Inner Mind',
      highlight: 'Without Any Limits',
      tagline: 'World\'s #1 AR Dog Translator & Social App',
      benefit1: 'Unlimited Real-time AR Translation & Tiki-Taka',
      benefit2: 'Watermark-free 4K Story Card Downloads',
      benefit3: 'Radar Range Expanded to 5km',
      benefit4: 'Weekly Canine Stress & Joy Analytics',
      cta: 'Start 7-Day Free Trial',
      activeText: 'You are on WalWal Pro VIP',
      trialDesc: '100% Free for 7 days ¡¤ Then $6.99/month, cancel anytime'
    },
    breedQuips: {}
  },
  ja: {
    appTitle: 'WalWal AR ¡¤ Ì³ğú÷åûùAI',
    subtitle: '«ê«¢«ë«¿«¤«àÌ³åŞ??Ñ¦',
    tabs: {
      ar: 'AR??',
      radar: '«ì?«À?',
      studio: '4«³«ŞÍïÛ®',
      community: 'ß¤?ñêÊà',
      profile: 'äñÌ³'
    },
    ar: {
      ethologyBtn: 'Ì³ğúú¼ÔÑ?',
      liveWebcam: '«««á«éON',
      simulator: '«·«ß«å«ì?«¿?',
      retranslate: 'î¢??',
      captureShorts: 'ÜÁğí',
      audioFreq: 'Ù°ª­?ñ²÷î??ò±',
      speechSuffix: 'ªÎÜâëå',
      ethologyModalTitle: 'Ì³ğúú¼ÔÑ?(Ethology)ªÎĞññŞ',
      tailInterpretation: 'Í¶Ú­òÉªêªÎú°?',
      barkInterpretation: 'Ù°ª­?ªÎú°?',
      personaTitle: 'Ì³ğú«Ú«ë«½«Ê'
    },
    studio: {
      title: 'Ì³ğú÷åûù4«³«Ş?«¹«È?«ê?ÍïÛ®',
      subtitle: 'äñÌ³ªÎËÁàõª¬ÎÃªë«Ğ«º««?«ÉíÂà÷',
      removeWatermark: '÷âª«ª·ªòá¼ª¹',
      reRollQuip: '«»«ê«Õî¢ßæà÷',
      downloadPng: '4«³«ŞPNGÜÁğí',
      downloading: 'ÙÚ?ñé...',
      watermarkFree: '? WalWal Pro VIP ÷âª«ª·ªÊª· (4K)',
      watermarkFreeTier: '? WalWal AI Ì³ğú?? (ÙíÖù÷ú)'
    },
    radar: {
      title: '«ï«ó«ï«ó«ì?«À?',
      dogsNearby: 'ñ²?ªÇªªß¤?ñéªÎ«ï«óªÁªãªó',
      startVirtualChat: 'AI«Ğ?«Á«ã«ë?ü¥«·«ß«å«ì?«·«ç«ó',
      sendNote: 'Şøª¤ñ«ªË«á«Ã«»?«¸',
      myLocation: 'úŞî¤ò¢ («½«¦«ëªÎßµ?á¡â©Ô×)',
      apiKeyModalTitle: 'Google Maps API«­?àâïÒ',
      apiKeyModalDesc: 'Google Cloud API«­?ªòìıÕôª¹ªëªÈ¡¢ÍëãÒGoogle«Ş«Ã«×«¿«¤«ëª¬?ñ¨ªËêó?ªËªÊªêªŞª¹¡£',
      mapTypeToggle: '«Ş«Ã«×ï·ªêôğª¨'
    },
    pro: {
      badge: 'WALWAL PRO VIP',
      heading: 'äñÌ³ªÎÜâ?ªÎ?ò¥ªÁªò',
      highlight: 'ùÚÍ£ªÊª¯Ùíğ¤ùÚªË?ª­Ì¸ªë',
      tagline: 'á¦Í£ñéªÎäñÌ³Ê«ªÎª¿ªáªÎNo.1 AR??«¢«×«ê',
      benefit1: '«ê«¢«ë«¿«¤«àAR??£¦ÎĞª±ùêª¤Ùíğ¤ùÚ',
      benefit2: '÷âª«ª·èÇîïğ¶ËÛ£¦4KÍÔ?òõÜÁğí',
      benefit3: '«ì?«À?÷®ßãÛô?5kmªØ?íå',
      benefit4: 'äñÌ³ªÎ«¹«È«ì«¹?ú¹ÜØÓøAIİÂà°«ì«İ?«È',
      cta: '7ìíÊàÙíÖù??ªòã·ªáªë',
      activeText: 'Pro«×«é«óªòª´××éÄñéªÇª¹',
      trialDesc: '7ìíÊàèÇîïÙíÖù ¡¤ ª½ªÎı­êÅäş$6.99 í»ÔÑÌÚãæ'
    },
    breedQuips: {}
  },
  es: {
    appTitle: 'WalWal AR ¡¤ IA de Razas',
    subtitle: 'Traductor Canino en Tiempo Real',
    tabs: {
      ar: 'Camara AR',
      radar: 'Radar',
      studio: 'Estudio Cortos',
      community: 'Paseos',
      profile: 'Mi Mascota'
    },
    ar: {
      ethologyBtn: 'Etologia',
      liveWebcam: 'Camara ON',
      simulator: 'Simulador',
      retranslate: 'Re-analizar',
      captureShorts: 'Guardar',
      audioFreq: 'Frecuencia de Ladrido',
      speechSuffix: ' - Pensamiento Real',
      ethologyModalTitle: 'Criterios de Etologia Canina',
      tailInterpretation: 'Significado de la Cola',
      barkInterpretation: 'Significado del Ladrido',
      personaTitle: 'Personalidad de la Raza'
    },
    studio: {
      title: 'Estudio de Comics por Raza',
      subtitle: 'Crea historias y tarjetas virales para redes',
      removeWatermark: 'Quitar Marca de Agua',
      reRollQuip: 'Nueva Frase',
      downloadPng: 'Descargar Comic PNG',
      downloading: 'Generando...',
      watermarkFree: '? WalWal Pro VIP Sin Marca de Agua (4K)',
      watermarkFreeTier: '? WalWal AI Traductor (Version Gratuita)'
    },
    radar: {
      title: 'Radar WalWal',
      dogsNearby: 'Perritos paseando cerca',
      startVirtualChat: 'Simulacion de Charla Virtual IA',
      sendNote: 'Mensaje al Dueno',
      myLocation: 'Mi Ubicacion (Seongsu)',
      apiKeyModalTitle: 'Configuracion de Clave API Google Maps',
      apiKeyModalDesc: 'Ingrese su clave API de Google Cloud para activar mapas oficiales de alta resolucion.',
      mapTypeToggle: 'Cambiar Mapa'
    },
    pro: {
      badge: 'WALWAL PRO VIP',
      heading: 'Descubre la Mente de tu Perro',
      highlight: 'Sin Ningun Limite',
      tagline: 'La app #1 del mundo en traduccion AR para mascotas',
      benefit1: 'Traduccion AR ilimitada en tiempo real',
      benefit2: 'Descarga 4K sin marca de agua',
      benefit3: 'Radar ampliado a 5 km',
      benefit4: 'Reporte semanal de emociones y bienestar',
      cta: 'Comenzar Prueba Gratis de 7 Dias',
      activeText: 'Plan WalWal Pro Activo',
      trialDesc: '100% Gratis por 7 dias ¡¤ Luego $6.99/mes'
    },
    breedQuips: {}
  }
};

translations.en.breedQuips = translations.ko.breedQuips;
translations.ja.breedQuips = translations.ko.breedQuips;
translations.es.breedQuips = translations.ko.breedQuips;

const targetFile = 'e:/workspace/walwal-app/web-app/src/i18n/translations.ts';

const out = `export type Language = 'ko' | 'en' | 'ja' | 'es';

export interface TranslationSchema {
  appTitle: string;
  subtitle: string;
  tabs: any;
  ar: any;
  studio: any;
  radar: any;
  pro: any;
  breedQuips: any;
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = ${JSON.stringify(translations, null, 2)};

export function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const browserLang = (navigator.language || (navigator as any).userLanguage || 'ko').toLowerCase();
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('es')) return 'es';
  return 'ko';
}
`;

fs.writeFileSync(targetFile, out, 'utf8');
console.log('TRANSLATIONS_WRITTEN_UTF8_SUCCESSFULLY');
