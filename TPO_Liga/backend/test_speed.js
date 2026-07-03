const http = require('http');

function timeRequest(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const time = Date.now() - start;
        resolve({ url, time, status: res.statusCode, length: data.length });
      });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  console.log('Testing speed...');
  const res1 = await timeRequest('http://localhost:3000/api/teams/1?seasonId=12');
  console.log('Team 1:', res1);

  const res2 = await timeRequest('http://localhost:3000/api/standings?seasonId=12');
  console.log('Standings:', res2);

  const res3 = await timeRequest('http://localhost:3000/api/teams/2?seasonId=12');
  console.log('Team 2:', res3);
}
run();
