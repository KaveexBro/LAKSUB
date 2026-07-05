async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/sitemap_live.xml', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'
      }
    });
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    const text = await r.text();
    console.log('Body start:', text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
