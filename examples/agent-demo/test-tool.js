const { createAfrinexAgent } = require('@afrinex/agent');
const { createClient } = require('afrinex');
const client = createClient({env:'sandbox', daraja:{consumerKey:'1', consumerSecret:'2', shortcode:'3', passkey:'4'}, buni:{consumerKey:'1', consumerSecret:'2', orgShortCode:'3'}});
console.log('client.daraja.balances type:', typeof client.daraja.balances);
console.log('client.buni.balances type:', typeof client.buni.balances);
