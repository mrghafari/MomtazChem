// Vazirmatn font base64 for Persian/Arabic text support in PDFs
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the font files and convert to base64
let vazirRegularBase64: string;
let vazirBoldBase64: string;

try {
  // Try to load the newest Vazir font files first
  const regularPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Regular_1753244629836.ttf');
  const boldPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Bold_1753244629836.ttf');
  
  const regularBuffer = readFileSync(regularPath);
  const boldBuffer = readFileSync(boldPath);
  
  vazirRegularBase64 = regularBuffer.toString('base64');
  vazirBoldBase64 = boldBuffer.toString('base64');
  
  console.log('✅ Successfully loaded newest Vazir font files (1753244629836)');
} catch (error) {
  console.warn('Could not load newest Vazirmatn fonts, trying previous versions...');
  try {
    // Try previous font files
    const regularPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Regular_1753106425626.ttf');
    const boldPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Bold_1753106425625.ttf');
    
    const regularBuffer = readFileSync(regularPath);
    const boldBuffer = readFileSync(boldPath);
    
    vazirRegularBase64 = regularBuffer.toString('base64');
    vazirBoldBase64 = boldBuffer.toString('base64');
    
    console.log('✅ Successfully loaded previous Vazir font files (1753106425626)');
  } catch (fallbackError) {
    console.warn('Could not load previous fonts, trying oldest versions...');
    try {
      // Try oldest font files
      const regularPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Regular_1752905860928.ttf');
      const boldPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Bold_1752905860930.ttf');
      
      const regularBuffer = readFileSync(regularPath);
      const boldBuffer = readFileSync(boldPath);
      
      vazirRegularBase64 = regularBuffer.toString('base64');
      vazirBoldBase64 = boldBuffer.toString('base64');
      
      console.log('✅ Successfully loaded oldest Vazir font files (1752905860928)');
    } catch (finalError) {
      console.warn('Could not load any Vazirmatn font files, using embedded fallback');
      // Minimal valid font fallback
      vazirRegularBase64 = "AAEAAAAPAIAAAwBwR0RFRqgcpLkAAW0IAAABqkdQT1PTVhWrAAFutAAAVHpHU1VCmJPDqAABwzAAABxOT1MvMmgKWMcAAAF4AAAAYGNtYXCmzm0LAAAWrAAAB/ZnYXNwAAAAEAABbQAAAAAIZ2x5ZvTNykYAACkYAAEJTGhlYWQXFi5rAAAA/AAAADZoaGVhD78JAwAAATQAAAAkaG10eDXuc0UAAAHYAAAU1GxvY2FQTpBDAAAerAAACmxtYXhwBVcA8wAAAVgAAAAgbmFtZaBBvNEAATJkAAAGbnBvc3SxJab2AAE41AAANCpwcmVwaAaMhQAAHqQAAAAH";
      vazirBoldBase64 = vazirRegularBase64; // Use same font for bold as fallback
    }
  }
}

// Export both fonts
export const vazirRegular = vazirRegularBase64;
export const vazirBold = vazirBoldBase64;

// Export default as regular for backward compatibility
export default vazirRegularBase64;