const localtunnel = require('localtunnel');

const PORT = 3001;

(async () => {
  console.log('🚨 Starting Crisis Grid SMS Agent...');
  try {
    const tunnel = await localtunnel({ port: PORT, subdomain: `crisis-grid-sms-${Math.floor(Math.random() * 10000)}` });
    
    console.log(`\n✅ Tunnel is active! Your public webhook URL is:`);
    console.log(`   👉 \x1b[36m${tunnel.url}/api/sms-trigger\x1b[0m\n`);
    
    console.log(`🛠  TWILIO SETUP INSTRUCTIONS:`);
    console.log(`1. Go to your Twilio Console > Phone Numbers > Active Numbers`);
    console.log(`2. Click on your active phone number`);
    console.log(`3. Scroll down to "Messaging"`);
    console.log(`4. In "A MESSAGE COMES IN", select "Webhook" and paste the URL above`);
    console.log(`5. Ensure the HTTP method is set to "HTTP POST"`);
    console.log(`6. Click "Save"\n`);
    
    console.log(`📱 TEST SMS FORMAT:`);
    console.log(`   SOS [Location] [Type] [Number of People] [Description]`);
    console.log(`   Example: SOS Koramangala rescue 15 trapped in building\n`);
    
    console.log(`Waiting for incoming SMS events... (Press Ctrl+C to exit)\n`);

    tunnel.on('close', () => {
      console.log('Tunnel closed.');
    });
  } catch (err) {
    console.error('Failed to start localtunnel:', err.message);
    console.log('Make sure the local Node.js server is running on port', PORT);
  }
})();
