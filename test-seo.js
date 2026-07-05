import handler from './api/seo.js';
import http from 'http';

const server = http.createServer((req, res) => {
  // mock res.status().send() pattern for express compatibility since api/seo.js uses Vercel style syntax
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };
  res.send = (body) => {
    res.end(body);
  };
  handler(req, res);
});

server.listen(4000, () => {
    console.log("Listening on 4000");
    http.get('http://0.0.0.0:4000/subtitles/test', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
           console.log("RESPONSE:", data.slice(0, 300) + "...");
           process.exit(0);
        });
    });
});
