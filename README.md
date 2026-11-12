# Sunward Oath

A complete, short Android interactive graphic novel set in a bright sword-and-sorcery valley. Rowan follows the clues left by his kidnapped sister Mira, joins a goblin river scout and a sun mage, and confronts the captain who taught him to fight.

Original story and world. The reference to **7Days by Buff Studio** informed short conversational beats, relationship consequences and branching choices; no characters, dialogue, interface assets or illustrations were copied.

## Play

Install `dist/sunward-oath-1.0.0.apk` on Android 7.0 or later. Allow installation from the app you use to open the APK. The game is portrait and works offline, including its English character voices. Internet is used only for optional Google test ads and external sharing.

- Six complete chapters, 81 story beats, six side quests, six consequential encounters, five endings.
- Exploration across 19 destinations, clues, a usable inventory, two rune puzzles, and three tactical duels.
- Stamina, mana, wounds, recovery, four relationships, persistent choices and chapter checkpoints.
- Default English text; complete Indonesian localization; a phone-language option.
- 160 bundled Deepgram voice tracks with distinct character voices, plus an original ambient score.
- Illustrated scenes use `object-fit: contain`: the entire image remains visible.
- Readable portrait panels, paginated dialogue and choices, larger-text option and reduced motion.
- Splash, onboarding, New Journey, Continue, dual autosave, settings, journal, ending gallery, about, share and rate entry point.

The rating entry point explains that Google Play reviews will open after publication. This repository is not a published Play Store listing. Ads intentionally use Google's demo app/unit IDs, as requested.

## Build

Requirements: JDK 17 or newer, Android SDK platform 35 and build-tools 35.0.0, Node.js 20+. Gradle 8.14.3 is supplied through the wrapper.

```powershell
npm ci
npm test
.\gradlew.bat :app:assembleDebug :app:lintDebug
.\tools\build.ps1
```

The primary APK uses the local developer signing identity and disables debugging, so it can update the development installation without losing its save. `sunward-oath-1.0.0-release.apk` uses a separate release signing identity and is intended for fresh installations. `tools/build.ps1` creates that release key **outside** this repository, under `%USERPROFILE%\.codex\signing\sunward-oath`. Its password is encrypted with Windows DPAPI. Back up that directory securely if you want to sign future release updates with the same identity. It is deliberately excluded from source archives. A release build without signing environment variables produces an unsigned release APK.

## Browser testing

The same local HTML/JS engine can be tested without an Android device. This is a test harness for the Android game, not a remote dependency.

```powershell
npm run serve
# In a second terminal (Google Chrome must be installed):
npm run test:ui
node tests/voice.mjs
```

Pure engine tests exercise all five endings, every required quest, resource and save boundaries, failure/recovery, all encounters, and thirty seeded complete playthroughs. Browser tests play a complete journey through real controls and audit every story beat in both languages at small and normal portrait sizes, with larger text. Reports are written under `dist/`.

For native offline QA, use a dedicated emulator with the debug APK installed, airplane mode enabled and Wi-Fi/data disabled, then run `node tests/native-offline.mjs`. Its default device is `emulator-5580`; override `SUNWARD_QA_DEVICE` for your own emulator. It deliberately refuses physical devices. See `docs/VALIDATION.md` for results.

## Source layout

| Path | Purpose |
| --- | --- |
| `app/src/main/assets/story.mjs` | Original bilingual story, quests, items, encounters and ending definitions |
| `app/src/main/assets/engine.mjs` | Deterministic game rules and strict save validation |
| `app/src/main/assets/app.mjs` | Portrait UI, localization, audio, autosave, settings and tools |
| `app/src/main/assets/art/` | Original painterly illustrations and editable SVG scene plates |
| `app/src/main/assets/audio/` | Offline voice tracks, manifest and original score |
| `app/src/main/java/com/ashenroad/sunward/MainActivity.java` | Native secure local asset shell, Android sharing and actual AdMob SDK integration |
| `tools/voice.mjs` | Build-time-only Deepgram synthesis; reads an environment variable |
| `tools/assets.py` | Editable original vector plates, emblem and procedural ambient score |
| `docs/` | Walkthrough, visual direction, implementation and verification notes |

## Voice generation

The supplied voice tracks are already included; rebuilding the app never needs a Deepgram credential. To regenerate speech, set `DEEPGRAM_API_KEY` in your local process and run `node tools/voice.mjs`. The script caches existing tracks and never writes the key. Do not put a speech service key in Android assets, Gradle files, or a repository secret exposed to a client.

Deepgram Aura currently does not support Indonesian TTS. Indonesian players receive complete Indonesian text with the same offline English VO. They can turn voices off independently of music.

## Ads

Actual Google Mobile Ads SDK; demo IDs only:

- App: `ca-app-pub-3940256099942544~3347511713`
- Menu banner: `ca-app-pub-3940256099942544/6300978111`
- Chapter interstitial: `ca-app-pub-3940256099942544/1033173712`
- Optional rewarded hint: `ca-app-pub-3940256099942544/5224354917`

Banner is hidden during gameplay. Interstitials appear only at every second chapter transition, after at least one minute of play, at least three minutes apart, and at most twice per session. A rewarded hint is unlocked only by the SDK's earned-reward callback. When no ad is available, the story proceeds normally. Free clues solve both puzzles offline; an exact hint can also be purchased with recoverable in-game mana. No story content is paywalled.

Before a public store launch, configure your own app listing, production ad IDs, applicable consent handling and store privacy disclosures. The supplied edition is a fully playable independent APK with test ads.

## Credits and licenses

Story, code, scene compositions and score were created for this project with AI assistance. Painterly assets were generated for this game. Deepgram Aura synthesizes the voices. Literata and Nunito are bundled with their SIL Open Font License notices. Third-party Android dependencies retain their respective licenses. See `LICENSE` and `docs/ART-DIRECTION.md`.
