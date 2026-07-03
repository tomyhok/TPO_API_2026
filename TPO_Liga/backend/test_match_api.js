const http = require('http');
http.get('http://localhost:3000/api/matches?seasonId=12', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const matches = JSON.parse(data);
      console.log('Matches fetched:', matches.length);
      if (matches.length > 0) {
         console.log('Sample Match:', matches[0]);
      }
    } catch(e) { console.error('Error parsing JSON', e); }
  });
}).on('error', err => console.error(err));
