// WalWal Multimodal Engine Test Script

class DogAudioClassifier {
  predict(features) {
    const { rms = 0, pitchHz = 0 } = features;
    if (rms < 0.05) return { label: 'PANT_NORMAL', score: 0.88 };
    if (pitchHz > 1800) return { label: 'WHIMPER', score: 0.82 };
    if (pitchHz >= 900 && pitchHz <= 1800) {
      return rms > 0.4 ? { label: 'BARK_ALERT', score: 0.79 } : { label: 'BARK_JOY', score: 0.85 };
    }
    if (pitchHz >= 300 && pitchHz < 900) return { label: 'GROWL', score: 0.83 };
    return { label: 'HOWL', score: 0.76 };
  }
}

class DogPoseClassifier {
  classify(keypoints, tailVelocity = 0.0) {
    const noseY = keypoints.nose?.[1] ?? 0.5;
    const tailBaseY = keypoints.tailBase?.[1] ?? 0.5;
    const tailTipY = keypoints.tailTip?.[1] ?? 0.5;
    const frontPawY = keypoints.frontPaws?.[1] ?? 0.8;

    if (noseY > tailBaseY + 0.15 && tailTipY < tailBaseY) {
      return { label: 'PLAY_BOW', score: 0.92 };
    }
    if (tailVelocity > 0.6) {
      return { label: 'TAIL_WAGGING_FAST', score: 0.89 };
    }
    if (Math.abs(noseY - frontPawY) < 0.12) {
      return { label: 'SNIFFING_GROUND', score: 0.86 };
    }
    if (tailTipY > tailBaseY + 0.1) {
      return { label: 'SUBMISSIVE_CURL', score: 0.84 };
    }
    return { label: 'FREEZE_ALERT', score: 0.78 };
  }
}

function fuseAndGenerate(audioRes, poseRes, tags) {
  let compositeEmotion = 'HAPPY_CHILL';
  if (poseRes.label === 'PLAY_BOW' || (audioRes.label === 'BARK_JOY' && poseRes.label === 'TAIL_WAGGING_FAST')) {
    compositeEmotion = 'SUPER_EXCITED';
  } else if (audioRes.label === 'GROWL' || poseRes.label === 'FREEZE_ALERT') {
    compositeEmotion = 'ON_GUARD';
  } else if (poseRes.label === 'SNIFFING_GROUND') {
    compositeEmotion = 'CURIOUS_INVESTIGATOR';
  } else if (audioRes.label === 'WHIMPER' || poseRes.label === 'SUBMISSIVE_CURL') {
    compositeEmotion = 'ANXIOUS_BEGGING';
  }

  const isFoodie = tags.some(t => t.includes('간식') || t.includes('식탐'));
  const isInssa = tags.some(t => t.includes('인싸'));

  let speech = '산책 참 좋다 멍!';
  if (compositeEmotion === 'SUPER_EXCITED') {
    speech = isInssa ? '야호! 온 동네 댕댕이들아 다 나와라! 오늘 파티는 내가 주최한다 왈왈! 🚀' : '심장이 콩닥콩닥! 저기 날아가는 나비 잡으러 출동한다 멍!';
  } else if (compositeEmotion === 'CURIOUS_INVESTIGATOR') {
    speech = isFoodie ? '이 냄새는... 30분 전 지나간 핫도그 트럭의 기름진 잔향이다! 수사 착수 🌭' : '옆 동네 뽀삐가 어제 다녀간 방명록 발견! 답글 남기고 간다 치이익-';
  }

  return { compositeEmotion, speech, confidence: ((audioRes.score + poseRes.score) / 2).toFixed(2) };
}

// Scenario 1: Playful Bark + Play Bow
const audio = new DogAudioClassifier();
const pose = new DogPoseClassifier();

const res1 = fuseAndGenerate(
  audio.predict({ rms: 0.3, pitchHz: 1200 }),
  pose.classify({ nose: [0.5, 0.75], tailBase: [0.5, 0.45], tailTip: [0.5, 0.35] }),
  ['#파워인싸', '#에너지1000%']
);
console.log('--- TEST SCENARIO 1 (Play Bow + Joy Bark) ---');
console.log(JSON.stringify(res1, null, 2));

// Scenario 2: Foodie Dog Sniffing Ground
const res2 = fuseAndGenerate(
  audio.predict({ rms: 0.02, pitchHz: 200 }),
  pose.classify({ nose: [0.5, 0.78], frontPaws: [0.5, 0.80] }),
  ['#간식헌터', '#식탐대마왕']
);
console.log('--- TEST SCENARIO 2 (Nosework Sniff + Pant) ---');
console.log(JSON.stringify(res2, null, 2));
