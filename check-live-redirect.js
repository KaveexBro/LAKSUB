async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/sitemap.xml', { redirect: 'manual' });
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    console.log('Location:', r.headers.get('location'));
  } catch (e) {
    console.error(e);
  }
}
test();
