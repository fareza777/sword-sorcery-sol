"""Package tracked source exactly as built, with commit provenance and artifact checksums."""
from pathlib import Path
import hashlib,json,subprocess,zipfile
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
files=subprocess.check_output(['git','ls-files','-z'],cwd=root).decode().split('\0')
entries=subprocess.check_output(['git','ls-files','--stage','-z'],cwd=root).decode().split('\0')
modes={entry.split('\t',1)[1]:entry[:6] for entry in entries if entry}
archive=root/'dist'/('sunward-oath-'+version+'-source.zip')
with zipfile.ZipFile(archive,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=6)as out:
 for name in filter(None,files):
  p=root/name
  assert p.is_file() and p.resolve().is_relative_to(root.resolve()),name
  assert p.suffix not in ['.jks','.keystore','.apk','.zip'] and p.name!='.env',name
  info=zipfile.ZipInfo.from_file(p,'sunward-oath/'+name)
  info.create_system=3
  info.external_attr=(0o100755 if modes[name]=='100755' else 0o100644)<<16
  info.compress_type=zipfile.ZIP_DEFLATED
  out.writestr(info,p.read_bytes())
 out.writestr('sunward-oath/RELEASE-COMMIT.txt',sha+'\n')
base=root/'app/src/main/assets'
with zipfile.ZipFile(archive)as source:
 for p in base.rglob('*'):
  if p.is_file():assert source.read('sunward-oath/app/src/main/assets/'+p.relative_to(base).as_posix())==p.read_bytes()
names=['sunward-oath-'+version+'.apk','sunward-oath-'+version+'-release.apk',archive.name]
(root/'dist/SHA256SUMS.txt').write_text(''.join(hashlib.sha256((root/'dist'/name).read_bytes()).hexdigest()+'  '+name+'\n' for name in names))
print('Packaged complete source:',archive.name,'from',sha)
