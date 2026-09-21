const fs = require('fs');
let content = fs.readFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', 'utf-8');

const replacements = [
  // ko
  { search: /"cta":\s*"7일 무료 체험 시작하기"/, replace: '"cta": "프리미엄 구독 시작하기"' },
  { search: /"trialDesc":\s*"7일간 100% 무료 체험 후 월 8,900원 자동 전환 \(언제든 취소 가능\)"/, replace: '"trialDesc": "월 8,900원으로 무제한 이용 (언제든 취소 가능)"' },
  { search: /"storeNotice":\s*"Google Play & App Store 안심 결제\\n구독 후 7일 이내 해지 시 0원 청구"/, replace: '"storeNotice": "Google Play & App Store 안심 결제"' },
  
  // en
  { search: /"cta":\s*"Start 7-Day Free Trial"/, replace: '"cta": "Start Premium Subscription"' },
  { search: /"trialDesc":\s*"100% Free for 7 days → Then \$6\.99\/month, cancel anytime"/, replace: '"trialDesc": "$6.99/month, cancel anytime"' },
  { search: /"storeNotice":\s*"Secure payment via Google Play & App Store\\nNo charge if canceled within 7 days"/, replace: '"storeNotice": "Secure payment via Google Play & App Store"' },
  
  // ja
  { search: /"cta":\s*"7日間無料体験を開始"/, replace: '"cta": "プレミアム購読を開始"' },
  { search: /"trialDesc":\s*"7日間100%無料体験 → 以降月額980円（いつでも解約可能）"/, replace: '"trialDesc": "月額980円でいつでも解約可能"' },
  { search: /"storeNotice":\s*"Google Play & App Store 安心決済\\n7日以内の解約で請求なし"/, replace: '"storeNotice": "Google Play & App Store 安心決済"' },
  
  // es
  { search: /"cta":\s*"Empezar prueba gratuita de 7 días"/, replace: '"cta": "Empezar suscripción Premium"' },
  { search: /"trialDesc":\s*"100% Gratis por 7 dias → Luego 6,99 €\/mes \(cancela cuando quieras\)"/, replace: '"trialDesc": "6,99 €/mes (cancela cuando quieras)"' },
  { search: /"storeNotice":\s*"Pago seguro vía Google Play y App Store\\nSin cargos si cancelas en 7 días"/, replace: '"storeNotice": "Pago seguro vía Google Play y App Store"' }
];

replacements.forEach(({ search, replace }) => {
  content = content.replace(search, replace);
});

fs.writeFileSync('e:/workspace/walwal-app/web-app/src/i18n/translations.ts', content, 'utf-8');
console.log('Removed free trial from translations');
