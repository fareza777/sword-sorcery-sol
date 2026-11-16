"""Verify packaged offline assets against the exact source tree and inspect APK flags."""
from pathlib import Path
import hashlib,json,os,re,subprocess,zipfile
root=Path(__file__).resolve().parents[1]
version=json.loads((root/'package.json').read_text())['version']
base=root/'app/src/main/assets'
source={p.relative_to(base).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in base.rglob('*') if p.is_file()}
expected_art=len(json.loads((base/'art.mjs').read_text().removeprefix('export default ').strip().removesuffix(';')))
expected_voice=len(json.loads((base/'audio/manifest.json').read_text()))
expected_code=re.search(r'versionCode (\d+)',(root/'app/build.gradle').read_text()).group(1)
sdk=Path(os.environ.get('ANDROID_HOME',r'C:\Android\Sdk'))
report=[]
for suffix in ['', '-release']:
 apk=root/'dist'/('sunward-oath-'+version+suffix+'.apk')
 with zipfile.ZipFile(apk)as archive:
  bundled={name[7:]:hashlib.sha256(archive.read(name)).hexdigest() for name in archive.namelist() if name.startswith('assets/') and not name.endswith('/')}
  assert bundled==source,'APK assets differ from the source: '+apk.name
  assert sum(name.endswith('.webp') for name in bundled)==expected_art
  assert sum(name.endswith('.mp3') for name in bundled)==expected_voice
  soundscape=json.loads((base/'audio/soundscape.json').read_text())
  assert sum(name.endswith('.wav') for name in bundled)==len(soundscape['sfx'])
  assert sum(name.endswith('.ogg') for name in bundled)==3
  assert 'branding/f7-intro.mp4' in bundled and 'branding/app-icon.png' in bundled
  assert not any(name.endswith(('.jks','.keystore','.env')) for name in archive.namelist())
 badging=subprocess.check_output([str(sdk/'build-tools/35.0.0/aapt.exe'),'dump','badging',str(apk)],text=True)
 assert "versionName='"+version+"'" in badging and "versionCode='"+expected_code+"'" in badging
 assert 'application-debuggable' not in badging
 report.append({'file':apk.name,'bytes':apk.stat().st_size,'sha256':hashlib.sha256(apk.read_bytes()).hexdigest(),'assetsMatchSource':True,'debuggable':False,'artAssets':expected_art,'offlineVoices':expected_voice,'offlineScores':3})
(root/'dist/artifact-report.json').write_text(json.dumps(report,indent=2))
print(f'PASS: both APKs match source: {expected_art} generated images, {expected_voice} voices, three scores; debugging disabled.')
