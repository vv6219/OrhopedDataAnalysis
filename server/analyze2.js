const https = require('https');
const fs = require('fs');
const xlsx = require('xlsx');

const fileUrl = 'https://docs.google.com/spreadsheets/d/1B5wHwY4kBd1vJBeuNxUdD5uQiAWbfi1QHcburvPUMf8/export?format=xlsx';
const dest = 'data2.xlsx';

console.log('Downloading...');
https.get(fileUrl, (res) => {
  if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
    // Handle redirect
    https.get(res.headers.location, (redirectRes) => {
      const file = fs.createWriteStream(dest);
      redirectRes.pipe(file);
      file.on('finish', () => {
        file.close(() => analyzeFile());
      });
    });
  } else {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => analyzeFile());
    });
  }
}).on('error', (err) => {
  console.error('Download error:', err.message);
});

function analyzeFile() {
  console.log('Analyzing...');
  const workbook = xlsx.readFile(dest);
  console.log('Sheets found:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
    if (json.length > 0) {
      console.log(`\n--- Sheet: ${sheetName} ---`);
      console.log('Columns:', Object.keys(json[0]));
      console.log('First 2 rows:', json.slice(0, 2));
    }
  });
}
