// Klien ringan ke backend Apps Script (Google Sheets = database, Drive = foto).
import {SCRIPT_URL} from './config.js?v=3';
let tok = localStorage.getItem('tk');
let ME = null;
let cb = null;

// Baca sesi tersimpan dengan aman
try {
  const savedME = localStorage.getItem('me');

  ME = savedME ? JSON.parse(savedME) : null;

  if (!ME || typeof ME !== 'object' || Array.isArray(ME)) {
    throw new Error('Data sesi pengguna tidak valid');
  }
} catch (e) {
  console.warn('Sesi lama rusak, menghapus data sesi:', e.message);

  localStorage.removeItem('me');
  localStorage.removeItem('tk');

  tok = null;
  ME = null;
}
const clear=()=>{tok=ME=null;localStorage.removeItem('tk');localStorage.removeItem('me')};
async function call(a, p) {
  let j;

  try {
    const r = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        a,
        tok,
        ...p
      })
    });

    // Baca respons server sebagai teks terlebih dahulu
    const raw = await r.text();

    // Periksa apakah respons merupakan JSON yang valid
    try {
      j = JSON.parse(raw);
    } catch (parseError) {
      console.error('Respons server bukan JSON:', {
        status: r.status,
        url: SCRIPT_URL,
        response: raw.slice(0, 500)
      });

      return {
        data: null,
        error: {
          message:
            'Server tidak mengembalikan JSON yang valid. ' +
            'HTTP ' + r.status +
            '. Periksa URL Apps Script dan deployment. ' +
            'Respons server: ' +
            raw.trim().replace(/\s+/g, ' ').slice(0, 200)
        }
      };
    }

    if (!r.ok && !j.error) {
      return {
        data: null,
        error: {
          message: 'Server mengembalikan HTTP ' + r.status
        }
      };
    }

  } catch (e) {
    console.error('Kesalahan koneksi ke Apps Script:', e);

    return {
      data: null,
      error: {
        message:
          'Gagal menghubungi server Apps Script. ' +
          'Periksa koneksi, URL SCRIPT_URL, dan deployment. ' +
          'Detail: ' + (e.message || e)
      }
    };
  }

  // Pertahankan mekanisme penanganan sesi yang sudah ada
  if (j?.error?.code === 'AUTH') {
    clear();

    if (cb) {
      cb(
        'SIGNED_OUT',
        'Sesi habis atau tidak valid, silakan login ulang.'
      );
    }
  }

  return j;
}
class Q{constructor(t){this.p={t,op:'select',f:[]}}
 select(c,o){if(this.p.op==='select'&&o?.head)this.p.head=1;return this}insert(d){this.p.op='insert';this.p.d=d;return this}update(d){this.p.op='update';this.p.d=d;return this}delete(){this.p.op='delete';return this}
 f(k,o,v){this.p.f.push([k,o,v]);return this}eq(k,v){return this.f(k,'eq',v)}neq(k,v){return this.f(k,'neq',v)}gte(k,v){return this.f(k,'gte',v)}lte(k,v){return this.f(k,'lte',v)}lt(k,v){return this.f(k,'lt',v)}in(k,v){return this.f(k,'in',v)}
 match(o){for(const k in o)this.eq(k,o[k]);return this}or(s){this.p.or=s;return this}order(k,o){this.p.ord=[k,o?.ascending!==false];return this}range(a,b){this.p.range=[a,b];return this}limit(n){this.p.range=[0,n-1];return this}single(){this.p.single=1;return this}
 then(res,rej){return call('q',this.p).then(res,rej)}}
const blob64=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result.split(',')[1]);f.readAsDataURL(b)});
export const createClient=()=>({auth:{onAuthStateChange(f){cb=f},getSession:async()=>({data:{session:tok&&ME?{user:ME}:null}}),
 signInWithPassword:async({email,password})=>{const j=await call('login',{u:email.split('@')[0],pw:password});if(j.error)return{error:j.error};tok=j.token;ME=j.user;localStorage.setItem('tk',tok);localStorage.setItem('me',JSON.stringify(ME));return{error:null}},
 signOut:async()=>{clear();cb&&cb('SIGNED_OUT')},updateUser:async({password})=>({error:(await call('pw',{pw:password})).error||null})},
 from:t=>new Q(t),rpc:(a,p)=>call(a,p||{}),
 storage:{from:()=>({upload:async(name,b)=>({error:(await call('up',{name,b64:await blob64(b)})).error||null}),remove:async names=>{await call('rm',{names});return{}},
  createSignedUrls:async names=>({data:((await call('photos',{names})).urls||[]).map(u=>({signedUrl:u}))})})}});
