"""Inspection contact sheet only; source game illustrations are never changed."""
from pathlib import Path
from PIL import Image,ImageDraw
root=Path(__file__).resolve().parents[1];files=sorted((root/'app/src/main/assets/art').glob('*.webp'))
w,h=320,238;sheet=Image.new('RGB',(w*5,h*((len(files)+4)//5)),(246,241,231));draw=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 with Image.open(p)as image:
  image=image.convert('RGB');image.thumbnail((w,210));x=i%5*w+(w-image.width)//2;y=i//5*h;sheet.paste(image,(x,y));draw.text((i%5*w+8,y+216),p.stem,fill=(30,60,45))
(root/'tmp').mkdir(exist_ok=True);sheet.save(root/'tmp/art-review.jpg',quality=90)
print(len(files),'generated assets in tmp/art-review.jpg')
