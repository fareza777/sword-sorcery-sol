"""Synthesize three original, seamless offline scores; no external recordings."""
from pathlib import Path
import math, wave, array
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'app/src/main/assets/audio'
RATE=22050
THEMES={
 'briarwick-morning':([62,66,69,71,69,66,64,62,57,62,64,66,69,66,64,62], [50,57,62]),
 'river-lanterns':([64,67,71,74,71,67,69,67,64,62,59,62,64,67,66,64], [52,59,64]),
 'keepers-of-light':([57,62,64,69,66,64,62,57,59,64,67,71,69,66,64,62], [45,52,57]),
}
def freq(m):return 440*2**((m-69)/12)
def create(name,melody,chord):
 seconds=64;step=4;frames=array.array('h')
 for i in range(seconds*RATE):
  t=i/RATE;value=0
  # Fade at the join prevents a click; the phrase returns to its home chord.
  fade=min(1,t/2,(seconds-t)/2)
  for j,m in enumerate(chord):
   f=freq(m);value+=(.026-j*.006)*math.sin(2*math.pi*f*t)*(0.85+.15*math.sin(2*math.pi*t/16))
  for k in [int(t//step)-1,int(t//step)]:
   if k<0:continue
   dt=t-k*step;f=freq(melody[k%len(melody)])
   env=(1-math.exp(-dt*12))*math.exp(-dt*.9)
   value+=.1*env*(math.sin(2*math.pi*f*dt)+.2*math.sin(2*math.pi*f*2*dt)+.05*math.sin(2*math.pi*f*3*dt))
  frames.append(int(max(-.9,min(.9,value*fade))*32767))
 with wave.open(str(OUT/(name+'.wav')),'wb')as out:
  out.setnchannels(1);out.setsampwidth(2);out.setframerate(RATE);out.writeframes(frames.tobytes())
 print('Created',name,'64-second offline score.')
if __name__=='__main__':
 OUT.mkdir(exist_ok=True)
 for name,(melody,chord)in THEMES.items():create(name,melody,chord)
