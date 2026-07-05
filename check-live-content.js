async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/sitemap.xml');
    const text = await r.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}
test();
