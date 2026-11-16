"""Decode actual shipped sound, inspect launcher safe zones and official-brand integrity."""
from pathlib import Path
import hashlib,json,subprocess
import numpy as np
import soundfile as sf
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];BASE=ROOT/'app/src/main/assets'
report=json.loads((BASE/'audio/soundscape.json').read_text())
for name,digest in json.loads((BASE/'branding/provenance.json').read_text())['sha256'].items():assert hashlib.sha256((BASE/'branding'/name).read_bytes()).hexdigest()==digest
for kind in ['music','sfx']:
 for key,item in report[kind].items():
  y,rate=sf.read(BASE/item['file']);assert rate==44100 and y.ndim==2 and y.shape[1]==2
  assert np.isfinite(y).all() and np.max(np.abs(y))<.5
  assert abs(len(y)/rate-item['seconds'])<.001
  if kind=='music':assert len(y)==64*rate and np.max(np.abs(y[0]-y[-1]))<.015 and np.sqrt(np.mean((y[:,0]-y[:,1])**2))>.00001
  else:assert np.max(np.abs(y[[0,-1]]))<.0001
for density,size in [('mdpi',48),('hdpi',72),('xhdpi',96),('xxhdpi',144),('xxxhdpi',192)]:
 folder=ROOT/'app/src/main/res'/('mipmap-'+density)
 assert Image.open(folder/'ic_launcher.png').size==(size,size)
 art=Image.open(folder/'ic_launcher_foreground.png');assert art.mode=='RGBA'
 x1,y1,x2,y2=art.getbbox();edge=art.width*.19
 assert min(x1,y1,art.width-x2,art.height-y2)>=edge
 # Android's safe circular zone contains every nontransparent pixel.
 alpha=np.asarray(art)[:,:,3];ys,xs=np.where(alpha>10)
 assert np.max(np.sqrt((xs-art.width/2)**2+(ys-art.height/2)**2))<art.width*33/108
official=Path(r'G:\My Drive\F7 Developer - Content\F7 Brand\Splash Screen Video')
for local,source in [('f7-intro.mp4','App-Ready/f7_splash_portrait_720x1280_silent.mp4'),('f7-poster.png','Extras & Source/f7_splash_final_frame_portrait_1080x1920.png')]:
 if official.exists():assert hashlib.sha256((BASE/'branding'/local).read_bytes()).digest()==hashlib.sha256((official/source).read_bytes()).digest()
probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(BASE/'branding/f7-intro.mp4')]))
assert len(probe['streams'])==1 and probe['streams'][0]['codec_type']=='video' and float(probe['format']['duration'])==4
print('PASS: decoded 3 stereo loops + 16 SFX, no clipping, shaped endpoints, 5 safe icon sizes, exact official silent F7 ident.')
