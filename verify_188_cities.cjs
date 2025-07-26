const XLSX = require('node-xlsx');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verify188Cities() {
  try {
    console.log('📊 Reading Excel file...');
    const workSheetsFromFile = XLSX.parse('attached_assets/Book1_1753529079559.xlsx');
    const data = workSheetsFromFile[0].data;
    
    // Skip header row, get actual cities from Excel
    const excelCities = data.slice(1).map(row => ({
      nameArabic: row[0],
      province: row[1],
      distance: parseInt(row[2]) || 0
    }));
    
    console.log(`✅ Excel file contains ${excelCities.length} cities`);
    
    // Get all cities from database
    const dbResult = await pool.query('SELECT name_arabic, province_name, distance_from_erbil_km FROM iraqi_cities ORDER BY name_arabic');
    const dbCities = dbResult.rows;
    
    console.log(`📋 Database contains ${dbCities.length} cities`);
    
    // Create sets for comparison
    const excelCityNames = new Set(excelCities.map(c => c.nameArabic));
    const dbCityNames = new Set(dbCities.map(c => c.name_arabic));
    
    // Check if all Excel cities are in database
    const missingInDb = excelCities.filter(city => !dbCityNames.has(city.nameArabic));
    const extraInDb = dbCities.filter(city => !excelCityNames.has(city.name_arabic));
    
    console.log('\n🔍 Verification Results:');
    console.log(`📝 Excel cities: ${excelCities.length}`);
    console.log(`💾 Database cities: ${dbCities.length}`);
    console.log(`❌ Missing in DB: ${missingInDb.length}`);
    console.log(`➕ Extra in DB: ${extraInDb.length}`);
    
    if (missingInDb.length > 0) {
      console.log('\n❌ Cities missing from database:');
      missingInDb.forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.nameArabic} (${city.province}) - ${city.distance} km`);
      });
    }
    
    if (extraInDb.length > 0) {
      console.log('\n➕ Extra cities in database (not in Excel):');
      extraInDb.slice(0, 10).forEach((city, index) => {
        console.log(`   ${index + 1}. ${city.name_arabic} (${city.province_name}) - ${city.distance_from_erbil_km} km`);
      });
      if (extraInDb.length > 10) {
        console.log(`   ... and ${extraInDb.length - 10} more`);
      }
    }
    
    // Check specific cities mentioned by user
    console.log('\n🎯 Checking specific cities:');
    const specificCities = ['پنجوین', 'حلبچه', 'قرهداغ', 'شرباز'];
    for (const cityName of specificCities) {
      const inExcel = excelCityNames.has(cityName);
      const inDb = dbCityNames.has(cityName);
      const dbCity = dbCities.find(c => c.name_arabic === cityName);
      
      console.log(`   ${cityName}: Excel=${inExcel ? '✅' : '❌'}, DB=${inDb ? '✅' : '❌'}${dbCity ? ` (${dbCity.distance_from_erbil_km}km)` : ''}`);
    }
    
    // Final summary
    console.log('\n📊 Final Summary:');
    if (missingInDb.length === 0) {
      console.log('✅ All 188 Excel cities are present in database');
    } else {
      console.log(`❌ ${missingInDb.length} cities from Excel are missing in database`);
    }
    
    if (dbCities.length >= excelCities.length) {
      console.log(`✅ Database has ${dbCities.length} cities (${dbCities.length - excelCities.length} more than Excel)`);
    } else {
      console.log(`❌ Database has fewer cities than Excel file`);
    }
    
  } catch (error) {
    console.error('❌ Error during verification:', error);
  } finally {
    await pool.end();
  }
}

verify188Cities();