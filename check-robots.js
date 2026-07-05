fetch('https://helasub.vercel.app/robots.txt').then(r => r.text()).then(t => console.log('Robots:', t)).catch(console.error);
