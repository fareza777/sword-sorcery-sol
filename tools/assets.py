"""Compatibility entry point: music only. Scene art uses built-in ImageGen. See art-plan-v1.1.json."""
from audio_assets import THEMES,create
for name,(melody,chord) in THEMES.items(): create(name,melody,chord)
