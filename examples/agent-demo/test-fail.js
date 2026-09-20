const { createClient } = require('afrinex');
const client = createClient({env:'sandbox', daraja:{consumerKey:'1', consumerSecret:'2', shortcode:'3', passkey:'4'}, buni:{consumerKey:'1', consumerSecret:'2', orgShortCode:'3'}});
client.daraja.balances().catch(e => console.log(e.message));
