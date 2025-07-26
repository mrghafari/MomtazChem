-- Complete Iraqi Geography Update Script with Distance from Erbil
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
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (1, 'اربیل', 'اربیل', 'اربیل');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (2, 'انبار', 'انبار', 'انبار');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (3, 'بابل', 'بابل', 'بابل');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (4, 'بصره', 'بصره', 'بصره');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (5, 'بغداد', 'بغداد', 'بغداد');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (6, 'دهوک', 'دهوک', 'دهوک');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (7, 'دیاله', 'دیاله', 'دیاله');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (8, 'ذیقار', 'ذیقار', 'ذیقار');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (9, 'سلیمانیه', 'سلیمانیه', 'سلیمانیه');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (10, 'صلاح‌الدین', 'صلاح‌الدین', 'صلاح‌الدین');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (11, 'قادسیه', 'قادسیه', 'قادسیه');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (12, 'مثنی', 'مثنی', 'مثنی');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (13, 'میسان', 'میسان', 'میسان');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (14, 'نجف', 'نجف', 'نجف');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (15, 'نینوا', 'نینوا', 'نینوا');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (16, 'واسط', 'واسط', 'واسط');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (17, 'کربلا', 'کربلا', 'کربلا');
INSERT INTO iraqi_provinces (id, name, name_arabic, name_english) VALUES (18, 'کرکوک', 'کرکوک', 'کرکوک');

-- Insert Cities/Regions with Distance from Erbil

-- اربیل Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (1, 'شقلاوه', 'شقلاوه', 'شقلاوه', 1, 'اربیل', 40, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (2, 'برده رش', 'برده رش', 'برده رش', 1, 'اربیل', 50, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (3, 'خبات', 'خبات', 'خبات', 1, 'اربیل', 55, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (4, 'کویسنجق', 'کویسنجق', 'کویسنجق', 1, 'اربیل', 60, true);

-- انبار Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (5, 'هیت', 'هیت', 'هیت', 2, 'انبار', 320, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (6, 'رمادی', 'رمادی', 'رمادی', 2, 'انبار', 350, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (7, 'الفلوجه', 'الفلوجه', 'الفلوجه', 2, 'انبار', 360, true);

-- بابل Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (8, 'المحمودیه', 'المحمودیه', 'المحمودیه', 3, 'بابل', 390, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (9, 'المحمودیه', 'المحمودیه', 'المحمودیه', 3, 'بابل', 390, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (10, 'الیوسفیه', 'الیوسفیه', 'الیوسفیه', 3, 'بابل', 398, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (11, 'حله', 'حله', 'حله', 3, 'بابل', 400, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (12, 'الاسکندریه', 'الاسکندریه', 'الاسکندریه', 3, 'بابل', 402, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (13, 'الطار', 'الطار', 'الطار', 3, 'بابل', 405, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (14, 'المسیب', 'المسیب', 'المسیب', 3, 'بابل', 410, true);

-- بصره Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (15, 'القرنه', 'القرنه', 'القرنه', 4, 'بصره', 540, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (16, 'بصره', 'بصره', 'بصره', 4, 'بصره', 550, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (17, 'ابو الخصیب', 'ابو الخصیب', 'ابو الخصیب', 4, 'بصره', 560, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (18, 'الشعیبه', 'الشعیبه', 'الشعیبه', 4, 'بصره', 560, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (19, 'الغدیر', 'الغدیر', 'الغدیر', 4, 'بصره', 565, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (20, 'القطیف', 'القطیف', 'القطیف', 4, 'بصره', 570, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (21, 'الزبیر', 'الزبیر', 'الزبیر', 4, 'بصره', 570, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (22, 'ام قصر', 'ام قصر', 'ام قصر', 4, 'بصره', 580, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (23, 'الفاو', 'الفاو', 'الفاو', 4, 'بصره', 600, true);

-- بغداد Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (24, 'کاظمین', 'کاظمین', 'کاظمین', 5, 'بغداد', 320, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (25, 'بغداد', 'بغداد', 'بغداد', 5, 'بغداد', 330, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (26, 'المنصور', 'المنصور', 'المنصور', 5, 'بغداد', 330, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (27, 'الجادریه', 'الجادریه', 'الجادریه', 5, 'بغداد', 331, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (28, 'الوادی', 'الوادی', 'الوادی', 5, 'بغداد', 332, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (29, 'الرصافه', 'الرصافه', 'الرصافه', 5, 'بغداد', 333, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (30, 'الصالحیه', 'الصالحیه', 'الصالحیه', 5, 'بغداد', 333, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (31, 'الامین', 'الامین', 'الامین', 5, 'بغداد', 334, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (32, 'الکرخ', 'الکرخ', 'الکرخ', 5, 'بغداد', 335, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (33, 'الثوره', 'الثوره', 'الثوره', 5, 'بغداد', 335, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (34, 'الشعلة', 'الشعلة', 'الشعلة', 5, 'بغداد', 336, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (35, '9 نیسان', '9 نیسان', '9 نیسان', 5, 'بغداد', 337, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (36, 'الوزیریه', 'الوزیریه', 'الوزیریه', 5, 'بغداد', 338, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (37, 'الاعظمیه', 'الاعظمیه', 'الاعظمیه', 5, 'بغداد', 339, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (38, 'الصدر', 'الصدر', 'الصدر', 5, 'بغداد', 340, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (39, 'الباب الشرقی', 'الباب الشرقی', 'الباب الشرقی', 5, 'بغداد', 340, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (40, 'الغزالیه', 'الغزالیه', 'الغزالیه', 5, 'بغداد', 341, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (41, 'الحارثیه', 'الحارثیه', 'الحارثیه', 5, 'بغداد', 341, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (42, 'العدل', 'العدل', 'العدل', 5, 'بغداد', 342, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (43, 'الجزائر', 'الجزائر', 'الجزائر', 5, 'بغداد', 342, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (44, 'الحریه', 'الحریه', 'الحریه', 5, 'بغداد', 343, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (45, 'الزوراء', 'الزوراء', 'الزوراء', 5, 'بغداد', 343, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (46, 'الدوره', 'الدوره', 'الدوره', 5, 'بغداد', 344, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (47, 'الیرموک', 'الیرموک', 'الیرموک', 5, 'بغداد', 344, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (48, 'العلویین', 'العلویین', 'العلویین', 5, 'بغداد', 344, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (49, 'الکسره', 'الکسره', 'الکسره', 5, 'بغداد', 345, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (50, 'الکندي', 'الکندي', 'الکندي', 5, 'بغداد', 345, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (51, 'الزعفرانیه', 'الزعفرانیه', 'الزعفرانیه', 5, 'بغداد', 346, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (52, 'المأمون', 'المأمون', 'المأمون', 5, 'بغداد', 346, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (53, 'التاجی', 'التاجی', 'التاجی', 5, 'بغداد', 347, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (54, 'المنذر', 'المنذر', 'المنذر', 5, 'بغداد', 347, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (55, 'المشاهد', 'المشاهد', 'المشاهد', 5, 'بغداد', 348, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (56, 'السلام', 'السلام', 'السلام', 5, 'بغداد', 348, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (57, 'الفضل', 'الفضل', 'الفضل', 5, 'بغداد', 349, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (58, 'الخلیج', 'الخلیج', 'الخلیج', 5, 'بغداد', 349, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (59, 'الشعب', 'الشعب', 'الشعب', 5, 'بغداد', 350, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (60, 'الرافدین', 'الرافدین', 'الرافدین', 5, 'بغداد', 350, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (61, 'النهروان', 'النهروان', 'النهروان', 5, 'بغداد', 351, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (62, 'الفرات', 'الفرات', 'الفرات', 5, 'بغداد', 351, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (63, 'الراشدیه', 'الراشدیه', 'الراشدیه', 5, 'بغداد', 352, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (64, 'دجله', 'دجله', 'دجله', 5, 'بغداد', 352, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (65, 'الشرطه', 'الشرطه', 'الشرطه', 5, 'بغداد', 353, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (66, 'العروبه', 'العروبه', 'العروبه', 5, 'بغداد', 353, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (67, 'الوحده', 'الوحده', 'الوحده', 5, 'بغداد', 354, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (68, 'ابوغریب', 'ابوغریب', 'ابوغریب', 5, 'بغداد', 355, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (69, 'النصر', 'النصر', 'النصر', 5, 'بغداد', 355, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (70, 'الاندلس', 'الاندلس', 'الاندلس', 5, 'بغداد', 356, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (71, 'المعامل', 'المعامل', 'المعامل', 5, 'بغداد', 357, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (72, 'الجامعه', 'الجامعه', 'الجامعه', 5, 'بغداد', 357, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (73, 'المتنبي', 'المتنبي', 'المتنبي', 5, 'بغداد', 358, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (74, 'العباس', 'العباس', 'العباس', 5, 'بغداد', 359, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (75, 'الطارمیه', 'الطارمیه', 'الطارمیه', 5, 'بغداد', 360, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (76, 'الامام', 'الامام', 'الامام', 5, 'بغداد', 360, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (77, 'الخلیل', 'الخلیل', 'الخلیل', 5, 'بغداد', 361, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (78, 'الرائد', 'الرائد', 'الرائد', 5, 'بغداد', 362, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (79, 'الزهراء', 'الزهراء', 'الزهراء', 5, 'بغداد', 363, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (80, 'الربيع', 'الربيع', 'الربيع', 5, 'بغداد', 364, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (81, 'الصحوه', 'الصحوه', 'الصحوه', 5, 'بغداد', 365, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (82, 'الازدهار', 'الازدهار', 'الازدهار', 5, 'بغداد', 366, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (83, 'الامل', 'الامل', 'الامل', 5, 'بغداد', 367, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (84, 'الخضراء', 'الخضراء', 'الخضراء', 5, 'بغداد', 368, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (85, 'الغابات', 'الغابات', 'الغابات', 5, 'بغداد', 369, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (86, 'الرساله', 'الرساله', 'الرساله', 5, 'بغداد', 370, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (87, 'النهضه', 'النهضه', 'النهضه', 5, 'بغداد', 371, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (88, 'الوحده', 'الوحده', 'الوحده', 5, 'بغداد', 372, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (89, 'العداله', 'العداله', 'العداله', 5, 'بغداد', 373, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (90, 'الحرية', 'الحرية', 'الحرية', 5, 'بغداد', 374, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (91, 'الكرامه', 'الكرامه', 'الكرامه', 5, 'بغداد', 375, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (92, 'الاصالة', 'الاصالة', 'الاصالة', 5, 'بغداد', 376, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (93, 'التراث', 'التراث', 'التراث', 5, 'بغداد', 377, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (94, 'الاصمعي', 'الاصمعي', 'الاصمعي', 5, 'بغداد', 378, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (95, 'البحتري', 'البحتري', 'البحتري', 5, 'بغداد', 379, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (96, 'المتنبي', 'المتنبي', 'المتنبي', 5, 'بغداد', 380, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (97, 'الجاحظ', 'الجاحظ', 'الجاحظ', 5, 'بغداد', 381, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (98, 'الفراهيدي', 'الفراهيدي', 'الفراهيدي', 5, 'بغداد', 382, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (99, 'الخوارزمي', 'الخوارزمي', 'الخوارزمي', 5, 'بغداد', 383, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (100, 'الرازي', 'الرازي', 'الرازي', 5, 'بغداد', 384, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (101, 'ابن سینا', 'ابن سینا', 'ابن سینا', 5, 'بغداد', 385, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (102, 'الکندی', 'الکندی', 'الکندی', 5, 'بغداد', 386, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (103, 'الفارابی', 'الفارابی', 'الفارابی', 5, 'بغداد', 387, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (104, 'ابن هیثم', 'ابن هیثم', 'ابن هیثم', 5, 'بغداد', 388, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (105, 'البتانی', 'البتانی', 'البتانی', 5, 'بغداد', 389, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (106, 'البیرونی', 'البیرونی', 'البیرونی', 5, 'بغداد', 390, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (107, 'الطوسی', 'الطوسی', 'الطوسی', 5, 'بغداد', 391, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (108, 'الغزالی', 'الغزالی', 'الغزالی', 5, 'بغداد', 392, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (109, 'ابن رشد', 'ابن رشد', 'ابن رشد', 5, 'بغداد', 393, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (110, 'المقدسی', 'المقدسی', 'المقدسی', 5, 'بغداد', 394, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (111, 'الادریسی', 'الادریسی', 'الادریسی', 5, 'بغداد', 395, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (112, 'ابن بطوطه', 'ابن بطوطه', 'ابن بطوطه', 5, 'بغداد', 396, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (113, 'المقریزی', 'المقریزی', 'المقریزی', 5, 'بغداد', 397, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (114, 'التوحیدی', 'التوحیدی', 'التوحیدی', 5, 'بغداد', 398, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (115, 'الجاحظ', 'الجاحظ', 'الجاحظ', 5, 'بغداد', 399, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (116, 'ابن خلدون', 'ابن خلدون', 'ابن خلدون', 5, 'بغداد', 400, true);

-- دهوک Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (117, 'دهوک', 'دهوک', 'دهوک', 6, 'دهوک', 70, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (118, 'شیخان', 'شیخان', 'شیخان', 6, 'دهوک', 80, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (119, 'باطوفا', 'باطوفا', 'باطوفا', 6, 'دهوک', 85, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (120, 'سرسنک', 'سرسنک', 'سرسنک', 6, 'دهوک', 95, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (121, 'زاخو', 'زاخو', 'زاخو', 6, 'دهوک', 100, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (122, 'پیران', 'پیران', 'پیران', 6, 'دهوک', 105, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (123, 'عمادیه', 'عمادیه', 'عمادیه', 6, 'دهوک', 110, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (124, 'زراری', 'زراری', 'زراری', 6, 'دهوک', 112, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (125, 'آتروش', 'آتروش', 'آتروش', 6, 'دهوک', 118, true);

-- دیاله Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (126, 'مندلی', 'مندلی', 'مندلی', 7, 'دیاله', 210, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (127, 'خانقین', 'خانقین', 'خانقین', 7, 'دیاله', 220, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (128, 'جلولا', 'جلولا', 'جلولا', 7, 'دیاله', 220, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (129, 'کفری', 'کفری', 'کفری', 7, 'دیاله', 230, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (130, 'بعقوبه', 'بعقوبه', 'بعقوبه', 7, 'دیاله', 240, true);

-- ذیقار Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (131, 'الشطره', 'الشطره', 'الشطره', 8, 'ذیقار', 480, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (132, 'الجبایش', 'الجبایش', 'الجبایش', 8, 'ذیقار', 490, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (133, 'الچبایش', 'الچبایش', 'الچبایش', 8, 'ذیقار', 490, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (134, 'البرجسیه', 'البرجسیه', 'البرجسیه', 8, 'ذیقار', 495, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (135, 'ناصریه', 'ناصریه', 'ناصریه', 8, 'ذیقار', 500, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (136, 'الرفاعی', 'الرفاعی', 'الرفاعی', 8, 'ذیقار', 500, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (137, 'سوق الشیخ', 'سوق الشیخ', 'سوق الشیخ', 8, 'ذیقار', 510, true);

-- سلیمانیه Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (138, 'سلیمانیه', 'سلیمانیه', 'سلیمانیه', 9, 'سلیمانیه', 140, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (139, 'چمچمال', 'چمچمال', 'چمچمال', 9, 'سلیمانیه', 145, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (140, 'قرهداغ', 'قرهداغ', 'قرهداغ', 9, 'سلیمانیه', 155, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (141, 'حلبچه', 'حلبچه', 'حلبچه', 9, 'سلیمانیه', 160, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (142, 'شرباز', 'شرباز', 'شرباز', 9, 'سلیمانیه', 165, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (143, 'پنجوین', 'پنجوین', 'پنجوین', 9, 'سلیمانیه', 170, true);

-- صلاح‌الدین Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (144, 'طوزخورماتو', 'طوزخورماتو', 'طوزخورماتو', 10, 'صلاح‌الدین', 200, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (145, 'بلد', 'بلد', 'بلد', 10, 'صلاح‌الدین', 240, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (146, 'تکریت', 'تکریت', 'تکریت', 10, 'صلاح‌الدین', 250, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (147, 'الاسحاقی', 'الاسحاقی', 'الاسحاقی', 10, 'صلاح‌الدین', 260, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (148, 'الدور', 'الدور', 'الدور', 10, 'صلاح‌الدین', 270, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (149, 'سامرا', 'سامرا', 'سامرا', 10, 'صلاح‌الدین', 280, true);

-- قادسیه Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (150, 'دیوانیه', 'دیوانیه', 'دیوانیه', 11, 'قادسیه', 450, true);

-- مثنی Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (151, 'الرمیل', 'الرمیل', 'الرمیل', 12, 'مثنی', 545, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (152, 'سماوه', 'سماوه', 'سماوه', 12, 'مثنی', 550, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (153, 'الورکاء', 'الورکاء', 'الورکاء', 12, 'مثنی', 555, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (154, 'الخضر', 'الخضر', 'الخضر', 12, 'مثنی', 560, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (155, 'السلمان', 'السلمان', 'السلمان', 12, 'مثنی', 570, true);

-- میسان Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (156, 'عماره', 'عماره', 'عماره', 13, 'میسان', 520, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (157, 'المجر', 'المجر', 'المجر', 13, 'میسان', 530, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (158, 'الکحلاء', 'الکحلاء', 'الکحلاء', 13, 'میسان', 535, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (159, 'المیمونه', 'المیمونه', 'المیمونه', 13, 'میسان', 535, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (160, 'قلعه صالح', 'قلعه صالح', 'قلعه صالح', 13, 'میسان', 540, true);

-- نجف Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (161, 'الکوفه', 'الکوفه', 'الکوفه', 14, 'نجف', 448, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (162, 'نجف', 'نجف', 'نجف', 14, 'نجف', 450, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (163, 'الحیره', 'الحیره', 'الحیره', 14, 'نجف', 450, true);

-- نینوا Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (164, 'باعجره', 'باعجره', 'باعجره', 15, 'نینوا', 70, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (165, 'موصل', 'موصل', 'موصل', 15, 'نینوا', 80, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (166, 'الموصل الجدید', 'الموصل الجدید', 'الموصل الجدید', 15, 'نینوا', 85, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (167, 'الکرامه', 'الکرامه', 'الکرامه', 15, 'نینوا', 94, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (168, 'الحمدانیه', 'الحمدانیه', 'الحمدانیه', 15, 'نینوا', 95, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (169, 'القوش', 'القوش', 'القوش', 15, 'نینوا', 100, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (170, 'تلسقف', 'تلسقف', 'تلسقف', 15, 'نینوا', 110, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (171, 'تلعفر', 'تلعفر', 'تلعفر', 15, 'نینوا', 120, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (172, 'القيارة', 'القيارة', 'القيارة', 15, 'نینوا', 130, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (173, 'الحضر', 'الحضر', 'الحضر', 15, 'نینوا', 140, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (174, 'سنجار', 'سنجار', 'سنجار', 15, 'نینوا', 150, true);

-- واسط Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (175, 'النعمانیه', 'النعمانیه', 'النعمانیه', 16, 'واسط', 370, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (176, 'الهاشمیه', 'الهاشمیه', 'الهاشمیه', 16, 'واسط', 375, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (177, 'کوت', 'کوت', 'کوت', 16, 'واسط', 380, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (178, 'الصویره', 'الصویره', 'الصویره', 16, 'واسط', 385, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (179, 'الحی', 'الحی', 'الحی', 16, 'واسط', 390, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (180, 'العزیزیه', 'العزیزیه', 'العزیزیه', 16, 'واسط', 390, true);

-- کربلا Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (181, 'کربلا', 'کربلا', 'کربلا', 17, 'کربلا', 420, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (182, 'الهندیه', 'الهندیه', 'الهندیه', 17, 'کربلا', 430, true);

-- کرکوک Province
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (183, 'کرکوک', 'کرکوک', 'کرکوک', 18, 'کرکوک', 150, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (184, 'الرشیدیه', 'الرشیدیه', 'الرشیدیه', 18, 'کرکوک', 155, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (185, 'الزبیر', 'الزبیر', 'الزبیر', 18, 'کرکوک', 160, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (186, 'یایچی', 'یایچی', 'یایچی', 18, 'کرکوک', 170, true);
INSERT INTO iraqi_cities (id, name, name_arabic, name_english, province_id, province_name, distance_from_erbil_km, is_active) VALUES (187, 'داقوق', 'داقوق', 'داقوق', 18, 'کرکوک', 180, true);

-- Update table sequences
SELECT setval('iraqi_provinces_id_seq', 18);
SELECT setval('iraqi_cities_id_seq', 187);
