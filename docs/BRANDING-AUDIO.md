# Branding and sound · 1.3.0

The launcher master `app/src/main/assets/branding/launcher-foreground.png` was generated with built-in ImageGen. The exact prompt and export intent are in `tools/branding-plan-v1.3.json`. The original silver/gold sword, sun and teal laurel represent Sunward Oath; no third-party game logo was used. `tools/branding_assets.py` resizes the entire emblem into legacy densities, Android adaptive safe zones, a themed monochrome derivative and a 512px store/browser icon. It never crops the emblem. The launcher master is separate from the 112 story art assets.

The first in-app launch card presents the game emblem and the readable Sunward Oath title for 1.4 seconds. The second plays the exact user-provided **F7 Developer** portrait ident, `f7_splash_portrait_720x1280_silent.mp4`, from the supplied F7 Brand package. The official final-frame PNG provides the poster and reduced-motion card. The brand animation and mark were not regenerated or altered. The four-second video is intentionally silent. Both cards have a large localized Skip control. Reduced motion shows a static F7 card, and media errors/timeouts always reach the menu. Returning to the menu does not repeat the intro. Startup never changes a save or starts music without interaction. Android's system launch window uses the same game launcher identity.

`branding/provenance.json` records hashes of the master and supplied brand assets. No other contents of the private brand drive are included.

## Original offline sound

Three 64-second stereo 44.1kHz scores replace the old mono sine-tone scores. Original harp patterns, warm chamber-string chords, restrained flute and rounded celesta create a quiet bright-fantasy mood. Notes and short room reflections wrap across each musical phrase. There are no waterfall recordings, scratchy/static loops, crackle, persistent wind or bird calls. Music is encoded as Ogg Vorbis; the decoded peaks are below −10dBFS and RMS is approximately −23.7dBFS before the game's quiet mix.

Sixteen bundled stereo WAV effects cover taps, page changes, clues, runes, corrections, healing, crafting, sword preparation, evasion, wards, allies, victory, metallic parries and contact impacts. Soft envelopes avoid clicks. A parry or ward contact plays when the animated exchange makes contact; a successful dodge has no false impact sound. There are no harsh sawtooth oscillator beeps. SFX are decoded and cached locally, limited to six simultaneous samples, and stopped when the app leaves the foreground. Muting also cancels pending playback.

Music defaults to 28% and effects to 65%; separate volume controls persist alongside the existing mute switches. Music fades in smoothly and drops to 23% of its selected level during voice playback. Speech remains the foreground. All scores, effects, VO and splash media are bundled in the APK.

To reproduce the exports, install `requirements-media.txt` and ffmpeg with libvorbis, then run:

```powershell
python tools/branding_assets.py
python tools/audio_assets.py
python tools/verify_media.py
```

Building or playing the game does not require Python, ffmpeg, a speech API key or any media service.
