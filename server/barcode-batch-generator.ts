// Batch Barcode Generator for Existing Products
import { generateEAN13Barcode } from "@shared/barcode-utils";
import { storage } from "./storage";
import { showcaseStorage } from "./showcase-storage";

export async function generateBarcodesForExistingProducts() {
  try {
    console.log('Starting batch barcode generation for existing products...');
    
    // Get all showcase products without barcodes
    const allProducts = await showcaseStorage.getAllShowcaseProducts();
    const productsWithoutBarcodes = allProducts.filter(p => !p.barcode || p.barcode.trim() === '');
    
    console.log(`Found ${productsWithoutBarcodes.length} products without barcodes out of ${allProducts.length} total`);
    
    const results = [];
    
    for (const product of productsWithoutBarcodes) {
      try {
        // Generate barcode
        const generatedBarcode = generateEAN13Barcode(product.name, product.category);
        
        // Update product with barcode
        await showcaseStorage.updateShowcaseProduct(product.id, {
          barcode: generatedBarcode
        });
        
        results.push({
          id: product.id,
          name: product.name,
          category: product.category,
          barcode: generatedBarcode,
          success: true
        });
        
        console.log(`✓ Generated barcode ${generatedBarcode} for product: ${product.name}`);
        
      } catch (error) {
        console.error(`✗ Failed to generate barcode for product ${product.name}:`, error);
        results.push({
          id: product.id,
          name: product.name,
          category: product.category,
          barcode: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`Batch generation complete. Success: ${results.filter(r => r.success).length}/${results.length}`);
    return results;
    
  } catch (error) {
    console.error('Batch barcode generation failed:', error);
    throw error;
  }
}

// Function to regenerate all barcodes (use with caution)
export async function regenerateAllBarcodes() {
  try {
    console.log('Starting regeneration of ALL product barcodes...');
    
    const products = await showcaseStorage.getAllShowcaseProducts();
    console.log(`Found ${products.length} products for barcode regeneration`);
    
    const results = [];
    
    for (const product of products) {
      try {
        // Generate new barcode
        const generatedBarcode = generateEAN13Barcode(product.name, product.category);
        
        // Update product with new barcode
        await showcaseStorage.updateShowcaseProduct(product.id, {
          barcode: generatedBarcode
        });
        
        results.push({
          id: product.id,
          name: product.name,
          category: product.category,
          oldBarcode: product.barcode,
          newBarcode: generatedBarcode,
          success: true
        });
        
        console.log(`✓ Updated barcode for ${product.name}: ${product.barcode} → ${generatedBarcode}`);
        
      } catch (error) {
        console.error(`✗ Failed to regenerate barcode for product ${product.name}:`, error);
        results.push({
          id: product.id,
          name: product.name,
          category: product.category,
          oldBarcode: product.barcode,
          newBarcode: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`Regeneration complete. Success: ${results.filter(r => r.success).length}/${results.length}`);
    return results;
    
  } catch (error) {
    console.error('Barcode regeneration failed:', error);
    throw error;
  }
}