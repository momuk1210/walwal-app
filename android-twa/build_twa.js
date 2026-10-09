const path = require('path');
const fs = require('fs');
const os = require('os');
const {
  Config,
  TwaManifest,
  TwaGenerator,
  KeyTool,
  GradleWrapper,
  JdkHelper,
  AndroidSdkTools,
  ConsoleLog,
  DigitalAssetLinks
} = require('@bubblewrap/core');

async function main() {
  const log = new ConsoleLog('build-twa');
  console.log('🚀 Starting WalWal Android App (TWA) Build...');

  // 1. Load Bubblewrap Config
  const configPath = path.join(os.homedir(), '.bubblewrap', 'config.json');
  let config;
  try {
    config = await Config.loadConfig(configPath);
    console.log('✅ Loaded Bubblewrap configuration');
  } catch (err) {
    console.error('Failed to load bubblewrap config, using defaults:', err);
    config = new Config(
      path.join(os.homedir(), '.bubblewrap', 'jdk', 'jdk-17.0.11+9'),
      path.join(os.homedir(), '.bubblewrap', 'android_sdk')
    );
  }

  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper, log);

  // 2. Prepare TwaManifest
  console.log('📥 Fetching Web Manifest from https://walwal-app.web.app/manifest.webmanifest ...');
  const webManifestUrl = 'https://walwal-app.web.app/manifest.webmanifest';
  const twaManifest = await TwaManifest.fromWebManifest(webManifestUrl);

  const keystorePath = path.join(__dirname, 'walwal-release.keystore');
  const keyAlias = 'walwal';
  const keyPassword = 'walwalpassword123!';

  const Color = require('color');

  // Override specific manifest fields for Google Play Store
  twaManifest.packageId = 'com.walwal.app';
  twaManifest.host = 'walwal-app.web.app';
  twaManifest.name = 'WalWal - 왈왈';
  twaManifest.launcherName = 'WalWal';
  twaManifest.themeColor = new Color('#FFB320');
  twaManifest.navigationColor = new Color('#FFFFFF');
  twaManifest.backgroundColor = new Color('#FFFBF7');
  twaManifest.appVersionName = '1.5.0';
  twaManifest.appVersionCode = 3;
  twaManifest.minSdkVersion = 24;
  twaManifest.signingKey = {
    path: keystorePath,
    alias: keyAlias
  };

  // 3. Create Signing Keystore if not exists
  const keyTool = new KeyTool(jdkHelper, log);
  if (!fs.existsSync(keystorePath)) {
    console.log('🔑 Generating Release Signing Keystore...');
    await keyTool.createSigningKey({
      path: keystorePath,
      alias: keyAlias,
      password: keyPassword,
      keypassword: keyPassword,
      fullName: 'WalWal Admin',
      organizationalUnit: 'WalWal App Team',
      organization: 'WalWal',
      country: 'KR'
    }, true);
    console.log('✅ Signing keystore generated at:', keystorePath);
  } else {
    console.log('✅ Using existing keystore at:', keystorePath);
  }

  // 4. Generate Android TWA Project Files
  const projectDir = path.join(__dirname, 'twa-project');
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true, force: true });
  }
  fs.mkdirSync(projectDir, { recursive: true });

  console.log('🛠️ Creating Android TWA Gradle Project in:', projectDir);
  const twaGenerator = new TwaGenerator();
  await twaGenerator.createTwaProject(projectDir, twaManifest, log);
  await twaManifest.saveToFile(path.join(projectDir, 'twa-manifest.json'));
  console.log('✅ TWA project generated successfully');

  // Explicitly ensure build.gradle has minSdkVersion 24
  const buildGradlePath = path.join(projectDir, 'app', 'build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
    gradleContent = gradleContent.replace(/minSdkVersion\s+\d+/g, 'minSdkVersion 24');
    fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
    console.log('✅ Enforced minSdkVersion 24 in build.gradle');
  }

  // 5. Generate Digital Asset Links
  try {
    const keyInfo = await keyTool.keyInfo({
      path: keystorePath,
      alias: keyAlias,
      keypassword: keyPassword,
      password: keyPassword
    });
    if (keyInfo && keyInfo.fingerprint) {
      console.log('🔐 SHA-256 Fingerprint:', keyInfo.fingerprint);
      const assetlinksContent = [
        {
          relation: ["delegate_permission/common.handle_all_urls"],
          target: {
            namespace: "android_app",
            package_name: twaManifest.packageId,
            sha256_cert_fingerprints: [keyInfo.fingerprint]
          }
        }
      ];
      const webWellKnownDir = path.join(__dirname, '..', 'web-app', 'public', '.well-known');
      fs.mkdirSync(webWellKnownDir, { recursive: true });
      fs.writeFileSync(
        path.join(webWellKnownDir, 'assetlinks.json'),
        JSON.stringify(assetlinksContent, null, 2),
        'utf8'
      );
      console.log('✅ Generated assetlinks.json in web-app/public/.well-known/assetlinks.json');
    }
  } catch (err) {
    console.warn('DigitalAssetLinks extraction note:', err.message);
  }

  // 6. Build Release App Bundle (.aab) and APK using GradleWrapper
  console.log('📦 Building Android App Bundle (.aab) for Google Play Store...');
  const gradleWrapper = new GradleWrapper(process, androidSdkTools, projectDir);

  const env = {
    ...process.env,
    ...jdkHelper.getEnv(),
    ...androidSdkTools.getEnv()
  };

  // Build AAB (App Bundle)
  console.log('⚙️ Running Gradle bundleRelease...');
  await gradleWrapper.bundleRelease(env, log);
  console.log('✅ AAB bundle built successfully!');

  // Build APK
  console.log('⚙️ Running Gradle assembleRelease...');
  await gradleWrapper.assembleRelease(env, log);
  console.log('✅ APK built successfully!');

  // 7. Output files to dist-app directory
  const distAppDir = path.join(__dirname, '..', 'dist-app');
  fs.mkdirSync(distAppDir, { recursive: true });

  const aabSource = path.join(projectDir, 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab');
  const apkSource = path.join(projectDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
  const signedApkSource = path.join(projectDir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');

  const aabTarget = path.join(distAppDir, 'walwal-release.aab');
  const apkTarget = path.join(distAppDir, 'walwal-release.apk');

  if (fs.existsSync(aabSource)) {
    fs.copyFileSync(aabSource, aabTarget);
    console.log('🎉 Google Play Store AAB Bundle created:', aabTarget);
  }

  const apkToCopy = fs.existsSync(signedApkSource) ? signedApkSource : apkSource;
  if (fs.existsSync(apkToCopy)) {
    fs.copyFileSync(apkToCopy, apkTarget);
    console.log('🎉 Test APK file created:', apkTarget);
  }

  console.log('\n=========================================');
  console.log('⭐ Play Store Ready Artifacts ⭐');
  console.log('1. AAB (Google Play Store 업로드용):', aabTarget);
  console.log('2. APK (스마트폰 직접 설치 테스트용):', apkTarget);
  console.log('3. Keystore (서명 키 보관용):', keystorePath);
  console.log('   - Alias: walwal');
  console.log('   - Password: walwalpassword123!');
  console.log('=========================================\n');
}

main().catch(err => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
