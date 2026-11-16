"""Export Android launcher densities from the generated raster; never crop the emblem."""
from pathlib import Path
import json
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BRAND=ROOT/'app/src/main/assets/branding'
RES=ROOT/'app/src/main/res'
BG='#174F44'

def export_icon():
    image=Image.open(BRAND/'launcher-foreground.png').convert('RGBA')
    assert image.getextrema()[3][0]==0, 'Master needs real alpha'
    artwork=image.crop(image.getbbox())
    def tile(size, fraction, background):
        canvas=Image.new('RGBA',(size,size),background)
        art=artwork.copy();art.thumbnail((round(size*fraction),round(size*fraction)),Image.Resampling.LANCZOS)
        canvas.alpha_composite(art,((size-art.width)//2,(size-art.height)//2))
        return canvas
    for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
        folder=RES/('mipmap-'+density);folder.mkdir(exist_ok=True)
        tile(size,.79,BG).convert('RGB').save(folder/'ic_launcher.png',optimize=True)
        tile(round(size*2.25),.60,(0,0,0,0)).save(folder/'ic_launcher_foreground.png',optimize=True)
    tile(512,.79,BG).convert('RGB').save(BRAND/'app-icon.png',optimize=True)
    for api in [26,33]:
        folder=RES/f'mipmap-anydpi-v{api}';folder.mkdir(exist_ok=True)
        mono='\n    <monochrome android:drawable="@drawable/ic_launcher_monochrome"/>' if api==33 else ''
        (folder/'ic_launcher.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/launcher_background"/>\n    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>'+mono+'\n</adaptive-icon>\n')
    (RES/'values/branding.xml').write_text('<resources><color name="launcher_background">'+BG+'</color></resources>\n')
    # A simple one-color derivative for Android themed icons; original generated art remains the default.
    (RES/'drawable/ic_launcher_monochrome.xml').write_text('''<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108">
    <path android:fillColor="#FFFFFFFF" android:pathData="M54,23 L59,33 L57,62 L66,66 L64,71 L57,69 L57,79 L54,85 L51,79 L51,69 L44,71 L42,66 L51,62 L49,33 Z M42,38 L44,33 L46,39 L42,44 L36,44 L37,39 Z M66,38 L71,39 L72,44 L66,44 L62,39 L64,33 Z M35,49 L42,49 L44,54 L40,59 L35,56 Z M73,49 L73,56 L68,59 L64,54 L66,49 Z M38,65 L44,62 L47,67 L44,73 L40,72 Z M70,65 L68,72 L64,73 L61,67 L64,62 Z"/>
</vector>\n''')
    print('Exported 5 launcher densities, adaptive and themed icons, and store PNG.')

if __name__=='__main__':export_icon()
