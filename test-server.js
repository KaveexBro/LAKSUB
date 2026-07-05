import http from 'http';

http.get('http://0.0.0.0:3000/subtitles/test-slug', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    // extract title and meta descriptions
    const titleMatch = data.match(/<title>(.*?)<\/title>/);
    const metaMatch = data.match(/<meta name="description" content="(.*?)" \/>/);
    console.log('Title:', titleMatch ? titleMatch[1] : 'No title');
    console.log('Desc:', metaMatch ? metaMatch[1] : 'No desc');
  });
});
