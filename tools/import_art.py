"""Import original generated art, preserving the entire image. No crop or compositing."""
from pathlib import Path
import json,sys
from PIL import Image
root=Path(__file__).resolve().parents[1];art=root/'app/src/main/assets/art'
sources=json.loads((root/'tools/art-sources.json').read_text())
source_dir=Path(sys.argv[1])
for key,filename in sources.items():
    src=source_dir/filename
    target=art/(key+'.webp')
    if src.exists() and (not target.exists() or src.stat().st_mtime>target.stat().st_mtime):
        temporary=art/(key+'.webp.new')
        with Image.open(src)as im:im.convert('RGBA' if 'A' in im.getbands() else 'RGB').save(temporary,'WEBP',quality=88,method=6)
        temporary.replace(target)
manifest={p.stem:'art/'+p.name for p in art.glob('*.svg') if p.stem!='emblem'}
manifest.update({p.stem:'art/'+p.name for p in art.glob('*.webp')})
manifest_tmp=art.parent/'art.mjs.new'
manifest_tmp.write_text('export default '+json.dumps(manifest,indent=2)+';\n')
manifest_tmp.replace(art.parent/'art.mjs')
print('Imported complete images. Manifest:',len(manifest),'unique scenes.')
