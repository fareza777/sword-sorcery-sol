"""Inspection contact sheet only; source game illustrations are never changed."""
from pathlib import Path
from PIL import Image,ImageDraw
import argparse,json
parser=argparse.ArgumentParser();parser.add_argument('--plan');args=parser.parse_args()
root=Path(__file__).resolve().parents[1];files=sorted((root/'app/src/main/assets/art').glob('*.webp'))
if args.plan:
 keys={job['key'] for job in json.loads((root/args.plan).read_text())['jobs']};files=[p for p in files if p.stem in keys]
w,h=320,238;sheet=Image.new('RGB',(w*5,h*((len(files)+4)//5)),(246,241,231));draw=ImageDraw.Draw(sheet)
for i,p in enumerate(files):
 with Image.open(p)as image:
  image=image.convert('RGBA');image.thumbnail((w,210));x=i%5*w+(w-image.width)//2;y=i//5*h;sheet.paste(image,(x,y),image);draw.text((i%5*w+8,y+216),p.stem,fill=(30,60,45))
out=root/'tmp'/('art-review-v1.2.jpg' if args.plan else 'art-review.jpg');out.parent.mkdir(exist_ok=True);sheet.save(out,quality=90)
print(len(files),'generated assets in',out.relative_to(root))
