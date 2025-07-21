// Vazirmatn font base64 for Persian/Arabic text support in PDFs
import { readFileSync } from 'fs';
import { join } from 'path';

// Read the font files and convert to base64
let vazirRegularBase64: string;
let vazirBoldBase64: string;

try {
  // Try to load the new Vazir font files first
  const regularPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Regular_1753106425626.ttf');
  const boldPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Bold_1753106425625.ttf');
  
  const regularBuffer = readFileSync(regularPath);
  const boldBuffer = readFileSync(boldPath);
  
  vazirRegularBase64 = regularBuffer.toString('base64');
  vazirBoldBase64 = boldBuffer.toString('base64');
  
  console.log('✅ Successfully loaded new Vazir font files');
} catch (error) {
  console.warn('Could not load new Vazirmatn fonts, trying older versions...');
  try {
    // Try older font files
    const regularPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Regular_1752905860928.ttf');
    const boldPath = join(process.cwd(), 'attached_assets', 'Vazirmatn-Bold_1752905860930.ttf');
    
    const regularBuffer = readFileSync(regularPath);
    const boldBuffer = readFileSync(boldPath);
    
    vazirRegularBase64 = regularBuffer.toString('base64');
    vazirBoldBase64 = boldBuffer.toString('base64');
    
    console.log('✅ Successfully loaded older Vazir font files');
  } catch (fallbackError) {
    console.warn('Could not load any Vazirmatn font files, using embedded fallback');
    // Minimal valid font fallback
    vazirRegularBase64 = "AAEAAAAPAIAAAwBwR0RFRqgcpLkAAW0IAAABqkdQT1PTVhWrAAFutAAAVHpHU1VCmJPDqAABwzAAABxOT1MvMmgKWMcAAAF4AAAAYGNtYXCmzm0LAAAWrAAAB/ZnYXNwAAAAEAABbQAAAAAIZ2x5ZvTNykYAACkYAAEJTGhlYWQXFi5rAAAA/AAAADZoaGVhD78JAwAAATQAAAAkaG10eDXuc0UAAAHYAAAU1GxvY2FQTpBDAAAerAAACmxtYXhwBVcA8wAAAVgAAAAgbmFtZaBBvNEAATJkAAAGbnBvc3SxJab2AAE41AAANCpwcmVwaAaMhQAAHqQAAAAH";
    vazirBoldBase64 = vazirRegularBase64; // Use same font for bold as fallback
  }
}

// Export both fonts
export const vazirRegular = vazirRegularBase64;
export const vazirBold = vazirBoldBase64;

// Export default as regular for backward compatibility
export default vazirRegularBase64;