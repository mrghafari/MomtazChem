import XLSX from 'node-xlsx';
import { db } from './server/db.ts';
import { iraqiProvinces, iraqiCities } from './shared/schema.ts';

// Read the Excel file
const sheets = XLSX.parse('attached_assets/Book1_1753532888345.xlsx');
const sheet = sheets[0]; // First sheet
const data = sheet.data.slice(1); // Skip header row

console.log('🔄 Starting geographical data update...');
console.log(`📊 Found ${data.length} rows in Excel file`);

// Create province mapping
const provinceMap = new Map();
const cityList = [];

// Process data to create unique provinces and cities
for (const row of data) {
  const [cityName, provinceName, distanceFromErbil] = row;
  
  if (!cityName || !provinceName || distanceFromErbil === undefined) {
    console.log('⚠️ Skipping invalid row:', row);
    continue;
  }

  // Add province to map if not exists
  if (!provinceMap.has(provinceName)) {
    provinceMap.set(provinceName, {
      nameArabic: provinceName,
      nameEnglish: provinceName, // Will be mapped later
      namePersian: provinceName
    });
  }

  // Add city to list
  cityList.push({
    nameArabic: cityName,
    nameEnglish: cityName, // Will be mapped later
    provinceName: provinceName,
    distanceFromErbilKm: parseInt(distanceFromErbil)
  });
}

console.log(`🏛️ Found ${provinceMap.size} unique provinces`);
console.log(`🏙️ Found ${cityList.length} cities`);

try {
  console.log('🗑️ Clearing existing geographical data...');
  
  // Clear existing data
  await db.delete(iraqiCities);
  await db.delete(iraqiProvinces);
  
  console.log('✅ Cleared existing data');

  console.log('📥 Inserting provinces...');
  
  // Insert provinces first
  const provinceData = Array.from(provinceMap.entries()).map(([name, data], index) => {
    // Map Arabic province names to English
    const englishMapping = {
      'واسط': 'Wasit',
      'نینوا': 'Ninawa',
      'بغداد': 'Baghdad',
      'بابل': 'Babylon',
      'الأنبار': 'Anbar',
      'البصره': 'Basra',
      'ذی قار': 'Dhi Qar',
      'کربلاء': 'Karbala',
      'النجف': 'Najaf',
      'القادسیه': 'Al-Qadisiyyah',
      'المثنی': 'Al Muthanna',
      'میسان': 'Maysan',
      'دیالی': 'Diyala',
      'صلاح الدین': 'Salah ad Din',
      'کرکوک': 'Kirkuk',
      'اربیل': 'Erbil',
      'السلیمانیه': 'Sulaymaniyah',
      'دهوک': 'Dohuk'
    };

    return {
      id: index + 1,
      name: englishMapping[name] || name, // Required field
      nameArabic: name,
      nameEnglish: englishMapping[name] || name,
      capital: name, // Required field - using same as province name
      region: 'center' // Default region
    };
  });

  const insertedProvinces = await db.insert(iraqiProvinces).values(provinceData).returning();
  console.log(`✅ Inserted ${insertedProvinces.length} provinces`);

  console.log('📥 Inserting cities...');

  // Create province ID mapping
  const provinceIdMap = new Map();
  for (const province of insertedProvinces) {
    provinceIdMap.set(province.nameArabic, province.id);
  }

  // Insert cities
  const cityData = cityList.map((city, index) => {
    const provinceId = provinceIdMap.get(city.provinceName);
    
    // Map some common Arabic city names to English
    const englishMapping = {
      'النعمانیه': 'An-Numaniyah',
      'الهاشمیه': 'Al-Hashimiyah',
      'کوت': 'Kut',
      'الصویره': 'As-Suwayrah',
      'الحی': 'Al-Hayy',
      'العزیزیه': 'Al-Aziziyah',
      'باعجره': 'Ba\'ajrah',
      'موصل': 'Mosul',
      'الموصل الجدید': 'New Mosul',
      'بغداد': 'Baghdad',
      'اربیل': 'Erbil',
      'السلیمانیه': 'Sulaymaniyah',
      'دهوک': 'Dohuk',
      'کرکوک': 'Kirkuk',
      'البصره': 'Basra',
      'النجف': 'Najaf',
      'کربلاء': 'Karbala'
    };

    return {
      id: index + 1,
      name: englishMapping[city.nameArabic] || city.nameArabic, // Required field
      nameArabic: city.nameArabic,
      nameEnglish: englishMapping[city.nameArabic] || city.nameArabic,
      provinceId: provinceId,
      provinceName: city.provinceName, // Required field
      distanceFromErbilKm: city.distanceFromErbilKm
    };
  }).filter(city => city.provinceId); // Only include cities with valid province

  const insertedCities = await db.insert(iraqiCities).values(cityData).returning();
  console.log(`✅ Inserted ${insertedCities.length} cities`);

  console.log('🎉 Geographical data update completed successfully!');
  console.log('📊 Summary:');
  console.log(`   - Provinces: ${insertedProvinces.length}`);
  console.log(`   - Cities: ${insertedCities.length}`);
  console.log(`   - Source: Excel file with ${data.length} original rows`);

} catch (error) {
  console.error('❌ Error updating geographical data:', error);
  process.exit(1);
}

process.exit(0);