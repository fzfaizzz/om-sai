const fs = require('fs');
const https = require('https');

function fetchUrl(url, filename) {
  https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      fs.writeFileSync(filename, data);
      console.log(`Saved ${url} to ${filename}`);
    });
  });
}

fetchUrl('https://omsaienterprisesmumbai.com/', 'home.html');
fetchUrl('https://omsaienterprisesmumbai.com/about.html', 'about.html');
fetchUrl('https://omsaienterprisesmumbai.com/contact.html', 'contact.html');
