const mongoose = require('mongoose');
require('dns').setServers(['8.8.8.8']);

const uris = [
  'mongodb+srv://123mankh_db_user:mankh%40123@cluster0.lzlcget.mongodb.net/cleancity?retryWrites=true&w=majority',
  'mongodb+srv://123mankh_db_user:mankh123password@cluster0.lzlcget.mongodb.net/cleancity?retryWrites=true&w=majority'
];

async function test(uri, label) {
  console.log(`Testing: ${label}...`);
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`✅ SUCCESS: Connected using ${label}!`);
    await mongoose.disconnect();
    return true;
  } catch (err) {
    console.log(`❌ FAILURE using ${label}:`, err.message);
    return false;
  }
}

async function run() {
  await test(uris[0], 'Old password (mankh@123)');
  await test(uris[1], 'New placeholder password (mankh123password)');
  process.exit(0);
}

run();
