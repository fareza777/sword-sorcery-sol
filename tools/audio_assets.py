"""Original chamber-fantasy score and SFX; no recordings, noise or water loops.
Reproduce with numpy/scipy/soundfile and ffmpeg in PATH.
"""
from pathlib import Path
import json, subprocess
import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'app/src/main/assets/audio'
RATE=44100
N=RATE*64
REPORT={'sampleRate':RATE,'channels':2,'music':{},'sfx':{},'design':'Original deterministic synthesis: harp, chamber strings, rounded celesta and breathless flute. No noise or environmental recordings.'}
def hz(note):return 440*2**((note-69)/12)
def tone(note,duration,kind='harp'):
 t=np.arange(round(duration*RATE))/RATE;f=hz(note)
 if kind=='harp':
  y=sum(a*np.sin(2*np.pi*f*h*t)*np.exp(-t*(1.45+.42*h)) for h,a in [(1,1),(2,.29),(3,.12),(4,.035)])
  env=(1-np.exp(-t*180))*np.minimum(1,(duration-t)/.12)
 elif kind=='strings':
  y=sum(a*np.sin(2*np.pi*(f*h+d)*t) for h,a,d in [(1,.65,0),(1,.23,.24),(2,.10,-.16),(3,.035,.13)])
  env=np.sin(np.pi*np.minimum(t/.9,1)/2)**2*np.sin(np.pi*np.minimum((duration-t)/1.6,1)/2)**2*(.95+.05*np.sin(2*np.pi*4.1*t))
 elif kind=='flute':
  phase=2*np.pi*f*t+.009*np.sin(2*np.pi*4.3*t)
  y=np.sin(phase)+.09*np.sin(2*phase)+.025*np.sin(3*phase)
  env=np.sin(np.pi*np.minimum(t/.14,1)/2)**2*np.sin(np.pi*np.minimum((duration-t)/.4,1)/2)**2
 else:
  y=np.sin(2*np.pi*f*t)*np.exp(-t*2.2)+.14*np.sin(2*np.pi*f*2.003*t)*np.exp(-t*4.5)
  env=(1-np.exp(-t*160))*np.minimum(1,(duration-t)/.12)
 return y*env
def add(buffer,mono,at,gain,pan=0,wrap=True):
 stereo=np.column_stack([mono*np.sqrt((1-pan)/2),mono*np.sqrt((1+pan)/2)])*gain;start=round(at*RATE)
 if wrap:buffer[(start+np.arange(len(mono)))%len(buffer)]+=stereo
 elif start<len(buffer):buffer[start:start+min(len(mono),len(buffer)-start)]+=stereo[:len(buffer)-start]
def room(y,loop=False):
 dry=y.copy()
 for delay,amount in [(.073,.12),(.137,.085),(.223,.055),(.347,.035)]:
  samples=round(delay*RATE)
  if loop:y+=np.roll(dry[:,::-1],samples,axis=0)*amount
  else:y[samples:]+=dry[:-samples,::-1]*amount
 return sosfilt(butter(2,6800,fs=RATE,output='sos'),y,axis=0)
def stats(y):return {'peakDb':round(20*np.log10(np.max(np.abs(y))+1e-12),2),'rmsDb':round(20*np.log10(np.sqrt(np.mean(y*y))+1e-12),2),'seconds':round(len(y)/RATE,4),'channels':2}
THEMES={
 'briarwick-morning':{'chords':[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61]],'melody':[74,73,69,66,67,71,69,66,62,66,69,73,71,67,64,69],'color':'Warm morning harp, lyrical flute and soft chamber strings.'},
 'river-lanterns':{'chords':[[48,55,60,64],[45,52,57,60],[41,48,53,57],[43,50,55,59]],'melody':[72,76,74,71,69,72,67,64,65,69,72,76,74,71,67,71],'color':'Slow lantern colors, plucked harp and low strings; no water recording.'},
 'keepers-of-light':{'chords':[[45,52,57,60],[41,48,53,57],[48,55,60,64],[43,50,55,59]],'melody':[69,72,76,74,72,69,65,69,67,72,76,79,74,71,67,64],'color':'Hopeful restrained chamber theme with warm cello and rounded celesta.'}}
def music(name,theme):
 y=np.zeros((N,2))
 # Sixteen four-second bars at 60 BPM; notes and reverb tails wrap across the join.
 for bar in range(16):
  chord=theme['chords'][(bar//2)%4]
  for i,note in enumerate(chord):add(y,tone(note,6,'strings'),bar*4,.021 if i else .032,(i-1.5)*.25)
  for step,degree in enumerate([0,2,1,3]):add(y,tone(chord[degree]+12,3.4),bar*4+step,.041,[-.48,.32,-.20,.48][step])
  if bar%2==0:add(y,tone(theme['melody'][bar],2.6,'flute'),bar*4+.5,.032,-.12)
  else:add(y,tone(theme['melody'][bar],3,'bell'),bar*4+1,.025,.28)
 dry=y.copy()
 for delay,amount in [(.073,.12),(.137,.085),(.223,.055),(.347,.035)]:y+=np.roll(dry[:,::-1],round(delay*RATE),axis=0)*amount
 y=sosfilt(butter(2,5600,fs=RATE,output='sos'),np.concatenate([y[-RATE:],y]),axis=0)[RATE:];y-=np.mean(y,axis=0)
 y*=min(.36/(np.max(np.abs(y))+1e-12),.065/np.sqrt(np.mean(y*y)))
 folder=OUT/'music';folder.mkdir(exist_ok=True);temp=ROOT/'tmp'/f'{name}-master.wav';temp.parent.mkdir(exist_ok=True);sf.write(temp,y,RATE,subtype='PCM_24')
 target=folder/f'{name}.ogg'
 subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(temp),'-c:a','libvorbis','-q:a','5','-metadata','artist=F7 Developer','-metadata',f'title={name}',str(target)],check=True)
 decoded,rate=sf.read(target);assert rate==RATE and len(decoded)==N
 record=stats(decoded);record.update(file=f'audio/music/{name}.ogg',description=theme['color'],loopJoin=float(np.max(np.abs(decoded[0]-decoded[-1]))))
 assert record['peakDb']<-7 and record['rmsDb']<-22 and record['loopJoin']<.015
 REPORT['music'][name]=record;print(name,record)
def effect(name,duration,notes=(),sweep=None,metal=False):
 y=np.zeros((round(duration*RATE),2))
 for note,at,gain,pan,kind in notes:add(y,tone(note,max(.12,min(duration-at,1.8)),kind),at,gain,pan,False)
 if sweep:
  a,b,gain=sweep;t=np.arange(len(y))/RATE;phase=2*np.pi*(a*t+(b-a)*t*t/(2*duration));env=np.sin(np.pi*t/duration)**2*np.exp(-t*3/duration)
  s=(np.sin(phase)+.16*np.sin(phase*1.98))*env*gain;y+=np.column_stack([s,np.roll(s,round(.0017*RATE))])
 if metal:
  t=np.arange(len(y))/RATE
  for f,a in [(540,.075),(861,.038),(1257,.024),(1763,.009)]:
   s=np.sin(2*np.pi*f*t)*(1-np.exp(-t*380))*np.exp(-t*14)*a;y+=np.column_stack([s,s*.92])
 y=room(y);fade=min(round(.025*RATE),len(y)//8);y[:200]*=np.linspace(0,1,200)[:,None];y[-fade:]*=np.linspace(1,0,fade)[:,None]
 assert np.max(np.abs(y))<.5
 folder=OUT/'sfx';folder.mkdir(exist_ok=True);sf.write(folder/f'{name}.wav',y,RATE,subtype='PCM_16')
 REPORT['sfx'][name]={**stats(y),'file':f'audio/sfx/{name}.wav'}
def note(n,at=0,g=.1,pan=0,kind='harp'):return(n,at,g,pan,kind)
if __name__=='__main__':
 OUT.mkdir(exist_ok=True)
 for name,theme in THEMES.items():music(name,theme)
 effect('tap',.16,[note(60,g=.045)])
 effect('page',.28,sweep=(460,280,.045))
 effect('clue',1.1,[note(76,g=.11,pan=-.2,kind='bell'),note(83,.13,.07,.2,'bell')])
 effect('rune',1.2,[note(69,g=.08),note(76,.10,.08,.2),note(81,.22,.06,-.2,'bell')])
 effect('wrong',.45,[note(57,g=.07),note(53,.12,.065)])
 effect('heal',1.5,[note(62,g=.07,pan=-.3),note(66,.12,.07),note(69,.24,.065,.3),note(74,.38,.055,0,'bell')])
 effect('craft',.85,[note(50,g=.08),note(74,.14,.075,.2,'bell')])
 effect('guard',.24,sweep=(220,380,.065))
 effect('strike',.30,sweep=(710,150,.095))
 effect('dodge',.32,sweep=(400,120,.055))
 effect('ward',1.3,[note(62,g=.07,pan=-.4),note(69,.08,.07),note(74,.17,.065,.4),note(78,.25,.05,0,'bell')])
 effect('ally',1.15,[note(67,g=.075,pan=-.3),note(74,.15,.075,.3,'bell')])
 effect('win',2,[note(62,g=.08,pan=-.3),note(66,.18,.08),note(69,.36,.08,.3),note(74,.6,.075,0,'bell')])
 effect('parry',.65,metal=True)
 effect('impact',.35,[note(38,g=.12)],sweep=(150,65,.09))
 effect('ward-hit',.85,[note(62,g=.075),note(74,.07,.065,.2,'bell')])
 (OUT/'soundscape.json').write_text(json.dumps(REPORT,indent=2)+'\n')
 for name in THEMES:
  old=OUT/f'{name}.wav'
  if old.exists():old.unlink()
 print('Created 3 seamless stereo scores and',len(REPORT['sfx']),'designed effects.')
