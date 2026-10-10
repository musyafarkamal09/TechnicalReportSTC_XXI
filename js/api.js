// Klien ringan ke backend Apps Script
// Google Sheets = database, Drive = foto.

import { SCRIPT_URL } from './config.js?v=3';

let tok = localStorage.getItem('tk');
let ME = JSON.parse(localStorage.getItem('me') || 'null');
let cb = null;

const clear = () => {
  tok = ME = null;
  localStorage.removeItem('tk');
  localStorage.removeItem('me');
};

// Memanggil backend Apps Script
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

    // Baca sebagai teks terlebih dahulu
    const raw = await r.text();

    // Periksa apakah respons berupa JSON valid
    try {
      j = JSON.parse(raw);
    } catch (parseError) {
      const preview = raw
        .trim()
        .replace(/\s+/g, ' ')
        .slice(0, 240);

      console.error('Respons server bukan JSON:', {
        status: r.status,
        response: preview
      });

      return {
        data: null,
        error: {
          message:
            `Respons server bukan JSON (HTTP ${r.status}). ` +
            `Periksa URL dan deployment Apps Script. ` +
            `Awal respons: ${preview || '[kosong]'}`
        }
      };
    }

    // Periksa status HTTP
    if (!r.ok && !j.error) {
      return {
        data: null,
        error: {
          message:
            `Server mengembalikan HTTP ${r.status}. ` +
            `${j.message || ''}`.trim()
        }
      };
    }

  } catch (e) {
    console.error('Kesalahan koneksi Apps Script:', e);

    return {
      data: null,
      error: {
        message:
          'Tidak bisa terhubung ke server Apps Script. ' +
          'Periksa koneksi internet, URL SCRIPT_URL, ' +
          'dan deployment Web App. Detail: ' +
          (e?.message || e)
      }
    };
  }

  // Tangani sesi yang tidak valid
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

class Q {
  constructor(t) {
    this.p = {
      t,
      op: 'select',
      f: []
    };
  }

  select(c, o) {
    if (this.p.op === 'select' && o?.head) {
      this.p.head = 1;
    }
    return this;
  }

  insert(d) {
    this.p.op = 'insert';
    this.p.d = d;
    return this;
  }

  update(d) {
    this.p.op = 'update';
    this.p.d = d;
    return this;
  }

  delete() {
    this.p.op = 'delete';
    return this;
  }

  f(k, o, v) {
    this.p.f.push([k, o, v]);
    return this;
  }

  eq(k, v) {
    return this.f(k, 'eq', v);
  }

  neq(k, v) {
    return this.f(k, 'neq', v);
  }

  gte(k, v) {
    return this.f(k, 'gte', v);
  }

  lte(k, v) {
    return this.f(k, 'lte', v);
  }

  lt(k, v) {
    return this.f(k, 'lt', v);
  }

  in(k, v) {
    return this.f(k, 'in', v);
  }

  match(o) {
    for (const k in o) {
      this.eq(k, o[k]);
    }
    return this;
  }

  or(s) {
    this.p.or = s;
    return this;
  }

  order(k, o) {
    this.p.ord = [k, o?.ascending !== false];
    return this;
  }

  range(a, b) {
    this.p.range = [a, b];
    return this;
  }

  limit(n) {
    this.p.range = [0, n - 1];
    return this;
  }

  single() {
    this.p.single = 1;
    return this;
  }

  then(res, rej) {
    return call('q', this.p).then(res, rej);
  }
}

const blob64 = b =>
  new Promise(r => {
    const f = new FileReader();

    f.onload = () => {
      r(f.result.split(',')[1]);
    };

    f.readAsDataURL(b);
  });

export const createClient = () => ({
  auth: {
    onAuthStateChange(f) {
      cb = f;
    },

    getSession: async () => ({
      data: {
        session:
          tok && ME
            ? { user: ME }
            : null
      }
    }),

    signInWithPassword: async ({ email, password }) => {
      const j = await call('login', {
        u: email.split('@')[0],
        pw: password
      });

      if (j.error) {
        return {
          error: j.error
        };
      }

      tok = j.token;
      ME = j.user;

      localStorage.setItem('tk', tok);
      localStorage.setItem('me', JSON.stringify(ME));

      return {
        error: null
      };
    },

    signOut: async () => {
      clear();

      if (cb) {
        cb('SIGNED_OUT');
      }
    },

    updateUser: async ({ password }) => ({
      error: (await call('pw', {
        pw: password
      })).error || null
    })
  },

  from: t => new Q(t),

  rpc: (a, p) => call(a, p || {}),

  storage: {
    from: () => ({
      upload: async (name, b) => ({
        error: (
          await call('up', {
            name,
            b64: await blob64(b)
          })
        ).error || null
      }),

      remove: async names => {
        await call('rm', { names });
        return {};
      },

      createSignedUrls: async names => ({
        data: (
          (await call('photos', { names })).urls || []
        ).map(u => ({
          signedUrl: u
        }))
      })
    })
  }
});
