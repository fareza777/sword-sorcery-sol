"""Publish the authorized repository's APK/source artifacts. Uses existing Git credential manager.
Credentials are kept in process memory, never printed or written to project files.
"""
import json,os,subprocess,urllib.request,urllib.error,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
env=os.environ.copy();env.update(GIT_TERMINAL_PROMPT='0',GCM_INTERACTIVE='never')
r=subprocess.run(['git','credential','fill'],input='protocol=https\nhost=github.com\n\n',capture_output=True,text=True,env=env,timeout=25,check=True)
credential=dict(line.split('=',1) for line in r.stdout.splitlines() if '=' in line)
token=credential.get('password');assert token,'No existing GitHub credential available'
headers={'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'Sunward-Oath-build'}
repo='fareza777/sword-sorcery-sol';version=json.loads((root/'package.json').read_text())['version'];tag='v'+version;sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
def request(url,method='GET',data=None,mime='application/json'):
    h=dict(headers)
    if data is not None:h['Content-Type']=mime
    with urllib.request.urlopen(urllib.request.Request(url,data=data,headers=h,method=method),timeout=180)as response:return json.load(response)
body=(root/'docs/RELEASE-1.1.0.md').read_text(encoding='utf-8')

base='https://api.github.com/repos/'+repo
try:release=request(base+'/releases/tags/'+tag)
except urllib.error.HTTPError as e:
    if e.code!=404:raise
    release=request(base+'/releases','POST',json.dumps({'tag_name':tag,'target_commitish':sha,'name':'Sunward Oath '+version,'body':body,'draft':False,'prerelease':False}).encode())
if release.get('target_commitish') not in [sha,'main']:raise RuntimeError('Existing release points to a different commit; review it before replacing anything.')
upload=release['upload_url'].split('{',1)[0];existing={x['name']:x for x in release.get('assets',[])}
for filename in ['sunward-oath-'+version+'.apk','sunward-oath-'+version+'-release.apk','sunward-oath-'+version+'-source.zip','SHA256SUMS.txt']:
    p=root/'dist'/filename
    if filename in existing:
        if existing[filename]['size']!=p.stat().st_size:raise RuntimeError('Different asset already exists: '+filename)
        continue
    mime='application/vnd.android.package-archive' if p.suffix=='.apk' else 'application/zip' if p.suffix=='.zip' else 'text/plain'
    request(upload+'?name='+filename,'POST',p.read_bytes(),mime);print('Uploaded',filename)
final=request(base+'/releases/'+str(release['id']))
(root/'dist/release.json').write_text(json.dumps({'url':final['html_url'],'commit':sha,'assets':{a['name']:a['browser_download_url'] for a in final['assets']}},indent=2))
print('Release:',final['html_url'])
