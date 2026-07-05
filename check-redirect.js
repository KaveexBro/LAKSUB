fetch('https://helasub.vercel.app/sitemap.xml', {redirect: 'manual'}).then(r => console.log('Status:', r.status, 'Location:', r.headers.get('location'))).catch(console.error);
