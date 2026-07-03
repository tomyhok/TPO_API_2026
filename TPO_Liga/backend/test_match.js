const http = require('http');
http.get('http://localhost:3000/api/matches?seasonId=1', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const matches = JSON.parse(data);
      console.log('Matches fetched:', matches.length);
      console.log('Sample MatchTime:', matches[0].MatchTime);
    } catch(e) { console.error('Error parsing JSON', e); }
  });
}).on('error', err => console.error(err));
