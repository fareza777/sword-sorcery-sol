"""Create original code-native scene plates, emblem, and a gentle offline score.
Generated painterly key art overrides these plates through tools/import_art.py.
All figures are back views with solid, fully covered heads; no eyes are drawn.
"""
from pathlib import Path
import random, math, wave, struct, json
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'app/src/main/assets/art'
ART.mkdir(parents=True,exist_ok=True)
random.seed(718)
def path(d,fill,stroke='none',sw=2):return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
def rect(x,y,w,h,fill,rx=0):return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" rx="{rx}"/>'
def circle(x,y,r,fill):return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}"/>'
def line(x,y,a,b,color='#66866a',sw=3):return f'<path d="M{x} {y}L{a} {b}" stroke="{color}" stroke-width="{sw}" stroke-linecap="round"/>'
def person(x,y,s=1,color='#2a645b',hood='#335752'):
    # Scene plates are environmental illustrations. Canonical cast members appear
    # only in painterly art created with the locked model sheet, never as substitutes.
    return ''
def tree(x,y,s=1):
    return f'<g transform="translate({x} {y}) scale({s})">'+path('M-12 0 1-168 14 0Z','#817452')+line(1,-90,-43,-151,'#817452',7)+line(2,-118,41,-170,'#817452',6)+''.join(circle(a,b,r,c) for a,b,r,c in [(-35,-174,49,'#6b9970'),(24,-206,61,'#90b77c'),(59,-160,45,'#9aba80'),(-66,-144,36,'#9cbb83'),(-7,-147,53,'#82a56c')])+'</g>'
def flowers(seed=1,y0=440):
    r=random.Random(seed);out=''
    for _ in range(45):
        x=r.randint(15,885);y=r.randint(y0,586);out+=line(x,y,x+2,y-9,'#78936a',1.5)+circle(x+2,y-10,r.choice([2,3,4]),r.choice(['#e7bb5b','#f8e5ad','#e6a487','#fcf1d8']))
    return out
def sky():return rect(0,0,900,600,'#deece4')+circle(731,83,39,'#f6d994')+path('M0 265 151 131 260 239 407 109 552 247 703 158 900 269V600H0Z','#adc9b6')+path('M0 311Q185 221 345 296T900 277V600H0Z','#b9cc96')+path('M0 409Q210 312 423 389T900 362V600H0Z','#91ad7f')
def house(x,y,s=1,round=False):
    return f'<g transform="translate({x} {y}) scale({s})">'+rect(-65,-102,130,102,'#f3e4bd',12 if round else 0)+path('M-86-98-10-171 88-98Z','#b96f48')+rect(-17,-64,34,64,'#6d8168',16 if round else 3)+rect(-50,-73,22,27,'#b6d5c4',6)+rect(30,-73,22,27,'#b6d5c4',6)+line(-65,-96,65,-96,'#826b4d',5)+'</g>'
def room():
    return rect(0,0,900,600,'#e8dcb9')+path('M0 485H900V600H0Z','#d0bb8b')+''.join(line(x,485,x-100,600,'#b5a47f',2) for x in range(0,1100,130))+rect(305,62,290,327,'#7fb7aa',115)+rect(325,80,250,290,'#c6dfcf',108)+circle(497,145,25,'#f8dda0')+path('M325 295Q425 220 575 260V370H325Z','#91b18e')+line(450,81,450,370,'#eee4c6',11)+line(325,234,575,234,'#eee4c6',11)+''.join(line(x,0,x,485,'#d3c5a1',2) for x in [88,211,687,812])
def river():return path('M563 260Q380 330 505 410T380 600H760Q710 475 630 418T642 260Z','#83beb4')+path('M598 279Q484 348 559 392T514 578','#a6d7c7')
def wheel(x,y,r=94):return circle(x,y,r,'#936e4a')+circle(x,y,r-12,'#b7d0aa')+''.join(line(x,y,x+math.cos(a)*r,y+math.sin(a)*r,'#8a6d4d',9) for a in [i*math.pi/5 for i in range(10)])+circle(x,y,18,'#d5ae62')
def bell(x,y,s=1):return f'<g transform="translate({x} {y}) scale({s})">'+path('M-42 32Q-22 6-25-16Q-25-50 0-50T25-16Q22 6 42 32Z','#c89545','#946d38',3)+rect(-47,30,94,9,'#e4bd70',4)+circle(0,45,9,'#ae7e3a')+circle(0,-55,7,'#c89545')+'</g>'
def runes(x,y):
    out=''
    for i,c in enumerate(['#7caa6d','#64afa6','#e2b754']):
        a=x+(i-1)*115;out+=circle(a,y,44,'#e2ddbd')+circle(a,y,34,c)
        if i==0:out+=path(f'M{a-12} {y+13}q-9-25 26-30q1 32-26 30','#eaf3c9')+line(a-13,y+16,a+12,y-13,'#5d875d',2)
        elif i==1:out+=path(f'M{a} {y-25}q-34 39 0 48q34-9 0-48Z','#d3eee2')
        else:out+=circle(a,y,15,'#fcf0b9')+''.join(line(a+math.cos(t)*20,y+math.sin(t)*20,a+math.cos(t)*28,y+math.sin(t)*28,'#fff2bd',2)for t in [j*math.pi/4 for j in range(8)])
    return out
def plate(key):
    out=sky();seed=sum(map(ord,key));r=random.Random(seed)
    if key in ['forge','workshop','study','runes','seal','lantern','guard','crown','throne','table','council','ending_council']:
        out=room()
        if key in ['forge','workshop']:
            out+=rect(70,250,200,230,'#a79578',12)+path('M94 452V350Q170 270 246 350V452Z','#69644f')+path('M126 439q-10-64 25-92q-2 41 21 27q22-46 25-62q45 83 14 127Z','#e4a44e')+rect(285,425,470,35,'#a7804f',5)+rect(320,460,20,110,'#8f714a')+rect(702,460,20,110,'#8f714a')+path('M455 425 426 397H600L557 425Z','#63746c')+line(633,420,680,370,'#785c3c',9)+rect(647,355,65,26,'#789087',4)
            if key=='workshop':out+=person(755,365,1.6,'#bb794e','#735c44')
            else:out+=path('M170 177q-27 13-36-4q0-19 24-12l12 16q18-29 30-12q12 23-15 25Z','#e5b64a')
        elif key=='study':
            for x in [70,680]:
                out+=rect(x,120,145,340,'#9d865c',6)
                for y in [157,238,319,400]:
                    out+=rect(x+5,y+52,135,9,'#756845')
                    for j in range(7):out+=rect(x+13+j*17,y,13,50,r.choice(['#849c79','#b5895b','#789c95','#c1a869']),2)
            out+=rect(220,444,460,26,'#967b50',4)+path('M360 428 389 337 537 355 516 444Z','#f4edcf','#c8ae72')+circle(475,404,16,'#b86d4a')+line(406,371,489,381,'#b0a179',2)+line(401,385,458,392,'#b0a179',2)
        elif key in ['runes','seal']:
            out+=path('M195 486V173Q450-120 705 173V486Z','#a0a98e','#d4c9a4',15)+path('M235 486V189Q450-47 665 189V486Z','#677f6a')+runes(450,309)+path('M265 509 450 429 635 509 450 569Z','#ded2aa','#c3b78d',3)
            if key=='seal':out+=circle(450,227,62,'#e7c875')+circle(450,227,45,'#f4e1a0')+runes(450,390)
        elif key=='lantern':
            for x,y,s in [(195,191,1),(690,224,.8),(460,358,1.45)]:out+=line(x,0,x,y-59*s,'#9d946e',2)+f'<g transform="translate({x} {y}) scale({s})">'+rect(-33,-55,66,115,'#b58e4b',12)+rect(-23,-42,46,89,'#f1d37b',8)+circle(0,0,18,'#fff0b6')+path('M-28-60 0-83 28-60Z','#678976')+'</g>'
        elif key=='guard':
            for x in [110,790]:out+=line(x,107,x,493,'#8c774f',6)+path(f'M{x-44} 144h88v149l-44 32-44-32Z','#c27d55')+circle(x,206,21,'#eaca7c')
            out+=person(354,328,1.8,'#638b7c','#6d877c')+person(570,302,2,'#b68651','#5c726e')+line(532,438,459,333,'#e5e8d2',8)
        elif key in ['crown','throne']:
            out+=path('M223 502h454l-50-46H273Z','#b5aa81')+rect(355,205,190,250,'#b6a575',18)+path('M343 218V146l42 38 65-65 65 65 42-38v72Z','#cfaa59')+circle(450,280,48,'#e7c978')+path('M415 380v-45l22 19 13-28 13 28 22-19v45Z','#f4da85','#b08d42')
            if key=='throne':out+=person(280,340,1.7)+person(650,355,1.4,'#c18b54','#7e6b49')
        else:
            out+=path('M147 429Q450 310 753 429L693 500H207Z','#b79762')+rect(234,485,23,83,'#8d7652')+rect(644,485,23,83,'#8d7652')
            for x in [273,423,574]:out+=circle(x,429,23,'#e9dcb9')+path(f'M{x-14} 425q15-18 30 0v10h-30Z','#d1ac64')
            out+=person(155,321,1.3,'#7b9866','#6c8866')+person(744,326,1.3,'#ae8858','#8a795a')
            if key=='ending_council':out+=bell(450,236,.8)+person(540,281,1.2,'#b27e52','#766147')
    else:
        if key=='camp':out+=tree(116,470,1.25)+tree(790,445,1.3)+path('M285 520 432 308 578 520Z','#d5b973','#9f8c5e',4)+path('M357 520 432 385 507 520Z','#7b8d69')+path('M600 532q-13-48 14-68q-1 32 15 22q15-20 11-35q38 51 16 81Z','#e2ac5b')+line(580,536,674,536,'#8a7450',9)
        if key in ['forest','grove','reeds','memorial','bridge']:out+=tree(95,485,1.5)+tree(799,441,1.4)+tree(680,350,.75)
        if key in ['ferry','waterwheel','goblin','reeds','ending_king']:out+=river()
        if key in ['village','market','gate','goblin','ending_king']:
            out+=path('M396 317 520 317 659 600H227Z','#d5c498')
            for x,y,s in [(156,392,1.3),(730,359,1.25),(290,318,.75),(600,307,.7)]:out+=house(x,y,s,key=='goblin')
        if key=='market':out+=rect(205,369,250,143,'#bba373')+path('M188 369 245 304h172l55 65Z','#cd9161')+''.join(circle(x,415,17,c)for x,c in [(246,'#e6b65a'),(294,'#a7b27b'),(342,'#e1c16b'),(390,'#94ac74')])
        if key=='gate':out+=rect(322,176,254,282,'#d8cba2')+path('M368 458V314Q450 197 532 314V458Z','#729e88')+rect(292,152,315,29,'#d0bd8c')+''.join(rect(x,122,39,45,'#d9cba6')for x in [302,364,426,488,550])
        if key in ['forest','grove']:out+=path('M375 310Q462 432 275 600H485Q582 436 421 310Z','#d9c69b')+person(428,352,1.35)
        if key=='grove':out+=path('M655 477q-80-65-118-12q48 25 65 18l29 35h38l-11-29q53 6 38-28Z','#c98b4e')+path('M631 455 628 425 650 447 667 423 670 459Z','#ba7a45')
        if key=='ferry':out+=path('M424 422h323l-54 61H464Z','#9b7951')+rect(210,452,265,22,'#b29162')+line(250,474,250,568,'#876c47',8)+line(412,474,412,558,'#876c47',8)+person(340,335,1.2)
        if key=='waterwheel':out+=house(365,391,1.7)+wheel(475,417,113)+bell(594,502,.7)+rect(614,357,130,20,'#a38758')
        if key=='reeds':
            for x in range(105,350,18):out+=line(x,529,x+r.randint(-20,20),r.randint(316,390),'#77976b',4)
            out+=person(415,419,.8,'#a2ad78','#9f9e68')+person(315,354,1.3)
        if key=='memorial':
            out+=tree(450,509,1.8)
            for x,y in [(380,211),(510,188),(554,260),(346,288),(420,324)]:out+=line(x,y-16,x,y+15,'#a47d44',1)+path(f'M{x} {y}q-23-22 0-33q23 11 0 33Z','#d2a75c')
        if key in ['tower','stairs']:
            out+=path('M317 475 352 121 450 61 548 121 583 475Z','#e7dcba')+path('M334 135 450 32 566 135Z','#6b9d8b')+rect(411,306,78,169,'#6c9485',38)+circle(450,193,31,'#b0d6b9')+path('M327 500H574L640 578H259Z','#ccba8e')+tree(755,484,1.2)
            if key=='stairs':out+=path('M286 569H620M301 546H601M316 523H584M331 500H566','none','#f6e9c7',8)
        if key in ['castle','garden','balcony']:
            out+=rect(233,215,422,238,'#e5ddbc')+''.join(rect(x,165,75,288,'#e1d5ae')+path(f'M{x-10} 165  {x+37} 87 {x+85} 165Z','#bc8655')for x in [230,410,590])+path('M408 455V353Q450 304 492 353V455Z','#81997f')+''.join(rect(x,245,20,51,'#8db5a0',9)for x in [258,348,438,528,618])+tree(126,499,1.3)+tree(800,486,1.2)
            if key in ['garden','balcony']:
                for x,y in [(90,225),(162,241),(780,218),(827,272)]:out+=circle(x,y,12,'#e2b452')
                out+=rect(40,501,820,20,'#e2d2a8')+''.join(rect(x,521,21,79,'#d6c497')for x in range(60,860,73))
        if key in ['guardian','ending_free']:
            out+=path('M414 354q-114 24-90 120l22 80h26l3-101h139l12 102h26l17-106q7-87-74-94Z','#9aab7e')+path('M421 375 423 235q33-21 63 0l6 140Z','#aaba8c')+path('M433 237 408 179 367 164 355 126M415 195 428 149M474 239 500 179 543 164 558 128M498 196 485 148','none','#9a895a',11)+path('M416 243q35 42 76 0l-9-22h-54Z','#798e67')
            # The guardian is drawn from behind. No face or eyes.
            if key=='guardian':out+=path('M338 492Q210 536 170 452M544 495q100 33 170-43','none','#c5a65c',10)+person(138,388,1.2)
            else:out+=person(144,405,1.25)+person(230,421,1.1,'#ba8a58','#776744')
        if key=='ending_crown':out+=house(450,449,2.5)+person(450,318,1.9)+path('M423 286v-24l18 13 9-20 9 20 18-13v24Z','#d9b35b')
        if key=='ending_home':out+=path('M0 313Q450 259 900 339V600H0Z','#86bfb9')+path('M0 405Q226 340 440 445L320 600H0Z','#e8d3a0')+house(186,427,1.4)+path('M565 424h177l-33 29H596Z','#ac8153')+line(646,291,646,425,'#9d8054',4)+path('M637 304 637 402 562 402Z','#f2e8cb')+person(270,465,.85)+person(340,470,.8,'#b78955','#7e6548')
    out+=flowers(seed)
    # Fine paper grain is rendered natively, no raster editing.
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 600" width="900" height="600"><defs><filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".055"/></feComponentTransfer></filter><linearGradient id="wash" x2="0" y2="1"><stop stop-color="#fff4cf" stop-opacity=".13"/><stop offset="1" stop-color="#697d59" stop-opacity=".08"/></linearGradient></defs>'+out+rect(0,0,900,600,'url(#wash)')+'<rect width="900" height="600" filter="url(#grain)" opacity=".6"/></svg>'
keys=['cover','village','forge','market','gate','forest','bridge','grove','ferry','goblin','table','council','waterwheel','reeds','memorial','tower','study','runes','stairs','lantern','castle','workshop','guard','garden','crown','guardian','seal','balcony','throne','ending_council','ending_free','ending_crown','ending_king','ending_home','camp']
for key in keys:(ART/(key+'.svg')).write_text(plate(key),encoding='utf-8')
emblem='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108"><rect width="108" height="108" rx="25" fill="#e9c878"/><path d="M54 10 89 30 83 73 54 98 25 73 19 30Z" fill="#246659"/><path d="m54 23 7 15-4 29 9 4v5H42v-5l9-4-4-29Z" fill="#f7edcf"/><circle cx="34" cy="52" r="7" fill="#e9c878"/><circle cx="74" cy="52" r="7" fill="#e9c878"/></svg>'
(ART/'emblem.svg').write_text(emblem)
manifest={p.stem:'art/'+p.name for p in ART.glob('*.svg') if p.stem!='emblem'}
manifest.update({p.stem:'art/'+p.name for p in ART.glob('*.webp')})
(ART.parent/'art.mjs').write_text('export default '+json.dumps(manifest,indent=2)+';\n')
# Original 40-second ambient score. An open D/G pentatonic melody, no borrowed music.
RATE=22050;seconds=40
notes=[(0,62),(2.5,69),(5,71),(7.5,66),(10,64),(12.5,62),(15,57),(17.5,59),(20,62),(22.5,66),(25,69),(27.5,71),(30,69),(32.5,66),(35,64),(37.5,62)]
samples=[]
for i in range(RATE*seconds):
    t=i/RATE;v=0
    fade=min(1,t/3,(seconds-t)/3)
    for midi,gain in [(50,.045),(57,.027),(62,.023)]:
        f=440*2**((midi-69)/12);v+=gain*math.sin(2*math.pi*f*t)*(0.8+0.2*math.sin(2*math.pi*.1*t))
    for start,midi in notes:
        dt=t-start
        if 0<=dt<4.2:
            f=440*2**((midi-69)/12);env=(1-math.exp(-dt*22))*math.exp(-dt*1.55)
            v+=.14*env*(math.sin(2*math.pi*f*dt)+.25*math.sin(2*math.pi*f*2*dt)+.08*math.sin(2*math.pi*f*3*dt))
    samples.append(struct.pack('<h',int(max(-.95,min(.95,v*fade))*32767)))
audio=ART.parent/'audio';audio.mkdir(exist_ok=True)
with wave.open(str(audio/'sunlit-road.wav'),'wb')as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(RATE);w.writeframes(b''.join(samples))
print(f'Created {len(keys)} original scene plates, emblem, and offline score.')
