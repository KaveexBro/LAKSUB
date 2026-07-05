fetch('https://helasub.vercel.app/sitemap.xml').then(r => console.log('Content-Type:', r.headers.get('content-type'), 'Status:', r.status)).catch(console.error);
