async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/sitemap_live.xml');
    console.log('Headers:');
    for (const [key, value] of r.headers) {
      console.log(`${key}: ${value}`);
    }
  } catch (e) {
    console.error(e);
  }
}
test();
