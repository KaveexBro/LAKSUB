import handler from './api/sitemap.js';

const req = {};
const res = {
  setHeader: (k, v) => console.log('Set header:', k, v),
  status: (c) => ({
    send: (data) => console.log('Status:', c, 'Data length:', data.length)
  })
};

handler(req, res).then(() => console.log('Done')).catch(console.error);
