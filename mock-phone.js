const readline = require('readline');
const http = require('http');

const PORT = 3001;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\x1b[32m📱 [Mock Phone] > \x1b[0m'
});

console.clear();
console.log('=============================================');
console.log('         CRISIS GRID - MOCK PHONE POC        ');
console.log('=============================================');
console.log('This terminal acts as a mobile phone. Any message');
console.log('you type here will be sent as an SMS payload to');
console.log('the local Crisis Grid webhook.\n');
console.log('Format: SOS [location] [type] [people] [desc]');
console.log('Example: SOS Jayanagar rescue 5 trapped in water\n');
console.log('Type "exit" to quit.\n');

rl.prompt();

rl.on('line', (line) => {
  const text = line.trim();
  if (text.toLowerCase() === 'exit') {
    process.exit(0);
  }

  if (!text) {
    rl.prompt();
    return;
  }

  const payload = JSON.stringify({
    body: text,
    from: '+1-555-MOCK-SMS'
  });

  const req = http.request({
    hostname: 'localhost',
    port: PORT,
    path: '/api/sms-trigger',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  }, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      // The server returns a TwiML XML response. Let's extract the <Message> content to display nicely.
      const match = data.match(/<Message>(.*?)<\/Message>/);
      const reply = match ? match[1] : data;
      console.log(`\n\x1b[36m📬 [Reply Received] :\x1b[0m ${reply}\n`);
      rl.prompt();
    });
  });

  req.on('error', (e) => {
    console.log(`\n\x1b[31m❌ [Error] Could not connect to server. Is it running on port ${PORT}?\x1b[0m\n`);
    rl.prompt();
  });

  req.write(payload);
  req.end();
});
