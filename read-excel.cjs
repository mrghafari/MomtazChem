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
    
    // Process all data and create SQL statements
    console.log('\nProcessing all data...');
    
    // Skip header row and process data
    const dataRows = firstSheet.data.slice(1);
    
    // Group cities by province
    const provinceMap = {};
    const cityData = [];
    
    dataRows.forEach(row => {
      if (row.length >= 3 && row[0] && row[1] && row[2]) {
        const cityName = row[0].toString().trim();
        const provinceName = row[1].toString().trim();
        const distance = parseInt(row[2]) || 0;
        
        if (!provinceMap[provinceName]) {
          provinceMap[provinceName] = [];
        }
        
        provinceMap[provinceName].push({
          name: cityName,
          distance: distance
        });
        
        cityData.push({
          city: cityName,
          province: provinceName,
          distance: distance
        });
      }
    });
    
    console.log(`\nProcessed ${cityData.length} cities from ${Object.keys(provinceMap).length} provinces`);
    
    // Generate SQL for provinces
    console.log('\n=== PROVINCES SQL ===');
    const provinces = Object.keys(provinceMap).sort();
    provinces.forEach((province, index) => {
      console.log(`INSERT INTO iraqi_provinces (id, name, name_ar, name_en) VALUES (${index + 1}, '${province}', '${province}', '${province}') ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar;`);
    });
    
    // Generate SQL for cities  
    console.log('\n=== CITIES SQL ===');
    let cityId = 1;
    provinces.forEach((province, provinceIndex) => {
      const cities = provinceMap[province];
      cities.forEach(city => {
        console.log(`INSERT INTO iraqi_cities (id, name, name_ar, name_en, province_id, distance_from_erbil_km) VALUES (${cityId}, '${city.name}', '${city.name}', '${city.name}', ${provinceIndex + 1}, ${city.distance}) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, name_ar = EXCLUDED.name_ar, distance_from_erbil_km = EXCLUDED.distance_from_erbil_km;`);
        cityId++;
      });
    });
    
    console.log('\n=== SUMMARY ===');
    provinces.forEach((province, index) => {
      console.log(`${province}: ${provinceMap[province].length} cities/regions`);
    });
  }
} catch (error) {
  console.error('Error reading Excel file:', error);
}