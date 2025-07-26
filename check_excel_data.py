#!/usr/bin/env python3
import pandas as pd
import sys

def check_excel_data():
    try:
        # Read the Excel file
        df = pd.read_excel('attached_assets/Book1_1753529079559.xlsx')
        
        print("=== Excel File Structure ===")
        print(f"Total rows: {len(df)}")
        print(f"Columns: {list(df.columns)}")
        
        print("\n=== Sample Data (first 10 rows) ===")
        print(df.head(10).to_string())
        
        print("\n=== Search for Penjwin/پنجوین ===")
        # Search for Penjwin variations
        penjwin_results = df[
            df.apply(lambda x: x.astype(str).str.contains('پنجوین|Penjwin|Penjween', case=False, na=False)).any(axis=1)
        ]
        
        if not penjwin_results.empty:
            print("Found Penjwin entries:")
            print(penjwin_results.to_string())
        else:
            print("No Penjwin entries found in Excel file")
            
        print("\n=== Cities in Sulaymaniyah Province ===")
        # Check for Sulaymaniyah province cities
        sulaymaniyah_cities = df[
            df.apply(lambda x: x.astype(str).str.contains('سلیمانیه|Sulaymaniyah', case=False, na=False)).any(axis=1)
        ]
        print("Cities in Sulaymaniyah:")
        print(sulaymaniyah_cities[['شهر/ منطقه', 'استان', 'فاصله از اربیل(کیلومتر)']].to_string())
        
        return True
        
    except Exception as e:
        print(f"Error reading Excel file: {e}")
        return False

if __name__ == "__main__":
    check_excel_data()