const raw = await response.text();

try {
  j = JSON.parse(raw);
} catch (e) {
  const preview = raw.trim().replace(/\s+/g, ' ').slice(0, 240);

  console.error('Respons Apps Script bukan JSON yang valid:', {
    status: response.status,
    url: SCRIPT_URL,
    contentType: response.headers.get('content-type'),
    response: raw.slice(0, 1000)
  });

  return {
    data: null,
    error: {
      message:
        'Server tidak mengembalikan JSON yang valid (HTTP ' +
        response.status +
        '). Pastikan URL adalah URL Web App yang berakhiran /exec ' +
        'dan deployment terbaru sudah aktif. Awal respons: ' +
        (preview || '[respons kosong]')
    }
  };
}
