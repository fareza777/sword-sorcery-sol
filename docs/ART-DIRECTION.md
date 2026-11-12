# Visual direction

The final user direction is a **bright** fantasy world and a **simple, exciting** story. Forest greens, golden sunlight, turquoise rivers, warm ivory architecture, flowers, craft and lively villages replace the original dark-fantasy premise.

Humans use a mixture of natural rear views, silhouettes, occasional closed helmets, and front/three-quarter views with upper faces completely obscured by low hair, hoods or solid ink shadow. In the latter treatment, **only the mouth is visible**. Human eyes and noses must never be visible. Do not put every person in a mask or turn every person away. Animals and monsters may show their whole faces and eyes, per the user's later clarification.

Distinct character cues: Rowan wears teal and carries a sheathed sword; Mira wears a copper smith apron and mustard scarf; Iona wears ivory, sage and a saffron hood; Rook carries river reeds and copper craftwork; Varric uses bronze royal armor. These cues keep characters identifiable when eyes are hidden.

Each image is shown in full, using `object-fit: contain`. No cinematic zoom or cover crop hides the illustration. The menu's portrait key art and the story's landscape panels have separate assets.

Painterly illustrations were generated independently for scene-specific subjects. `tools/art-sources.json` records original generation filenames; `tools/import_art.py` converts the complete image to WebP without cropping or compositing. All 66 art assets are generated raster artwork: 58 scene/menu/environment illustrations, seven transparent combat layers, and the canonical model sheet. The old vector scene plates have been removed. Only the UI emblem and interface icons remain vector. `tools/art-plan-v1.1.json` preserves the prompts and exact cast for each expansion asset. Generation used the built-in ImageGen tool, one independent asset per request. `tools/audio_assets.py` regenerates only the original score.

All text and buttons must remain readable on a phone. Story dialogue is paginated into short, justified passages. Larger choices are shown two at a time with explicit Previous/More Choices controls, so growing the type does not force the player to scroll the story screen.

Battle actors preserve generated alpha transparency and appear above the full, uncropped arena. Breathing, sword lunge, guard, dodge, magical ward and enemy recoil are animated with CSS transforms. All animation respects both the motion setting and OS reduced-motion preference. Scene images never zoom or crop. Environment-only compositions omit the cast reference so missing characters cannot appear before their rescue.
