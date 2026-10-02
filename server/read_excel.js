const xlsx = require('xlsx');

// Read the excel file
const workbook = xlsx.readFile('C:/Users/vladimir/source/repos/Data Analysis/Excel/Прайс-лист 02.10.2026.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
console.log("Headers:", data[0]);
console.log("First row:", data[1]);
console.log("Second row:", data[2]);
