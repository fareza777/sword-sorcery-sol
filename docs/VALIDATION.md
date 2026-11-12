# Validation · Sunward Oath 1.1.0

Validated on 12 November 2026. This update was tested in a browser and a dedicated emulator only. The player's physical phone was not accessed.

## Automated game rules and media

`npm test`: **38 tests passed**. Covers all seven endings, all twelve side quests, graph reachability of 131 beats, resources and recovery, encounter consequences, save validation and migration, investigation rewards, water-gate persistence and unsafe-route rejection, sixteen mirror configurations, forging, atomic crafting, once-per-chapter gathering, trading, trusted ally assists and sun shards. Thirty original and thirty expanded seeded journeys complete successfully.

Media checks require all planned art to be generated, every scene/page/encounter to use a completed WebP, all seven battle layers to contain genuine alpha transparency, all 266 VO tracks to exist, and all three original 64-second scores to be complete. Old SVG scene placeholders are removed.

## Rendered browser interface

`npm run test:ui`: **786 layout checks passed**. Every story beat in English and Indonesian at 360×640 and 390×844, including larger text. A complete rendered six-chapter journey finishes all twelve quests, visits camp, gathers and crafts, solves the new interactions, chooses all seven endings, resumes a save, and uses inventory, journal, bonds, settings, memories, world notes and milestones. External requests are blocked in this test. No missing images, browser errors or out-of-screen controls.

`node tests/battle-ui.mjs`: **24 additional generated battle layouts passed**, covering four opponents across six screen/language/type variants. Verifies whole-image containment, active guard poses, ally controls and OS reduced motion. Combat controls remain visible throughout attack animations.

`node tests/voice.mjs`: **eight replay cases passed**: conversation, investigation clue, sentinel, mirror puzzle, forging, camp conversation, brambleback and encounter.

Reports: `dist/ui-test-report.json` and `dist/battle-ui-report.json`.

## Native Android offline

Dedicated Android 15 / API 35 QA emulator, airplane mode enabled, Wi-Fi and data disabled. `node tests/native-offline.mjs` passed:

- Actual bundled intro VO playback: 3.744-second file; playback advanced to 3.094 seconds.
- Save restored after force-stop and a cold restart.
- Indonesian text, bundled fonts and the native bridge load offline.
- Rune puzzle, tactical duel, investigation, water gates, mirror routing, forging, gathering, crafting and trusted ally assistance.
- All generated combat layers load with containment inside the native WebView.
- All seven ending choices and persistent ending discoveries.
- Unavailable rewarded ad produces a useful message; free hints remain usable.

The harness waits for the title/game screen rather than the splash. The emulator was shut down after testing. Report: `dist/android-test-report.json`. Native screenshots: `dist/android-offline-battle.png` and `dist/android-offline-ending.png`.

## APK integrity and limits

Debug, local and protected-signing release builds pass. Release lint and both APK Signature Scheme v2 verifications pass. Version code 2, version name 1.1.0, minimum API 24, target API 35. Both distributed APKs disable debugging. `python tools/verify_artifacts.py` confirms both APKs contain the exact source assets: 66 generated images, 266 voice tracks and three scores. Report: `dist/artifact-report.json`.

Deepgram synthesis runs only at build time; no speech key or signing material is included. Ads retain the actual Google Mobile Ads SDK and demo IDs. Offline QA verifies graceful ad unavailability, not production ad fill. VO is English with full Indonesian text. The Rate entry explains that Google Play ratings open after store publication.

## Visual review

All 66 generated assets were reviewed together and gameplay screenshots were inspected. Cast identity uses `art/cast.webp`; exact cast lists prevent Mira appearing before her rescue. The first camp uses the empty forge before Rook joins. Human upper faces are obscured, only mouths express emotion; animals and monsters can show their complete faces. Poses vary naturally. Entire images are displayed without cropping.
