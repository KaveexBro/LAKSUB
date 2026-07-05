async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/robots.txt');
    const text = await r.text();
    console.log('Status:', r.status);
    console.log('Content-Type:', r.headers.get('content-type'));
    console.log('Body:', text);
  } catch (e) {
    console.error(e);
  }
}
test();
