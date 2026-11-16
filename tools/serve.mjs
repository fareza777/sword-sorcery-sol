import http from 'node:http';import {readFile} from 'node:fs/promises';import path from 'node:path';
const root=path.resolve('app/src/main/assets');
const types={'.html':'text/html','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.woff2':'font/woff2','.mp4':'video/mp4','.ogg':'audio/ogg','.wav':'audio/wav','.json':'application/json'};
http.createServer(async(req,res)=>{try{
 let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(p==='/')p='/index.html';const file=path.resolve(root,'.'+p);if(!file.startsWith(root+path.sep))throw Error();
 const bytes=await readFile(file);res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.setHeader('Accept-Ranges','bytes');
 let body=bytes;
 if(req.headers.range){
  const match=/^bytes=(\d+)-(\d*)$/.exec(req.headers.range),start=Number(match?.[1]),end=match?.[2]?Math.min(Number(match[2]),bytes.length-1):bytes.length-1;
  if(!match||start>=bytes.length||end<start){res.writeHead(416,{'Content-Range':`bytes */${bytes.length}`});res.end();return;}
  res.statusCode=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${bytes.length}`);body=bytes.subarray(start,end+1);
 }
 res.setHeader('Content-Length',body.length);res.end(req.method==='HEAD'?undefined:body);
}catch{res.statusCode=404;res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Sunward Oath http://127.0.0.1:4173'));
