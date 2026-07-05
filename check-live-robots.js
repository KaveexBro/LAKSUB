async function test() {
  try {
    const r = await fetch('https://helasub.vercel.app/robots.txt');
    const text = await r.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}
test();
