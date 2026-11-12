# Validation · 12 November 2026

## Automated game rules

`npm test`: **15 tests passed**. Tests cover complete routes to all five endings, all six side quests, graph reachability of all 81 story beats, all encounter choices, inventory consumption, anti-farming rules, resource boundaries, puzzle failure/recovery, tactical duel wins/losses, chapter prerequisites, strict save validation, and thirty deterministic seeded complete playthroughs.

## Rendered UI

`npm run test:ui`: **486 layout checks passed**, with no browser script errors or missing images in the final run. Every story beat was inspected in English and Indonesian at 360×640 and 390×844 portrait sizes, including larger text. The test plays a complete six-chapter journey through the actual controls, finishes all side quests, resumes an autosave, inspects inventory/journal/bonds/settings, and selects all five endings. External requests are blocked in this browser test.

`node tests/voice.mjs`: the Listen button correctly selects conversation, duel-telegraph, and encounter tracks.

Machine-readable results: `dist/ui-test-report.json`.

## Android

The app was installed and launched on a physical Android 13 phone. Native WebView, local assets, bridge and phone-language detection were inspected. The revised APK uses the same local signing identity so it can update this installation without uninstalling its save.

A separate dedicated Android 15 / API 35 QA emulator was tested in **airplane mode, with Wi-Fi and mobile data disabled**. `node tests/native-offline.mjs` verified:

- Genuine playback of bundled `intro-0.mp3` (duration 3.744 seconds; playback position advanced).
- Autosave survives force-stop and a cold application restart.
- Indonesian text, bundled fonts and local native bridge load offline.
- Both puzzle/duel mechanics and all five ending selections.
- An unavailable rewarded ad returns a useful message; the free hint remains usable.
- Ending discoveries persist across journeys.

Machine-readable results: `dist/android-test-report.json`. The QA emulator has separate data from the player's physical device.

## APK and security

Android debug and release builds and release lint complete successfully. The installable local and separately signed release APKs disable WebView debugging. APK signature v2 verification passes. The APK contains all story, illustration, font, music and speech assets. Deepgram synthesis is a build-time operation; no Deepgram credential is included in app/source artifacts. Signing secrets live outside the workspace.

The app uses the actual Google Mobile Ads SDK with Google's demo IDs. Native code limits interstitials to natural chapter breaks, every second chapter, at least 180 seconds apart, and at most two per session. Rewarded hints use the SDK earned-reward callback. Network ad delivery is separate from offline game completion; the automated offline test verifies graceful unavailability, not advertiser fill or production monetization.

## Visual review and scope

Painterly character scenes use the locked four-character model reference in `art/cast.webp`. Front, three-quarter, side and rear compositions vary naturally; human upper faces remain obscured and mouths can express emotion. Animals and monsters may show faces. The entire image is displayed without cropping. Scene continuity was checked: Mira is absent from the tower puzzle before her rescue, and the departure ending shows only the siblings and fox.

This is a complete **short** independent graphic novel adventure. The Rate entry point explains that public Google Play ratings are available after store publication. VO is English, with complete Indonesian text; Deepgram Aura does not currently provide Indonesian TTS. Test ad units are intentionally retained.
