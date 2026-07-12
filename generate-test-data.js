// generate-test-data.js
const fs = require('fs');
console.log("🚀 Starting test data generation...\n");

// Generate 5000 rows mixed transactions
let csvMixed = 'id,transaction_date,source_system,destination,amount,status,description\n';
for (let i = 1; i <= 5000; i++) {
  const sources = ['NIBSS', 'Paystack', 'Flutterwave', 'Interswitch', 'Core Banking'];
  const dests = ['Wallet', 'Settlement', 'POS', 'Core Banking'];
  const statuses = ['Success', 'Failed', 'Pending'];
  const amount = Math.floor(Math.random() * 4500000) + 50000;
  const source = sources[Math.floor(Math.random() * sources.length)];
  const dest = dests[Math.floor(Math.random() * dests.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const date = `2026-05-${String(1 + Math.floor(Math.random() * 30)).padStart(2, '0')}`;
  csvMixed += `TXN-${1000000 + i},${date},${source},${dest},${amount},${status},Transaction ${i}\n`;
}
fs.writeFileSync('test_transactions_5000.csv', csvMixed);
console.log('✅ test_transactions_5000.csv generated (5,000 rows)');

// Generate 10000 rows mixed transactions
let csvLarge = 'id,transaction_date,source_system,destination,amount,status,description\n';
for (let i = 1; i <= 10000; i++) {
  const sources = ['NIBSS', 'Paystack', 'Flutterwave', 'Interswitch', 'Core Banking'];
  const dests = ['Wallet', 'Settlement', 'POS', 'Core Banking'];
  const statuses = ['Success', 'Failed', 'Pending'];
  const amount = Math.floor(Math.random() * 4500000) + 50000;
  const source = sources[Math.floor(Math.random() * sources.length)];
  const dest = dests[Math.floor(Math.random() * dests.length)];
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const date = `2026-05-${String(1 + Math.floor(Math.random() * 30)).padStart(2, '0')}`;
  csvLarge += `TXN-${1000000 + i},${date},${source},${dest},${amount},${status},Transaction ${i}\n`;
}
fs.writeFileSync('test_transactions_10000.csv', csvLarge);
console.log('✅ test_transactions_10000.csv generated (10,000 rows)');

// Generate High Value Spikes (1000 rows)
let csvSpikes = 'id,transaction_date,source_system,destination,amount,status,description\n';
for (let i = 1; i <= 1000; i++) {
  const amount = Math.floor(Math.random() * 4500000) + 1500000; // High value bias
  const sources = ['NIBSS', 'Paystack', 'Flutterwave'];
  const source = sources[Math.floor(Math.random() * sources.length)];
  const date = `2026-05-${String(1 + Math.floor(Math.random() * 30)).padStart(2, '0')}`;
  csvSpikes += `SPIKE-${1000000 + i},${date},${source},Wallet,${amount},Success,High Value Spike Transaction ${i}\n`;
}
fs.writeFileSync('high_value_spikes_1000.csv', csvSpikes);
console.log('✅ high_value_spikes_1000.csv generated (1,000 rows)');

console.log("\n🎉 All test files generated successfully!");
console.log("You can now upload them on the /uploads page.");