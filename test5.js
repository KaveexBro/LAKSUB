import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3000/subtitles/fallout-season-1');
  await new Promise(r => setTimeout(r, 5000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log('CONTENT LENGTH:', content.length);
  
  await browser.close();
  process.exit(0);
})();
