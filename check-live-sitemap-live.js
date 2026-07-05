async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/sitemap_live.xml');
    const text = await r.text();
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    console.log('Body start:', text.substring(0, 100));
  } catch (e) {
    console.error(e);
  }
}
test();
