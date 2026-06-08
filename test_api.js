const http = require('http');

const data = JSON.stringify({
  messages: [{ role: 'user', content: 'Hi' }]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  res.on('data', (chunk) => {
    console.log(`BODY: ${chunk.toString()}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem: ${e.message}`);
});

req.write(data);
req.end();
