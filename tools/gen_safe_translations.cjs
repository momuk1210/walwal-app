const fs = require('fs');

const translations = {
  ko: {
    appTitle: "WalWal AR \u00b7 \uacac\uc885 \ud2b9\ud654 AI",
    subtitle: "AI \uc2e4\uc2dc\uac04 \ubc88\uc5ed\uae30",
    tabs: {
      ar: "AR \ud1b5\uc5ed",
      radar: "\ub808\uc774\ub354",
      studio: "\uc2f7\ud3fc\uc2a4\ud29c\ub514\uc624",
      community: "\uc0b0\ucc45\ubaa8\uc784",
      profile: "\ub9c8\uc774\ud3ab"
    },
    ar: {
      ethologyBtn: "\uacac\uc885\ud589\ub3d9\ud559",
      liveWebcam: "\uc6f9\ucea0 ON",
      simulator: "\uc2dc\ubbac\ub808\uc774\ud130",
      retranslate: "\ub2e4\uc2dc\ubc88\uc5ed",
      captureShorts: "\uc2f7\ud3fc\uc800\uc7a5",
      audioFreq: "\uc74c\uc131 \uc8fc\ud30c\uc218 \uac10\uc9c0",
      speechSuffix: "\uc758 \uc9c4\uc9dc \uc18d\ub9c8\uc74c",
      ethologyModalTitle: "\ud589\ub3d9\ud559(Ethology) \ubd84\uc11d \uae30\uc900",
      tailInterpretation: "\uaf2c\ub9ac \ud754\ub4e4\uae30 \ud574\uc11d",
      barkInterpretation: "\uc9d6\ub294 \uc18c\ub9ac \ud574\uc11d",
      personaTitle: "\uc131\ud5a5 \ud398\ub974\uc18c\ub098"
    },
    studio: {
      title: "\uacac\uc885 \ud2b9\ud654 \uc6f9\ud230 \uc2a4\ud29c\ub514\uc624",
      subtitle: "\uace0\uc720 \uc131\ud5a5\uc774 \uae43\ub4e0 \uc778\uc2a4\ud0c0/\uc2f7\ud3fc \ucef7\ud230 \uc0dd\uc131\uae30",
      removeWatermark: "\uc6cc\ud130\ub9c8\ud06c \uc5c6\uc560\uae30",
      reRollQuip: "\ub300\uc0ac \ub2e4\uc2dc\ubf50\uae30",
      downloadPng: "\uc6f9\ud230 \ucef7 PNG \ub2e4\uc6b4\ub85c\ub4dc",
      downloading: "\uce74\ub4dc \ub80c\ub354\ub9c1 \uc911...",
      watermarkFree: "\u2728 WalWal Pro VIP \uc6cc\ud130\ub9c8\ud06c \uc5c6\uc74c (4K)",
      watermarkFreeTier: "\u26a1 WalWal AI \uacac\uc885\ud2b9\ud654 \ubc88\uc5ed (\ubb34\ub8cc \ubc84\uc804)"
    },
    radar: {
      title: "\uc648\uc648 \ub808\uc774\ub354",
      dogsNearby: "\uc8fc\ubcc0 \ubc18\uacbd \uc0b0\ucc45 \uc911\uc778 \ub315\ub315\uc774",
      startVirtualChat: "\uac00\uc0c1 \ub300\ud654 \ud2f0\ud0a4\ud0c0\uce74 \uc2dc\ubbac\ub808\uc774\uc158",
      sendNote: "\uacac\uc8fc \ucabd\uc9c0",
      myLocation: "\ub0b4 \uc704\uce58 (\uc11c\uc6b8\uc232 \uc131\uc218\ub3d9)",
      apiKeyModalTitle: "Google Maps API \ud0a4 \uc124\uc815",
      apiKeyModalDesc: "Google Cloud API \ud0a4\ub97c \uc785\ub825\ud558\uc2dc\uba74 \uacf5\uc2dd \uad6c\uae00 \uc9c0\ub3c4 \ud0c0\uc77c\ub85c \uc989\uc2dc \uc804\ud658\ub429\ub2c8\ub2e4.",
      mapTypeToggle: "\uc9c0\ub3c4 \ud0c0\uc77c \uc804\ud658"
    },
    pro: {
      badge: "WALWAL PRO VIP",
      heading: "\ub315\ub315\uc774\uc758 \uc18d\ub9c8\uc74c\uc744",
      highlight: "\ud55c\uacc4 \uc5c6\uc774 \ubb34\uc81c\ud55c\uc73c\ub85c \uc5ff\ubcf4\uc138\uc694",
      tagline: "\uc804 \uc138\uacc4 \ud3ab\ud338\uc871\uc744 \uc704\ud55c \uae00\ub85c\ub88c 1\uc704 AR \ubc88\uc5ed\uae30",
      benefit1: "\uc2e4\uc2dc\uac04 AR \ud1b5\uc5ed & \ud2f0\ud0a4\ud0c0\uce74 \ubb34\uc81c\ud55c",
      benefit2: "\uc6cc\ud130\ub9c8\ud06c \uc644\uc804 \uc81c\uac70 & 4K \uace0\ud654\uc9c8 \uc800\uc7a5",
      benefit3: "\uc648\uc648 \ub808\uc774\ub354 \ubc18\uacbd 5km \ubb34\uc81c\ud55c \ud655\uc7a5",
      benefit4: "AI \ubc18\ub824\uacac \uc74c\uc131/\ud589\ub3d9 \uc815\ubc00 \ubd84\uc11d \ub9ac\ud3ec\ud2b8",
      cta: "7\uc77c \ubb34\ub8cc \uccb4\ud5d8 \uc2dc\uc791\ud558\uae30",
      activeText: "\uc774\ubbf8 Pro \ud50c\ub79c \uc774\uc6a9 \uc911\uc785\ub2c8\ub2e4",
      trialDesc: "7\uc77c\uac04 100% \ubb34\ub8cc \uccb4\ud5d8 \u00b7 \uc774\ud6c4 \uc6d4 $6.99 \uc790\ub3d9 \uc804\ud658"
    },
    breedQuips: {
      golden: {
        ko: ["\uc640! \uc0c8\ub85c\uc6b4 \uce5c\uad6c\ub2e4! \ub098\ub791 \ub2f9\uc7a5 \ub180\uc790! \uc628\ubabb\uc73c\ub85c \ud658\uc601\ud574!! \ud83d\udc96", "\uc800\uae30 \ud615\uc544 \uc8fc\uba38\ub2c8\uc5d0 \uc18c\uc2dc\uc9c0 \ub0c4\uc0c8 \ub09c\ub2e4! \uaf2c\ub9ac \ubaa8\ud130 300% \uac00\ub3d9!! \ud83d\ude80"],
        en: ["OMG a new friend! Play with me right now! I love everyone!! \ud83d\udc96", "I smell sausages in your pocket! Tail propeller at 300%!! \ud83d\ude80"],
        ja: ["\u308f\u3041\uff01\u65b0\u3057\u3044\u304a\u53cb\u9054\u3060\uff01\u4eca\u3059\u3050\u4e00\u7dd2\u306b\u904a\u307c\u3046\uff01\uff01\ud83d\udc96", "\u3042\u306e\u304a\u5144\u3055\u3093\u306e\u30dd\u30b1\u30c3\u30c8\u304b\u3089\u30bd\u30fc\u30bb\u30fc\u30b8\u306e\u5302\u3044\u304c\u3059\u308b\uff01\u5c3b\u5c3e\u5168\u958b\uff01\uff01\ud83d\ude80"],
        es: ["\u00a1Un nuevo amigo! \u00a1Juega conmigo ahora mismo! \u00a1Los amo a todos! \ud83d\udc96", "\u00a1Huelo salchichas en tu bolsillo! \u00a1Cola a m\u00e1xima velocidad! \ud83d\ude80"]
      },
      shiba: {
        ko: ["\ub108 \ub098\ud55c\ud14c \uad00\uc2ec \uac16\uc9c0 \ub9c8\ub77c. \uaf2c\ub9ac \ud754\ub4e0 \uac74 \uae30\ubd84 \uc88b\uc544\uc11c\uac00 \uc544\ub2c8\ub77c \ubc18\ub3d9 \ucd94\uc9c4\ub825\uc774\ub2e4. \ud83d\udd76\ufe0f", "\ub208 \ub9c8\uc8fc\ucce4\ub2e4\uace0 \uce5c\uad6c \uba39\uc744 \uc0dd\uac01 \ub9c8. \ub0b4 \ud37c\uc2a4\ub110 \uc2a4\ud398\uc774\uc2a4 2\ubbf8\ud130 \uc720\uc9c0\ud574\ub77c."],
        en: ["Do not look at me. Wiggling my tail was just recoil propulsion. \ud83d\udd76\ufe0f", "Keep your 6-foot distance. We are not friends just because we made eye contact."],
        ja: ["\u79c1\u306b\u95a2\u308f\u308b\u306a\u3002\u5c3b\u5c3e\u3092\u632f\u3063\u305f\u306e\u306f\u53cd\u52d5\u306e\u63a8\u9032\u529b\u3060\u3002\ud83d\udd76\ufe0f", "\u76ee\u304c\u5408\u3063\u305f\u304b\u3089\u3063\u3066\u53cb\u9054\u6c17\u53d6\u308a\u3059\u308b\u306a\u30022m\u306e\u8ddd\u96e2\u3092\u4fdd\u3066\u3002"],
        es: ["No me mires. Mover la cola fue solo propulsi\u00f3n de retroceso. \ud83d\udd76\ufe0f", "Mant\u00e9n tu distancia de 2 metros. No somos amigos solo por cruzar miradas."]
      },
      maltese: {
        ko: ["\ub9d0\ud2f0\uc988\ub294 \ucc38\uc9c0 \uc54a\uc544! \uc9d1\uc0ac\uc57c \ub098\ud55c\ud14c \uc9d1\uc911\ud574! \ub2e4\ub978 \uac1c \uccd0\ub2e4\ubcf4\uc9c0 \ub9c8 \uc559\uc559!! \ud83d\udca2", "\ub0b4\uac00 \uadc0\uc5fd\ub2e4\uace0 \ub9cc\ub9cc\ud558\uac8c \ubcf4\uc9c0 \ub9c8\ub77c! \ub0b4 \uc548\uc5d0 \ub9f9\uc218\uc758 \ud53c\uac00 \ud754\ub978\ub2e4! \ud83e\udd81"],
        en: ["Maltese never holds back! Human, focus on ME! Stop looking at other dogs! \ud83d\udca2", "Do not underestimate my cuteness! The blood of a fierce beast runs in me! \ud83e\udd81"],
        ja: ["\u30de\u30eb\u30c1\u30fc\u30ba\u306f\u6211\u6162\u3057\u306a\u3044\uff01\u3054\u4e3b\u4eba\u69d8\u3001\u79c1\u3060\u3051\u306b\u96c6\u4e2d\u3057\u3066\uff01\u4ed6\u306e\u72ac\u3092\u898b\u306a\u3044\u3067\uff01\ud83d\udca2", "\u53ef\u611b\u3044\u304b\u3089\u3063\u3066\u7518\u304f\u898b\u308b\u306a\uff01\u79c1\u306e\u4e2d\u306b\u306f\u731b\u7363\u306e\u8840\u304c\u6d41\u308c\u3066\u3044\u308b\uff01\ud83e\udd81"],
        es: ["\u00a1El Malt\u00e9s no se guarda nada! \u00a1Humano, m\u00edrame solo a m\u00ed! \ud83d\udca2", "\u00a1No subestimes mi ternura! \u00a1Por mis venas corre sangre de fiera! \ud83e\udd81"]
      },
      corgi: {
        ko: ["\ub2e4\ub9ac\ub294 \uc9e7\uc544\ub3c4 \ub0b4 \uc549\ub369\uc774 \ubaa8\ud130 \ud68c\uc804\uc218\ub294 \ubd84\ub2f9 3000RPM\uc774\ub2e4 \uc528\ub8e9\uc528\ub8e9! \ud83c\udf5e", "\ub2e4\ub9ac \uae38\ub2e4\uace0 \uc720\uc138 \ub5a8\uc9c0 \ub9c8\ub77c! \ub0b4 \ubb34\uac8c\uc911\uc2ec\uc774 \uc9c0\uad6c\uc0c1\uc5d0\uc11c \uc81c\uc77c \uc548\uc815\uc801\uc774\ub2e4 \ucef9\ucef9!"],
        en: ["My legs may be short, but my booty RPM is 3000 per minute! \ud83c\udf5e", "Do not brag about your long legs! My center of gravity is superior!"],
        ja: ["\u8db3\u306f\u77ed\u304f\u3066\u3082\u304a\u5c3b\u306e\u56de\u8ee2\u6570\u306f\u6bce\u52063000\u56de\u3060\u30ef\u30f3\uff01\u30d7\u30ea\u30d7\u30ea\uff01\ud83c\udf5e", "\u8db3\u304c\u9577\u3044\u304b\u3089\u3063\u3066\u5a01\u5f35\u308b\u306a\uff01\u79c1\u306e\u91cd\u5fc3\u306e\u4f4e\u3055\u3053\u305d\u81f3\u9ad8\uff01"],
        es: ["\u00a1Mis patas ser\u00e1n cortas, pero mi cola gira a 3000 RPM! \ud83c\udf5e", "\u00a1No presumas de patas largas! \u00a1Mi centro de gravedad es invencible!"]
      },
      pome: {
        ko: ["\ub098 \uc19c\uc0ac\ud0d5 \uc544\ub2c8\ub2e4! \ub9f9\uc218\ub2e4! \uc5b4\ud765! \ube44\ub458\uae30 \ub108 \ub0b4 \uad6c\uc5ed\uc5d0\uc11c \ub2f9\uc7a5 \uaebc\uc838 \uc559\uc559! \ud83e\udd81", "\ub0b4 \ud138 120% \ubd80\ud480\uc5c8\ub2e4! \uc774 \uc555\ub3c4\uc801\uc778 \uc0ac\uc790 \uac08\uae30\uc5d0 \ub2e4\ub4e4 \uae30\uc808\ud558\uaca0\uc9c0?! \u2601\ufe0f"],
        en: ["I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! \ud83e\udd81", "My fur expanded by 120%! Kneel before my majestic lion mane! \u2601\ufe0f"],
        ja: ["\u79c1\u306f\u7dbf\u3042\u3081\u3058\u3083\u306a\u3044\uff01\u731b\u7363\u3060\uff01\u30cf\u30c8\u3088\u3001\u79c1\u306e\u7e04\u5f35\u308a\u304b\u3089\u51fa\u3066\u884c\u3051\uff01\ud83e\udd81", "\u6bdb\u91cf\u304c120%\u81a8\u3089\u3093\u3060\uff01\u3053\u306e\u5727\u5012\u7684\u306a\u30e9\u30a4\u30aa\u30f3\u306e\u9b23\u306b\u3072\u308c\u4f0f\u3059\u304c\u3044\u3044\uff01\u2601\ufe0f"],
        es: ["\u00a1No soy un algod\u00f3n de az\u00facar! \u00a1Soy un depredador! \u00a1Paloma, vete de mi territorio! \ud83e\udd81", "\u00a1Mi pelaje se infl\u00f3 un 120%! \u00a1Arrod\u00edllense ante mi melena de le\u00f3n! \u2601\ufe0f"]
      },
      poodle: {
        ko: ["\uc9d1\uc0ac\uc57c \ud45c\uc815\ubcf4\ub2c8 \uc9c0\uae08 \uc8c4\ucc45\uac10 \ub4dc\ub294 \ud0c0\uc774\ubc0d\uc774\ub2e4? \uace0\uac1c 45\ub3c4 \uac04\uc2dd \ub4dd\ud15c \ud83e\udde0", "\uc778\uac04\ub4e4\uc774 \ub0a0 \uadc0\uc5ec\uc6cc\ud558\ub294 \ud328\ud134\uc744 \uc644\ubcbd\ud788 \ub370\uc774\ud130\ud654\ud588\ub2e4. \uc644\ubcbd\ud55c \uc560\uad50 \ucd9c\ub825 \uc911!"],
        en: ["Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired \ud83e\udde0", "I have fully calculated human psychology. Executing optimal cuteness algorithm!"],
        ja: ["\u3054\u4e3b\u4eba\u69d8\u3001\u4eca\u7f6a\u60aa\u611f\u3092\u611f\u3058\u3066\u308b\u306a\uff1f\u9996\u309245\u5ea6\u304b\u3057\u3052\u308b\u6280\u3092\u767a\u52d5\uff01\u304a\u3084\u3064\u30b2\u30c3\u30c8\ud83e\udde0", "\u4eba\u9593\u304c\u79c1\u3092\u53ef\u611b\u3044\u3068\u601d\u3046\u30d1\u30bf\u30fc\u30f3\u3092\u5b8c\u5168\u30c7\u30fc\u30bf\u5316\u3002\u5b8c\u74a7\u306a\u611b\u5b0db\u3092\u51fa\u529b\u4e2d\uff01"],
        es: ["El humano parece culpable. \u00a1Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido \ud83e\udde0", "He calculado la psicolog\u00eda humana. \u00a1Ejecutando algoritmo de ternura!"]
      }
    }
  },
  en: {
    appTitle: "WalWal AR \u00b7 Breed AI",
    subtitle: "Real-time AI Dog Translator",
    tabs: {
      ar: "AR Cam",
      radar: "Radar",
      studio: "Shorts Studio",
      community: "Meetups",
      profile: "My Pet"
    },
    ar: {
      ethologyBtn: "Ethology",
      liveWebcam: "Webcam ON",
      simulator: "Sim Mode",
      retranslate: "Rethink",
      captureShorts: "Save Story",
      audioFreq: "Audio Frequency",
      speechSuffix: "'s Real Mind",
      ethologyModalTitle: "Canine Ethology Insights",
      tailInterpretation: "Tail Wagging Meaning",
      barkInterpretation: "Bark Acoustic Pattern",
      personaTitle: "Breed Persona"
    },
    studio: {
      title: "Breed Comic Studio",
      subtitle: "Create viral story & 4-cut webtoon cards",
      removeWatermark: "Remove Watermark",
      reRollQuip: "Rethink Punchline",
      downloadPng: "Download Comic PNG",
      downloading: "Rendering...",
      watermarkFree: "\u2728 WalWal Pro VIP No Watermark (4K)",
      watermarkFreeTier: "\u26a1 WalWal AI Dog Translator (Free Tier)"
    },
    radar: {
      title: "WalWal Radar",
      dogsNearby: "Dogs walking nearby",
      startVirtualChat: "Start Virtual AI Tiki-Taka Chat",
      sendNote: "Message Owner",
      myLocation: "My Location (Seoul Forest)",
      apiKeyModalTitle: "Google Maps API Setup",
      apiKeyModalDesc: "Enter Google Cloud API Key to switch to official Google Map tiles.",
      mapTypeToggle: "Toggle Map View"
    },
    pro: {
      badge: "WALWAL PRO VIP",
      heading: "Discover Your Dog's Inner Mind",
      highlight: "Without Any Limits",
      tagline: "World's #1 AR Dog Translator & Social App",
      benefit1: "Unlimited Real-time AR Translation & Tiki-Taka",
      benefit2: "Watermark-free 4K Story Card Downloads",
      benefit3: "Radar Range Expanded to 5km",
      benefit4: "Weekly Canine Stress & Joy Analytics",
      cta: "Start 7-Day Free Trial",
      activeText: "You are on WalWal Pro VIP",
      trialDesc: "100% Free for 7 days \u00b7 Then $6.99/month, cancel anytime"
    },
    breedQuips: {}
  },
  ja: {
    appTitle: "WalWal AR \u00b7 \u72ac\u7a2e\u7279\u5316AI",
    subtitle: "\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0\u72ac\u8a9e\u7ffb\u8a33\u6a5f",
    tabs: {
      ar: "AR\u7ffb\u8a33",
      radar: "\u30ec\u30fc\u30c0\u30fc",
      studio: "4\u30b3\u30de\u5de5\u623f",
      community: "\u6563\u6b69\u4ef2\u9593",
      profile: "\u611b\u72ac"
    },
    ar: {
      ethologyBtn: "\u72ac\u7a2e\u884c\u52d5\u5b66",
      liveWebcam: "\u30ab\u30e1\u30e9ON",
      simulator: "\u30b7\u30df\u30e5\u30ec\u30fc\u30bf\u30fc",
      retranslate: "\u518d\u7ffb\u8a33",
      captureShorts: "\u4fdd\u5b58",
      audioFreq: "\u9cf4\u304d\u58f0\u5468\u6ce2\u6570\u691c\u77e5",
      speechSuffix: "\u306e\u672c\u97f3",
      ethologyModalTitle: "\u72ac\u7a2e\u884c\u52d5\u5b66(Ethology)\u306e\u57fa\u6e96",
      tailInterpretation: "\u5c3b\u5c3e\u632f\u308a\u306e\u89e3\u91c8",
      barkInterpretation: "\u9cf4\u304d\u58f0\u306e\u89e3\u91c8",
      personaTitle: "\u72ac\u7a2e\u305a\u30eb\u30bd\u30ca"
    },
    studio: {
      title: "\u72ac\u7a2e\u7279\u53164\u30b3\u30de\u5de5\u623f",
      subtitle: "\u611b\u72ac\u306e\u500b\u6027\u304c\u5149\u308b\u30d0\u30ba\u30ab\u30fc\u30c9\u4f5c\u6210",
      removeWatermark: "\u900f\u304b\u3057\u3092\u6d88\u3059",
      reRollQuip: "\u30bb\u30ea\u30d5\u518d\u751f\u6210",
      downloadPng: "4\u30b3\u30dePNG\u4fdd\u5b58",
      downloading: "\u63cf\u753b\u4e2d...",
      watermarkFree: "\u2728 WalWal Pro VIP \u900f\u304b\u3057\u306a\u3057 (4K)",
      watermarkFreeTier: "\u26a1 WalWal AI \u72ac\u7a2e\u7ffb\u8a33 (\u7121\u6599\u7248)"
    },
    radar: {
      title: "\u30ef\u30f3\u30ef\u30f3\u30ec\u30fc\u30c0\u30fc",
      dogsNearby: "\u5468\u8fba\u3067\u304a\u6563\u6b69\u4e2d\u306e\u30ef\u30f3\u3061\u3083\u3093",
      startVirtualChat: "AI\u30d0\u30fc\u30c1\u30e3\u30eb\u4f1a\u8a71\u30b7\u30df\u30e5\u30ec\u30fc\u30b7\u30e7\u30f3",
      sendNote: "\u98fc\u3044\u4e3b\u306b\u30e1\u30c3\u30bb\u30fc\u30b8",
      myLocation: "\u73fe\u5728\u5730 (\u30bd\u30a6\u30eb\u306e\u68ee)",
      apiKeyModalTitle: "Google Maps API\u30ad\u30fc\u8a2d\u5b9a",
      apiKeyModalDesc: "Google Cloud API\u30ad\u30fc\u3092\u5165\u529b\u3059\u308b\u3068\u3001\u516c\u5f0fGoogle\u30de\u30c3\u30d7\u304c\u5373\u5ea7\u306b\u6709\u52b9\u5316\u3055\u308c\u307e\u3059\u3002",
      mapTypeToggle: "\u30de\u30c3\u30d7\u5207\u308a\u66ff\u3048"
    },
    pro: {
      badge: "WALWAL PRO VIP",
      heading: "\u611b\u72ac\u306e\u672c\u5f53\u306e\u6c17\u6301\u3061\u3092",
      highlight: "\u9650\u754c\u306a\u304f\u7121\u5236\u9650\u306b\u8997\u304d\u898b\u308b",
      tagline: "\u4e16\u754c\u4e2d\u306e\u611b\u72ac\u5bb6\u306e\u305f\u3081\u306eNo.1 AR\u7ffb\u8a33\u30a2\u30d7\u30ea",
      benefit1: "\u30ea\u30a2\u30eb\u30bf\u30a4\u30e0AR\u7ffb\u8a33\uff06\u639b\u3051\u5408\u3044\u7121\u5236\u9650",
      benefit2: "\u900f\u304b\u3057\u5b8c\u5168\u9664\u53bb\uff064K\u9ad8\u753b\u8cea\u4fdd\u5b58",
      benefit3: "\u30ec\u30fc\u30c0\u30fc\u63a2\u7d22\u7bc4\u56f25km\u3078\u6269\u5f35",
      benefit4: "\u611b\u72ac\u306e\u30b9\u30c8\u30ec\u30b9\u30fb\u5e78\u798f\u5ea6AI\u5206\u6790\u30ec\u30dd\u30fc\u30c8",
      cta: "7\u65e5\u9593\u7121\u6599\u4f53\u9a13\u3092\u59cb\u3081\u308b",
      activeText: "Pro\u30d7\u30e9\u30f3\u3092\u3054\u5229\u7528\u4e2d\u3067\u3059",
      trialDesc: "7\u65e5\u9593\u5b8c\u5168\u7121\u6599 \u00b7 \u305d\u306e\u5f8c\u6708\u984d$6.99 \u81ea\u52d5\u66f4\u65b0"
    },
    breedQuips: {}
  },
  es: {
    appTitle: "WalWal AR \u00b7 IA de Razas",
    subtitle: "Traductor Canino en Tiempo Real",
    tabs: {
      ar: "C\u00e1mara AR",
      radar: "Radar",
      studio: "Estudio Cortos",
      community: "Paseos",
      profile: "Mi Mascota"
    },
    ar: {
      ethologyBtn: "Etolog\u00eda",
      liveWebcam: "C\u00e1mara ON",
      simulator: "Simulador",
      retranslate: "Re-analizar",
      captureShorts: "Guardar",
      audioFreq: "Frecuencia de Ladrido",
      speechSuffix: " - Pensamiento Real",
      ethologyModalTitle: "Criterios de Etolog\u00eda Canina",
      tailInterpretation: "Significado de la Cola",
      barkInterpretation: "Significado del Ladrido",
      personaTitle: "Personalidad de la Raza"
    },
    studio: {
      title: "Estudio de C\u00f3mics por Raza",
      subtitle: "Crea historias y tarjetas virales para redes",
      removeWatermark: "Quitar Marca de Agua",
      reRollQuip: "Nueva Frase",
      downloadPng: "Descargar C\u00f3mic PNG",
      downloading: "Generando...",
      watermarkFree: "\u2728 WalWal Pro VIP Sin Marca de Agua (4K)",
      watermarkFreeTier: "\u26a1 WalWal AI Traductor (Versi\u00f3n Gratuita)"
    },
    radar: {
      title: "Radar WalWal",
      dogsNearby: "Perritos paseando cerca",
      startVirtualChat: "Simulaci\u00f3n de Charla Virtual IA",
      sendNote: "Mensaje al Due\u00f1o",
      myLocation: "Mi Ubicaci\u00f3n (Seongsu)",
      apiKeyModalTitle: "Configuraci\u00f3n de Clave API Google Maps",
      apiKeyModalDesc: "Ingrese su clave API de Google Cloud para activar mapas oficiales.",
      mapTypeToggle: "Cambiar Mapa"
    },
    pro: {
      badge: "WALWAL PRO VIP",
      heading: "Descubre la Mente de tu Perro",
      highlight: "Sin Ning\u00fan L\u00edmite",
      tagline: "La app #1 del mundo en traducci\u00f3n AR para mascotas",
      benefit1: "Traducci\u00f3n AR ilimitada en tiempo real",
      benefit2: "Descarga 4K sin marca de agua",
      benefit3: "Radar ampliado a 5 km",
      benefit4: "Reporte semanal de emociones y bienestar",
      cta: "Comenzar Prueba Gratis de 7 D\u00edas",
      activeText: "Plan WalWal Pro Activo",
      trialDesc: "100% Gratis por 7 d\u00edas \u00b7 Luego $6.99/mes"
    },
    breedQuips: {}
  }
};

translations.en.breedQuips = translations.ko.breedQuips;
translations.ja.breedQuips = translations.ko.breedQuips;
translations.es.breedQuips = translations.ko.breedQuips;

const targetFile = 'e:/workspace/walwal-app/web-app/src/i18n/translations.ts';

const out = 'export type Language = \'ko\' | \'en\' | \'ja\' | \'es\';\n\n' +
  'export interface TranslationSchema {\n' +
  '  appTitle: string;\n' +
  '  subtitle: string;\n' +
  '  tabs: any;\n' +
  '  ar: any;\n' +
  '  studio: any;\n' +
  '  radar: any;\n' +
  '  pro: any;\n' +
  '  breedQuips: any;\n' +
  '}\n\n' +
  'export const TRANSLATIONS: Record<Language, TranslationSchema> = ' + JSON.stringify(translations, null, 2) + ';\n\n' +
  'export function detectUserLanguage(): Language {\n' +
  '  if (typeof window === \'undefined\') return \'ko\';\n' +
  '  const browserLang = (navigator.language || (navigator as any).userLanguage || \'ko\').toLowerCase();\n' +
  '  if (browserLang.startsWith(\'en\')) return \'en\';\n' +
  '  if (browserLang.startsWith(\'ja\')) return \'ja\';\n' +
  '  if (browserLang.startsWith(\'es\')) return \'es\';\n' +
  '  return \'ko\';\n' +
  '}\n';

fs.writeFileSync(targetFile, out, 'utf8');
console.log('SAFE_UNICODE_TRANSLATIONS_WRITTEN');
