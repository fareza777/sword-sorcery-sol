from pathlib import Path
import json,sys,subprocess
root=Path(__file__).resolve().parents[1]
key=sys.argv[1];directory=Path(sys.argv[2])
src=max(directory.glob('*.png'),key=lambda p:p.stat().st_mtime)
mapping=json.loads((root/'tools/art-sources.json').read_text())
mapping[key]=src.name
(root/'tools/art-sources.json').write_text(json.dumps(mapping,indent=2)+'\n')
subprocess.run([sys.executable,str(root/'tools/import_art.py'),str(directory)],check=True)
print(key,src.name)
