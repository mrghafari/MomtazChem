const XLSX = require('node-xlsx');
const fs = require('fs');

try {
    console.log('📊 Reading Excel file...');
    const workSheetsFromFile = XLSX.parse('attached_assets/Book1_1753529079559.xlsx');
    
    if (workSheetsFromFile.length === 0) {
        console.log('❌ No worksheets found');
        process.exit(1);
    }
    
    const data = workSheetsFromFile[0].data;
    console.log('✅ Excel file loaded successfully');
    console.log(`📋 Total rows: ${data.length}`);
    
    if (data.length > 0) {
        console.log('🏷️ Headers:', data[0]);
    }
    
    console.log('\n🔍 Searching for پنجوین/Penjwin...');
    let found = false;
    
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const rowStr = row.join(' ').toLowerCase();
        
        if (rowStr.includes('پنجوین') || rowStr.includes('penjwin') || rowStr.includes('penjween')) {
            console.log(`✅ Found at row ${i + 1}:`, row);
            found = true;
        }
    }
    
    if (!found) {
        console.log('❌ پنجوین not found in Excel file');
    }
    
    console.log('\n🏛️ Cities in Sulaymaniyah province:');
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[1] && row[1].toString().includes('سلیمانیه')) {
            console.log(`   - ${row[0]} (${row[1]}) - Distance: ${row[2]} km`);
        }
    }
    
    console.log('\n📊 Sample of all data (first 20 rows):');
    for (let i = 0; i < Math.min(20, data.length); i++) {
        console.log(`Row ${i + 1}:`, data[i]);
    }
    
} catch (error) {
    console.error('❌ Error reading Excel file:', error.message);
}