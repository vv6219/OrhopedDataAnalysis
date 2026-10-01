const xlsx = require('xlsx');

// Load the downloaded workbook
const workbook = xlsx.readFile('data.xlsx');
console.log('Sheets found:', workbook.SheetNames);

const allData = {};
workbook.SheetNames.forEach(sheetName => {
  const sheet = workbook.Sheets[sheetName];
  const json = xlsx.utils.sheet_to_json(sheet, { defval: "" });
  if (json.length > 0) {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    console.log('Columns:', Object.keys(json[0]));
    console.log('First 2 rows:', json.slice(0, 2));
    allData[sheetName] = json;
  }
});
