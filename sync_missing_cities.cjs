const XLSX = require('node-xlsx');
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function syncMissingCities() {
  try {
    // Read Excel file
    console.log('📊 Reading Excel file...');
    const workSheetsFromFile = XLSX.parse('attached_assets/Book1_1753529079559.xlsx');
    const data = workSheetsFromFile[0].data;
    console.log(`✅ Found ${data.length - 1} cities in Excel file`);

    // Get existing cities from database
    const existingCities = await pool.query('SELECT name_arabic FROM iraqi_cities');
    const existingCitiesSet = new Set(existingCities.rows.map(row => row.name_arabic));
    console.log(`📋 Found ${existingCities.rows.length} cities in database`);

    // Find missing cities
    const missingCities = [];
    for (let i = 1; i < data.length; i++) {
      const [cityArabic, provinceArabic, distanceFromErbil] = data[i];
      
      if (!existingCitiesSet.has(cityArabic)) {
        missingCities.push({
          cityArabic,
          provinceArabic,
          distanceFromErbil: parseInt(distanceFromErbil) || 0
        });
      }
    }

    console.log(`🔍 Found ${missingCities.length} missing cities:`);
    missingCities.forEach(city => {
      console.log(`   - ${city.cityArabic} (${city.provinceArabic}) - ${city.distanceFromErbil} km`);
    });

    if (missingCities.length === 0) {
      console.log('✅ All cities are already in the database');
      return;
    }

    // Get next available ID
    const maxIdResult = await pool.query('SELECT MAX(id) as max_id FROM iraqi_cities');
    let nextId = (maxIdResult.rows[0].max_id || 0) + 1;

    // Insert missing cities
    console.log('🔄 Adding missing cities to database...');
    
    for (const city of missingCities) {
      try {
        // Get province ID
        const provinceResult = await pool.query(
          'SELECT id FROM iraqi_provinces WHERE name_arabic = $1',
          [city.provinceArabic]
        );

        if (provinceResult.rows.length === 0) {
          console.log(`❌ Province '${city.provinceArabic}' not found, skipping ${city.cityArabic}`);
          continue;
        }

        const provinceId = provinceResult.rows[0].id;

        // Insert city
        await pool.query(
          `INSERT INTO iraqi_cities 
           (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            nextId,
            city.cityArabic,
            city.cityArabic,
            city.cityArabic, // For now, use Arabic as English until proper translation
            provinceId,
            city.provinceArabic,
            city.distanceFromErbil,
            true
          ]
        );

        console.log(`✅ Added: ${city.cityArabic} (ID: ${nextId})`);
        nextId++;

      } catch (error) {
        console.log(`❌ Error adding ${city.cityArabic}:`, error.message);
      }
    }

    console.log('🎉 City synchronization completed!');

    // Verify final count
    const finalCount = await pool.query('SELECT COUNT(*) as total FROM iraqi_cities');
    console.log(`📊 Total cities in database: ${finalCount.rows[0].total}`);

  } catch (error) {
    console.error('❌ Error syncing cities:', error);
  } finally {
    await pool.end();
  }
}

syncMissingCities();