const https = require('https');

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || '';

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.models) {
        console.log("AVAILABLE MODELS:");
        json.models.forEach(m => console.log(m.name));
      } else {
        console.log(data);
      }
    } catch (e) {
      console.log(data);
    }
  });
}).on('error', (e) => {
  console.error(e);
});
