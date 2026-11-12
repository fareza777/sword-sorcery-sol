"""Verify packaged offline assets against the exact source tree and inspect APK flags."""
from pathlib import Path
import hashlib,json,os,subprocess,zipfile
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
base=root/'app/src/main/assets'
source={p.relative_to(base).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in base.rglob('*') if p.is_file()}
sdk=Path(os.environ.get('ANDROID_HOME',r'C:\Android\Sdk'))
report=[]
for suffix in ['', '-release']:
 apk=root/'dist'/('sunward-oath-'+version+suffix+'.apk')
 with zipfile.ZipFile(apk)as archive:
  bundled={name[7:]:hashlib.sha256(archive.read(name)).hexdigest() for name in archive.namelist() if name.startswith('assets/') and not name.endswith('/')}
  assert bundled==source,'APK assets differ from the source: '+apk.name
  assert sum(name.endswith('.webp') for name in bundled)==66
  assert sum(name.endswith('.mp3') for name in bundled)==266
  assert sum(name.endswith('.wav') for name in bundled)==3
  assert not any(name.endswith(('.jks','.keystore','.env')) for name in archive.namelist())
 badging=subprocess.check_output([str(sdk/'build-tools/35.0.0/aapt.exe'),'dump','badging',str(apk)],text=True)
 assert "versionName='"+version+"'" in badging and "versionCode='2'" in badging
 assert 'application-debuggable' not in badging
 report.append({'file':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'assetsMatchSource':True,'debuggable':False,'artAssets':66,'offlineVoices':266,'offlineScores':3})
(root/'dist/artifact-report.json').write_text(json.dumps(report,indent=2))
print('PASS: both APKs contain the exact source assets, 66 generated images, 266 voices and three scores; debugging disabled.')
