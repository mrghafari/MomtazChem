const xlsx = require('node-xlsx');
const fs = require('fs');

try {
  // Read the Excel file
  const workSheetsFromFile = xlsx.parse('attached_assets/Book1_1753527370713.xlsx');
  
  console.log('Number of sheets:', workSheetsFromFile.length);
  
  // Display first sheet content
  if (workSheetsFromFile.length > 0) {
    const firstSheet = workSheetsFromFile[0];
    console.log('Sheet name:', firstSheet.name);
    console.log('Number of rows:', firstSheet.data.length);
    
    // Display first 20 rows to understand the structure
    console.log('\nFirst 20 rows:');
    firstSheet.data.slice(0, 20).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, JSON.stringify(row));
    });
  }
} catch (error) {
  console.error('Error reading Excel file:', error);
}