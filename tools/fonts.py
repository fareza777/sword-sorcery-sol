from pathlib import Path
import urllib.request,re
p=Path(__file__).resolve().parents[1]/'app/src/main/assets/fonts';p.mkdir(exist_ok=True)
ua={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'}
for name,rng in [('Literata','400..600'),('Nunito','400..900')]:
    url=f'https://fonts.googleapis.com/css2?family={name}:wght@{rng}&display=swap'
    css=urllib.request.urlopen(urllib.request.Request(url,headers=ua)).read().decode()
    links=re.findall(r'url\((https://[^)]+\.woff2)\)',css)
    if not links:raise RuntimeError('No WOFF2 returned')
    (p/(name.lower()+'.woff2')).write_bytes(urllib.request.urlopen(links[-1]).read())
    (p/(name.lower()+'-OFL.txt')).write_bytes(urllib.request.urlopen(f'https://raw.githubusercontent.com/google/fonts/main/ofl/{name.lower()}/OFL.txt').read())
    print(name,'bundled locally with license')
