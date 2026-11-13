# Validation · Sunward Oath 1.2.1

Validated on 13 November 2026 with Chrome and a dedicated Android emulator. An initial review of 1.2.0 on a connected phone identified excessive inventory spacing. Version 1.2.1 is being delivered from computer-only testing and has not been installed on that physical phone.

## Game rules and media

npm test: **65 tests passed**. Covers all seven endings, twelve side quests, graph reachability and bilingual text for 137 beats, resources, recovery, encounters, save validation, investigation, water gates, all sixteen mirror configurations, forging, crafting, gathering, trade and trusted ally assists. Thirty original and thirty expanded seeded journeys finish successfully.

New coverage verifies all five evidence pairs, wrong-pair recovery, reward duplication protection, contextual item costs, diagram assistance, four stances, observation, second-phase feints, all four peaceful combat exits, gear effects, world changes, Tessa's later witness and the return-record/tool tradeoffs. A complete chronological journey proves the river evidence, bell reward and return-record action work in chapter three before the signed orders become available.

Six storage tests verify browser fallback, legacy migration, native save precedence over a stale WebView copy, commit ordering, WebView quota recovery and failed-write reporting.

Media checks require all 112 planned generated assets, genuine alpha in character/item/prop cutouts, every story art reference, all 282 bundled VO tracks and three complete original 64-second scores. Old vector scene placeholders are absent.

## Rendered browser interface

- **822 layout checks**, tests/ui.mjs: every beat in English and Indonesian at 360×640 and 390×844, including larger text. Also plays six chapters and twelve side quests through actual controls, selects seven endings and verifies resume, inventory, journal, bonds, settings and collections. External requests are blocked. No missing images, layout failures or browser errors.
- **24 battle layouts**, tests/battle-ui.mjs: four opponents across six viewport/language/type variants. Checks generated layers, full-image containment, guard poses, ally controls and reduced motion.
- **18 readability views and feature interactions**, tests/adventure-ui.mjs: actual hotspots, evidence, chapter-appropriate river reward, returning the record, contextual wire use, equipment, visible gear, changed-world art, wheel/lantern motion, stances, observation, peaceful combat and voice-driven characters. Visible labels are at least 15px. Reduced motion disables animation.
- **76 menu/sheet/chapter views**, tests/menu-readability.mjs: title, settings, about, ending previews without an active game, memories, codex, awards, inventory, context use, journal, evidence, bonds, camp, trade, crafting, pause, help and chapter cards. Both languages and type sizes. Text is at least 15px; panels stay within the viewport.
- **13 voice replay cases**, tests/voice.mjs: all four second-phase warnings, Tessa's return, investigation, conversations, puzzles, camp and encounters.

Reports in dist/: ui-test-report.json, battle-ui-report.json, adventure-ui-report.json and menu-readability-report.json. The layout/readability suites cover 940 views/checks in addition to the played journeys.

## Native Android offline

Dedicated **SunwardOath_QA**, Android 15 / API 35, emulator-5580, airplane mode enabled and Wi-Fi/data disabled. tests/native-offline.mjs verifies:

- Actual playback of the bundled 3.744-second intro VO.
- A genuine 1.1 save snapshot migrates from feature schema 2 to 3 while retaining ending location, paragraph and resources.
- The latest chosen scene survives an immediate force-stop and cold restart. Android commits private native storage synchronously before the action completes; a stale WebView copy cannot overwrite it.
- Unrelated native storage keys are rejected.
- Indonesian text, bundled fonts and the Android bridge work offline.
- Rune puzzle, tactical duel, investigation, water gates, mirror routing, forging, gathering, crafting and ally assistance.
- Evidence-based captain surrender, river evidence/record-return tradeoff, contextual inventory, equipment, stances, observation, peaceful combat and layered camp characters.
- Generated battle actors load with full-image containment.
- Seven ending choices and persistent ending discoveries.
- Unavailable rewarded ads show useful feedback; free hints remain usable.

The harness refuses physical devices. Optional SUNWARD_QA_LEGACY_FILE accepts a captured save for repeatable migration checks. Reports: dist/android-test-report.json and dist/native-migration-report.json. Screenshots: dist/android-offline-battle.png and dist/android-offline-ending.png.

## APK integrity and limits

Debug, primary/local and protected-signing release builds succeed. Release lint and both APK Signature Scheme v2 verifications pass. Version code **4**, version name **1.2.1**, minimum API 24, target API 35. Both distributed APKs disable debugging. tools/verify_artifacts.py checks every packaged asset exactly matches the source: 112 generated images, 282 voice tracks and three scores. dist/artifact-report.json records byte counts and hashes.

Speech synthesis runs only at build time. No speech credential or signing material is included in APKs or source archives. Ads use the actual Google Mobile Ads SDK with demo IDs. Offline QA tests unavailable-ad recovery, not production ad fill. VO is English with complete Indonesian text. Rate explains that Google Play reviews open after publication.

## Visual review

The 43 additions/replacements from 1.2 and four new battle assets from 1.2.1 were inspected against the canonical model sheet, and rendered gameplay screenshots were reviewed. The full set contains 112 generated raster assets. Rowan's proportions, costume and model remain consistent across emotional poses. Upper human/goblin faces stay obscured; animals and monsters can show their whole faces. Poses vary naturally. Scene art uses containment without zoom or cropping. Icons and sprites preserve transparency.

Character motion uses a complete generated base image with subtle masked duplicate overlays rather than a skeletal rig. Environmental props are separate generated assets. The app setting and OS reduced-motion preference disable animation. Optional reference sheets scroll; main story screens paginate.

## Presentation iteration in 1.2.1

The repeating decorative bird is removed. Water reflections follow scene-specific paths through painted water; leaves fall infrequently with varied timing. Battles have named numeric enemy HP, a thicker bar, a separate guard value, floating damage and clearer attack/defense/recoil animations. A dedicated generated two-handed parry pose and painted impact/sword/ward assets replace the simple geometric defense effect. Input is locked for each short exchange, and the result is saved before the animation begins. The inventory keeps enlarged text while fitting four complete item cards in the tested 393×797 viewport.

Additional test: node tests/combat-presentation.mjs. Verifies current/max enemy HP and health-bar semantics, damage feedback, duplicate-tap protection, save/resume during a finishing move, silent background transitions, both reduced-motion paths, absence of repeated birds, water-current effects, loaded generated inventory icons and compact inventory. Report: dist/combat-presentation-report.json. Preview images: dist/preview-battle-impact.png, dist/preview-phone-inventory.png and dist/preview-river-current.png.
