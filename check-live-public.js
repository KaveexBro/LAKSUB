async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/public/sitemap.xml');
    const text = await r.text();
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
  } catch (e) {
    console.error(e);
  }
}
test();
