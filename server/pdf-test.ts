// Test simple PDF generation
export function createTestPDF(): Buffer {
  // Very basic PDF structure
  const pdfHeader = '%PDF-1.4\n';
  
  // Object 1: Catalog
  const catalog = `1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
`;

  // Object 2: Pages
  const pages = `2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
`;

  // Object 3: Page
  const page = `3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Resources <<
  /Font <<
    /F1 4 0 R
  >>
>>
/Contents 5 0 R
>>
endobj
`;

  // Object 4: Font
  const font = `4 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
`;

  // Object 5: Content
  const content = `BT
/F1 12 Tf
50 750 Td
(Customer Report) Tj
0 -20 Td
(Generated: ${new Date().toLocaleDateString('en-US')}) Tj
0 -20 Td
(Test content here) Tj
ET`;

  const contentObj = `5 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj
`;

  // Build PDF
  let pdf = pdfHeader;
  const objects = [catalog, pages, page, font, contentObj];
  const offsets: number[] = [];
  
  for (const obj of objects) {
    offsets.push(pdf.length);
    pdf += obj;
  }

  // Cross-reference table
  const xrefPos = pdf.length;
  pdf += 'xref\n';
  pdf += `0 ${objects.length + 1}\n`;
  pdf += '0000000000 65535 f \n';
  
  for (const offset of offsets) {
    pdf += offset.toString().padStart(10, '0') + ' 00000 n \n';
  }

  // Trailer
  pdf += 'trailer\n';
  pdf += `<<\n/Size ${objects.length + 1}\n/Root 1 0 R\n>>\n`;
  pdf += `startxref\n${xrefPos}\n%%EOF`;

  return Buffer.from(pdf, 'binary');
}