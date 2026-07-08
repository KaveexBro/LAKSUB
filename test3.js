import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3000');
  await new Promise(r => setTimeout(r, 5000));
  
  const content = await page.evaluate(() => document.body.innerHTML);
  console.log('CONTENT LENGTH:', content.length);
  console.log('CONTENT START:', content.substring(0, 500));
  
  await browser.close();
  process.exit(0);
})();
