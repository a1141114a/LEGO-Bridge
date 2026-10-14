import http from 'node:http';
import {readFile,mkdir,writeFile,rename,unlink,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {products} from './dist/products.js';

const root=path.dirname(fileURLToPath(import.meta.url));
const publicRoot=path.join(root,'dist');
const dataRoot=process.env.DATA_DIR?path.resolve(process.env.DATA_DIR):path.join(root,'.data');
const token=process.env.ADMIN_TOKEN||'';
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||'127.0.0.1';
const statuses=new Set(['pending','contacted','confirmed','closed']);
const rates=new Map();
const equal=(a,b)=>{const x=Buffer.from(a),y=Buffer.from(b);return x.length===y.length&&timingSafeEqual(x,y)};
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body))};
const receipt=o=>({id:o.id,createdAt:o.createdAt,status:o.status,total:o.total,currency:o.currency});
async function body(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>16384)throw Object.assign(Error('Request too large'),{status:413})}try{return JSON.parse(data)}catch{throw Object.assign(Error('Invalid JSON'),{status:400})}}
const validId=id=>/^LB-[A-F0-9]{16}$/.test(id);
async function getOrder(id){if(!validId(id))return null;try{return JSON.parse(await readFile(path.join(dataRoot,id+'.json'),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
async function saveOrder(o){await mkdir(dataRoot,{recursive:true});const destination=path.join(dataRoot,o.id+'.json');const temp=destination+'.'+randomBytes(4).toString('hex')+'.tmp';await writeFile(temp,JSON.stringify(o,null,2),{mode:0o600});await rename(temp,destination)}
function validateOrder(b){for(const [k,max]of [['customer',80],['email',160],['phone',40],['address',500],['notes',500]]){if(typeof (b[k]??'')!=='string'||(b[k]||'').length>max)throw Error('Invalid '+k)}if(!b.customer?.trim()||!b.address?.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email||'')||b.consent!=='on'||!['CN','KR','OTHER'].includes(b.region)||!['CNY','KRW'].includes(b.currency))throw Error('请检查姓名、邮箱、地址和隐私同意项 / 입력 정보를 확인하세요');if(!Array.isArray(b.items)||!b.items.length||b.items.length>products.length)throw Error('Empty or invalid cart');const seen=new Set();return b.items.map(i=>{const p=products.find(p=>p.id===i.id);if(!p||seen.has(i.id)||!Number.isInteger(i.quantity)||i.quantity<1||i.quantity>p.requestLimit||!p.confirmed||!Number.isFinite(b.currency==='CNY'?p.cny:p.krw)||(b.currency==='CNY'?p.cny:p.krw)<=0)throw Error('商品报价未确认或超过单次申请上限 / 가격 또는 신청 수량을 확인하세요');seen.add(i.id);return {id:i.id,quantity:i.quantity,unitPrice:b.currency==='CNY'?p.cny:p.krw}})}

export const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');
 try{
  const url=new URL(req.url,'http://localhost');let pathname;try{pathname=decodeURIComponent(url.pathname)}catch{return json(res,400,{error:'Invalid URL'})}
  if(pathname.startsWith('/api/')){
   // Reject browser cross-origin mutation. A non-browser client still needs admin/order credentials.
   if(!['GET','HEAD'].includes(req.method)&&req.headers.origin){const allowed=process.env.PUBLIC_ORIGIN||`http://${req.headers.host}`;if(req.headers.origin!==allowed)return json(res,403,{error:'Origin not allowed'})}
   if(pathname==='/api/health'&&req.method==='GET')return json(res,200,{orders:true,mode:'catalog-preview',adminConfigured:!!token});
   if(pathname==='/api/orders'&&req.method==='POST'){
    const ip=req.socket.remoteAddress,now=Date.now();if(rates.size>10000)for(const [k,v]of rates)if(now-v.at>60000)rates.delete(k);const rate=rates.get(ip)||{at:now,count:0};if(now-rate.at>60000){rate.at=now;rate.count=0}rate.count++;rates.set(ip,rate);if(rate.count>12)return json(res,429,{error:'请求过于频繁，请稍后重试 / 잠시 후 다시 시도하세요'});
    let b,items;try{b=await body(req);items=validateOrder(b)}catch(e){return json(res,e.status||400,{error:e.message})}
    const key=randomBytes(24).toString('hex');const o={id:'LB-'+randomBytes(8).toString('hex').toUpperCase(),key,createdAt:new Date().toISOString(),status:'pending',customer:b.customer.trim(),email:b.email.trim(),phone:b.phone||'',region:b.region,address:b.address.trim(),notes:b.notes||'',currency:b.currency,locale:b.locale==='ko'?'ko':'zh',items,total:items.reduce((s,i)=>s+i.unitPrice*i.quantity,0),consentAt:new Date().toISOString()};await saveOrder(o);return json(res,201,{...receipt(o),key});
   }
   if(pathname.startsWith('/api/admin/')){
    if(!token)return json(res,503,{error:'Admin is not configured'});
    if(!equal(req.headers.authorization||'',`Bearer ${token}`))return json(res,401,{error:'Unauthorized'});
    if(pathname==='/api/admin/orders'&&req.method==='GET'){await mkdir(dataRoot,{recursive:true});const files=(await readdir(dataRoot)).filter(f=>/^LB-[A-F0-9]{16}\.json$/.test(f));const orders=await Promise.all(files.map(async f=>{const o=JSON.parse(await readFile(path.join(dataRoot,f),'utf8'));const {key,...safe}=o;return safe}));return json(res,200,orders.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)))}
    const match=pathname.match(/^\/api\/admin\/orders\/(LB-[A-F0-9]{16})$/);if(match){const o=await getOrder(match[1]);if(!o)return json(res,404,{error:'Not found'});if(req.method==='PATCH'){const b=await body(req);if(!statuses.has(b.status))return json(res,400,{error:'Invalid status'});o.status=b.status;await saveOrder(o);return json(res,200,receipt(o))}if(req.method==='DELETE'){await unlink(path.join(dataRoot,o.id+'.json'));return json(res,200,{deleted:true})}}
    return json(res,404,{error:'Not found'});
   }
   const match=pathname.match(/^\/api\/orders\/(LB-[A-F0-9]{16})$/);if(match&&req.method==='GET'){const o=await getOrder(match[1]);if(!o||!equal(req.headers['x-order-key']||'',o.key))return json(res,404,{error:'Not found'});return json(res,200,receipt(o))}
   return json(res,404,{error:'Not found'});
  }
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'Method not allowed'});
  const target=path.resolve(publicRoot,'.'+(pathname==='/'?'/index.html':pathname));if(!target.startsWith(publicRoot+path.sep))return json(res,403,{error:'Forbidden'});
  let file;try{file=await readFile(target)}catch{return json(res,404,{error:'Not found'})}
  const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};res.writeHead(200,{'Content-Type':types[path.extname(target)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:file);
 }catch(e){if(!res.headersSent)json(res,e.status||500,{error:e.status?e.message:'服务暂不可用 / 서비스를 이용할 수 없습니다'});else res.end()}
});
if(process.env.NODE_ENV!=='test')server.listen(port,host,()=>console.log(`LEGO Bridge preview: http://${host}:${port}\nMode: demo. Order records are private; admin ${token?'enabled':'disabled (ADMIN_TOKEN not configured)'}.`));
