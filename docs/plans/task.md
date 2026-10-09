| Task ID | Description | Status | Evidence |
|---|---|---|---|
| TASK-01 | Independent project setup at e:\workspace\walwal-app | DONE | Removed from momuk-app, created e:\workspace\walwal-app root |
| TASK-02 | Core UI & AR Interpretation Simulator | DONE | ARCameraView with YOLO-Pose bounding box & speech bubbles |
| TASK-03 | WalWal Radar (Map & Pet Discovery) | DONE | RadarView with radar animation, dog pins & virtual chat gateway |
| TASK-04 | Shortform & Webtoon Card Capture/Share | DONE | ShortformStudio with HTML5 Canvas export & PNG download |
| TASK-05 | Community & Walk Meeting Social Flow | DONE | CommunityView with meetups join & feed |
| TASK-06 | Freemium & Subscription Flow (WalWal Pro) | DONE | ProModal with 7-day free trial & /month plan |
| TASK-07 | Flutter Mobile Project Architecture Scaffolding | DONE | mobile_app directory with Android/iOS Google Maps configs & RadarScreen |
| TASK-08 | Audio & Vision AI Pipeline (YAMNet + Pose Classifier) | DONE | Python & Node AI pipelines verified with multi-scenario test |
| TASK-09 | Breed Ethology Weight Bias & Persona Engine | DONE | 8 Breed Ethology matrix integrated, browser test verified with video |
| TASK-10 | Global i18n & System Locale Auto-detection | DONE | Multi-language auto-detect + KO, EN, JA, ES browser verified with video |
| TASK-11 | Google Maps API Integration (Key Injected) | DONE | Key registered in web .env & Flutter AndroidManifest / iOS AppDelegate |
| TASK-12 | Fix AR Camera lifecycle, stream lock and toggle bug | DONE | Eliminated reverse toggle bug on AR tab click, ensured proper cleanup |
| TASK-13 | Restore original offline camera overlay button | DONE | Replaced custom prompt popup with original walking dog animation and circular turn-on button |
| TASK-14 | Fix video play AbortError and ensure button initiates camera | DONE | Resolved load request collision, added isStartingRef guard, onCanPlay handler, and forced camera start on button click |
| TASK-15 | Restore original !isCameraLive overlay condition | DONE | Fixed overlay lock caused by !hasLiveStream check; button click now immediately removes overlay and activates AR camera |
| TASK-16 | Ensure yellow camera button visibility and actionable trigger | DONE | Positioned original 110px circular turn-on button when stream is inactive; button triggers direct getUserMedia with descriptive browser alerts |
| TASK-17 | Fix NotReadableError with global hardware release and beforeunload | DONE | Cleaned up all lingering MediaStream tracks across video, ref and window scope on every unload/restart |
| TASK-18 | Completely remove alert popups and restore silent simulation fallback | DONE | Cleaned all intrusive alert popups; camera failures now silently and seamlessly fall back to live simulation mode |
| TASK-19 | Restore initial offline overlay with smooth toggle flow | DONE | Set isCameraLive default to false so yellow button appears on load; clicking smoothly removes overlay into AR without alerts |
| TASK-20 | Fix AR video recording save to Snap/Feed | DONE | Cached video blob in IndexedDB, prevented Firestore snapshot wipeout of pending local posts, added live update listener |
| TASK-21 | Unify naming and navigation from Feed to Snaps | DONE | Replaced feed tab, routes, buttons, dropdown classes, translations, and storage keys with snaps (with backward compat) |
| TASK-22 | Refactor tab and page names (radar -> nearby, feed -> snaps) | DONE | Created NearbyView & SnapsView, updated BottomNav tabs & labels, App.tsx routes, and translations across 4 languages |
| TASK-23 | PWA logo & manifest background color to white | DONE | Converted PWA icons to white bg, updated theme_color & background_color to #ffffff, fixed workbox limit, build exit 0 |
| TASK-24 | Persistent Cross-Device Video Feed Sync & Anti-Blank Fallback | DONE | Implemented Firestore chunked video upload, IndexedDB caching, instant JPEG poster rendering & fallback, tested & build exit 0 |
| TASK-25 | Fix Empty Video Feed in Snaps | DONE | Fixed syncSinglePost Firestore crash, awaited cloud upload in Studio, fixed isVideo photo misdetection, and awaited video resolution in SnapsView |
| TASK-26 | Completely Block Auto Camera/Mic Permission Prompts on Initial Load | DONE | Removed startLiveCamera from mount useEffect, eliminated mic getUserMedia, permissions only requested when user explicitly clicks turn-on button |
| TASK-27 | Deploy to Firebase Hosting & Verify Live Mobile Load via Browser Subagent | DONE | Deployed hosting to walwal-app.web.app, automated browser check confirmed zero camera/mic prompts and clean offline overlay |
| TASK-28 | Always-on Camera/Mic/Location with Settings Opt-Out | DONE | Initialized camera, mic, and location to ON by default, integrated video+mic getUserMedia, wired real-time SettingsView toggles, built & deployed to hosting |
| TASK-29 | 3-Second Video Recording & Direct Registration to Snaps | DONE | Shortened recording time to 3s (countdown 3->2->1), routed directly to Snaps modal upon completion, verified video play & post registration, built & deployed |
| TASK-30 | Fix ARCameraView recording button and badge i18n support | DONE | Localized recording badge, countdown, button titles, and canvas speech bubbles across ko, en, ja, es; build exit 0 |
| TASK-31 | Extract ARCameraView inline styles to CSS stylesheet | DONE | Separated badge, viewport, bubbles, buttons, audio bars, controls into ARCameraView.css; build exit 0 |
| TASK-32 | Fix CommunityView date/time & closed badge i18n | DONE | Added closedBadge/closedBtn across 4 locales, localized meetup dates, parsed & displayed dynamically; build exit 0 |
| TASK-33 | Extract CommunityView inline styles to CSS stylesheet | DONE | Separated card, tab, modal, facepile, and pet-selection styles into CommunityView.css; build exit 0 |
| TASK-34 | Delete Test Dog post from Firestore & persist deleted post IDs | DONE | Deleted test_post_1791081404195 from Firestore, added WALWAL_DELETED_POST_IDS blacklist & build exit 0 |
| TASK-35 | Fix Snaps feed blank-out & non-blocking synchronous render | DONE | Eliminated blocking sequential cloud video awaits, immediate mount loadLocal, guaranteed render & deployed to hosting |
| TASK-36 | Real-time Flutter Ollama LLaVA AI integration | DONE | Implemented DogMindAIService, ARCameraScreen with 3.5s auto inference & settings modal, connected in main.dart, verified flutter analyze exit 0 |
| TASK-37 | Web App (localhost:5173) Ollama LLaVA Live Vision Integration | DONE | Added Vite proxy for /ollama, created OllamaService, upgraded ARCameraView to capture real-time webcam frames for LLaVA with 5.5s auto loop & live badge, build verified |
| TASK-38 | Fix dog detection, remove breed hardcoding, and clean messy AR labels | DONE | Eliminated hardcoded Golden Retriever injection; AI checks actual dog presence, outputs concise 15-char thoughts, removed fake behavioral sub-labels |
| TASK-39 | Remove unused hardcoded breedQuips from translations.ts | DONE | Deleted over 450 lines of unused breedQuips across ko, en, ja, es and schema; verified build exit 0 |
| TASK-40 | Full 4-language (ko, en, ja, es) real-time AI dog thought integration | DONE | Implemented dynamic LANG_CONFIG across Gemini & Ollama prompts, localized standby/detect/analysis tags, verified build exit 0 |
| TASK-41 | Fix webcam frame capture condition and relax strict dog prompt trap | DONE | Removed video.paused check blocking live canvas capture, updated vision prompt to proactively translate any visible dog, verified build exit 0 |
| TASK-42 | Implement Email & Password Login / Signup and Reviewer Access Flow | DONE | Built Email/PW form, Signup tab, Reviewer auto-fill & safety net, built & deployed to hosting (exit 0) |
| TASK-43 | Dynamic Meetup Status (Upcoming vs Past) by Current Time | DONE | Implemented parseMeetupDateTime & getMeetupDynamicStatus in meetupTime.ts, linked in AdminView, build exit 0 |
| TASK-44 | Cross-Domain Pet Profile Real-time Cloud Sync | DONE | Added Firestore onSnapshot dogs listener in ProfileView, auto-merging remote pets with localStorage; built & deployed to hosting (exit 0) |
| TASK-45 | Fix Meetup Recurring Today Bug & Store Absolute Dates | DONE | Saved absolute date/dateTime in WalkMeetup, dynamic formatMeetupDisplay renders '오늘' when date===today and explicit date otherwise; built & deployed to hosting (exit 0) |
| TASK-46 | Fix Deleted Dog Resurrection & Eliminate Mock Dogs in My Pet | DONE | Permanently removed 꼬북이 from Firestore, added deleteDogProfile & delete button in ProfileView, scoped Firestore sync to user's ownerEmail, excluded mock neighbor dogs (땅콩, 구름이, 모찌) from user pets list |
| TASK-47 | PWA Service Worker Auto-Reload & Startup Storage Sanitization | DONE | Added main.tsx instant localStorage sanitization on launch, hooked controllerchange SW auto-reload, strict isMockNeighborDog filtering, built & deployed to hosting |
| TASK-48 | Fix Duplicate Pets (Bori x2, Strawberry x2) & Restore '동네친구' Title | DONE | Deduplicated dogs by name and ID in sanitizePetList, ProfileView merge, and NearbyView displayDogs; corrected title to '동네친구' across translations and NearbyView header; built & deployed to hosting |
| TASK-49 | Add My Pet Deletion UI & Logic (Tabs & Profile Card) | DONE | Added pet tab 'X' button & Profile card delete button when pets > 1; updated handleDeletePet with index support, storage/Firestore sync, and 최소 1마리 보장 알림; deployed to https://walwal-app.web.app |
| TASK-50 | Strict Camera Dog Detection & No-Dog Instruction Mode | DONE | Set initial isDogInView to false, strictly prompt Gemini/Ollama to reject non-dog frames (walls, desks, empty rooms), display '카메라에 강아지를 비춰주세요' without fake dialogue/AF box/footer when no dog is detected; deployed to https://walwal-app.web.app |

| TASK-51 | Implement Moderation System (Report, Block, Profanity Filter, Admin) | DONE | Created profanityFilter.ts & moderationService.ts; ReportModal integrated in CommunityView, SnapsView, MeetupChatModal; user block & real-time filter across all views; reports tab & moderation actions in AdminView; build exit 0 |
| TASK-52 | Block auto camera/mic on startup, require explicit user button click | DONE | Changed isCameraLive default to false, removed mount auto-getUserMedia, camera starts only upon user clicking turn-on button; build exit 0 |
| TASK-53 | Silent location consent on NearbyView enter (zero prompt) | DONE | Auto-resolving location via IP without triggering browser Geolocation prompt; prompt only triggers if user explicitly clicks GPS button; build exit 0 |
| TASK-54 | Verify and strengthen real-time sync for Camera, Mic, and Location between SettingsView and Views | DONE | Type-safe permission event listener in ARCameraView and added listener in NearbyView; build exit 0 |
| TASK-55 | Complete elimination of camera/mic auto-prompts on PWA launch & Firebase Hosting Deploy | DONE | Hard-blocked mount getUserMedia, reset camera/mic state to false in main.tsx on launch, built & deployed to https://walwal-app.web.app (exit 0) |
| TASK-56 | Clean up legacy NavTab types (feed, radar) and clarify AppTab | DONE | NavTab scoped to 5 core tabs ('ar'|'nearby'|'snaps'|'community'|'profile'), AppViewTab created for view states, removed legacy feed/radar branches, build & deploy exit 0 |
| TASK-57 | Support responsive Landscape photo & video capture in AR Camera & preserve orientation in Snaps | DONE | Dynamic orientation detection (1280x720 landscape vs 720x1280 portrait), responsive drawBubble scaling, removed forced 9/16 in modal and feed containers, deployed to hosting (exit 0) |
| TASK-58 | Permanently eliminate microphone requests (audio: false) and preserve all user work | DONE | Hardcoded audio: false to ban mic permission popups forever, simulated audioLevel gauge without hardware, committed & deployed to hosting (exit 0) |