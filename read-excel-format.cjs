const XLSX = require('node-xlsx');
const fs = require('fs');

try {
  // Read the Excel file
  const workSheetsFromFile = XLSX.parse('attached_assets/Book1_1753529079559.xlsx');
  
  if (workSheetsFromFile.length > 0) {
    const firstSheet = workSheetsFromFile[0];
    console.log('📊 Excel Sheet Name:', firstSheet.name);
    console.log('📊 Total Rows:', firstSheet.data.length);
    
    // Show first few rows to understand the structure
    console.log('\n📋 First 10 rows:');
    firstSheet.data.slice(0, 10).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
    
    // Show header row if exists
    if (firstSheet.data.length > 0) {
      console.log('\n📝 Header Row (Row 1):', firstSheet.data[0]);
    }
    
    // Show a few data rows
    if (firstSheet.data.length > 1) {
      console.log('\n📊 Sample Data Rows:');
      firstSheet.data.slice(1, 5).forEach((row, index) => {
        console.log(`Data Row ${index + 1}:`, row);
      });
    }
  } else {
    console.log('❌ No worksheets found in the Excel file');
  }
} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
}