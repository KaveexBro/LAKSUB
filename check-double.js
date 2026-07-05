fetch('https://helasub.vercel.app/https://helasub.vercel.app/sitemap.xml').then(r => console.log('Content-Type:', r.headers.get('content-type'))).catch(console.error);
