const xlsx = require('node-xlsx');
const fs = require('fs');

try {
  // Read the Excel file
  const workSheetsFromFile = xlsx.parse('attached_assets/Book1_1753527370713.xlsx');
  
  if (workSheetsFromFile.length > 0) {
    const firstSheet = workSheetsFromFile[0];
    const dataRows = firstSheet.data.slice(1); // Skip header
    
    // Group cities by province
    const provinceMap = {};
    
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
      }
    });
    
    const provinces = Object.keys(provinceMap).sort();
    
    // Generate complete SQL script
    let sqlScript = `-- Complete Iraqi Geography Update Script with Distance from Erbil
-- Generated from Excel data with 187 cities/regions from 18 provinces
-- Format updated from "شهر" to "شهر/منطقه"

-- First, add distance column if it doesn't exist
ALTER TABLE iraqi_cities 
ADD COLUMN IF NOT EXISTS distance_from_erbil_km INTEGER DEFAULT 0;

-- Clear existing data
DELETE FROM iraqi_cities;
DELETE FROM iraqi_provinces;

-- Reset sequences
ALTER SEQUENCE iraqi_provinces_id_seq RESTART WITH 1;
ALTER SEQUENCE iraqi_cities_id_seq RESTART WITH 1;

-- Insert Provinces
`;

    // Add province inserts
    provinces.forEach((province, index) => {
      sqlScript += `INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (${index + 1}, '${province}', '${province}', '${province}');\n`;
    });
    
    sqlScript += '\n-- Insert Cities/Regions with Distance from Erbil\n';
    
    // Add city inserts
    let cityId = 1;
    provinces.forEach((province, provinceIndex) => {
      sqlScript += `\n-- ${province} Province\n`;
      const cities = provinceMap[province];
      cities.forEach(city => {
        sqlScript += `INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (${cityId}, '${city.name}', '${city.name}', '${city.name}', ${provinceIndex + 1}, '${province}', ${city.distance}, true);\n`;
        cityId++;
      });
    });
    
    sqlScript += '\n-- Update table sequences\n';
    sqlScript += `SELECT setval('iraqi_provinces_id_seq', ${provinces.length});\n`;
    sqlScript += `SELECT setval('iraqi_cities_id_seq', ${cityId - 1});\n`;
    
    // Save to file
    fs.writeFileSync('iraqi-geography-complete.sql', sqlScript);
    
    console.log('✅ Complete SQL script generated: iraqi-geography-complete.sql');
    console.log(`📊 Summary: ${provinces.length} provinces, ${cityId - 1} cities/regions`);
    console.log('🏙️ Terminology updated from "شهر" to "شهر/منطقه"');
    console.log('📏 Distance from Erbil included for all locations');
    
    // Also output first few lines for verification
    console.log('\n📝 First few INSERT statements:');
    const lines = sqlScript.split('\n');
    const insertLines = lines.filter(line => line.startsWith('INSERT INTO iraqi_cities')).slice(0, 5);
    insertLines.forEach(line => console.log(line));
    
  }
} catch (error) {
  console.error('Error processing Excel file:', error);
}