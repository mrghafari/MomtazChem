import XLSX from 'node-xlsx';

// Read the Excel file
const sheets = XLSX.parse('attached_assets/Book1_1753532888345.xlsx');

console.log('📊 Excel File Analysis:');
console.log('Number of sheets:', sheets.length);

for (let sheet of sheets) {
  console.log('\n📋 Sheet Name:', sheet.name);
  console.log('Total rows:', sheet.data.length);
  
  if (sheet.data.length > 0) {
    console.log('Headers:', sheet.data[0]);
    console.log('\nFirst 10 rows:');
    
    for (let i = 0; i < Math.min(10, sheet.data.length); i++) {
      console.log(`Row ${i + 1}:`, sheet.data[i]);
    }
  }
}