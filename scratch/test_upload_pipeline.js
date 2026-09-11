const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Helper to create a minimal ZIP file in memory
function createZipBuffer(entries) {
  // Simple ZIP local file header and central directory generator
  const fileRecords = [];
  let offset = 0;

  const localHeaders = [];
  for (const entry of entries) {
    const nameBuffer = Buffer.from(entry.name, 'utf8');
    const contentBuffer = Buffer.isBuffer(entry.content) ? entry.content : Buffer.from(entry.content || '', 'utf8');
    
    // CRC-32 calculation (simplified or 0 for uncompressed STORE)
    const localHeader = Buffer.alloc(30 + nameBuffer.length);
    localHeader.writeUInt32LE(0x04034b50, 0); // local file header signature
    localHeader.writeUInt16LE(20, 4); // version needed
    localHeader.writeUInt16LE(0, 6); // flags
    localHeader.writeUInt16LE(0, 8); // compression method (0 = store)
    localHeader.writeUInt16LE(0, 10); // time
    localHeader.writeUInt16LE(0, 12); // date
    localHeader.writeUInt32LE(0, 14); // crc32
    localHeader.writeUInt32LE(contentBuffer.length, 18); // compressed size
    localHeader.writeUInt32LE(contentBuffer.length, 22); // uncompressed size
    localHeader.writeUInt16LE(nameBuffer.length, 26); // file name length
    localHeader.writeUInt16LE(0, 28); // extra field length
    nameBuffer.copy(localHeader, 30);

    fileRecords.push({
      nameBuffer,
      contentBuffer,
      offset,
      size: contentBuffer.length
    });

    offset += localHeader.length + contentBuffer.length;
    localHeaders.push(localHeader, contentBuffer);
  }

  const centralHeaders = [];
  let centralDirSize = 0;
  for (const record of fileRecords) {
    const centralHeader = Buffer.alloc(46 + record.nameBuffer.length);
    centralHeader.writeUInt32LE(0x02014b50, 0); // central file header signature
    centralHeader.writeUInt16LE(20, 4); // version made by
    centralHeader.writeUInt16LE(20, 6); // version needed
    centralHeader.writeUInt16LE(0, 8); // flags
    centralHeader.writeUInt16LE(0, 10); // method (0 = store)
    centralHeader.writeUInt16LE(0, 12); // time
    centralHeader.writeUInt16LE(0, 14); // date
    centralHeader.writeUInt32LE(0, 16); // crc32
    centralHeader.writeUInt32LE(record.size, 20); // compressed
    centralHeader.writeUInt32LE(record.size, 24); // uncompressed
    centralHeader.writeUInt16LE(record.nameBuffer.length, 28); // name len
    centralHeader.writeUInt16LE(0, 30); // extra len
    centralHeader.writeUInt16LE(0, 32); // comment len
    centralHeader.writeUInt16LE(0, 34); // disk num
    centralHeader.writeUInt16LE(0, 36); // internal attr
    centralHeader.writeUInt32LE(0, 38); // external attr
    centralHeader.writeUInt32LE(record.offset, 42); // local header offset
    record.nameBuffer.copy(centralHeader, 46);

    centralHeaders.push(centralHeader);
    centralDirSize += centralHeader.length;
  }

  // End of Central Directory
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
  eocd.writeUInt16LE(0, 4); // disk num
  eocd.writeUInt16LE(0, 6); // start disk
  eocd.writeUInt16LE(entries.length, 8); // entries on disk
  eocd.writeUInt16LE(entries.length, 10); // total entries
  eocd.writeUInt32LE(centralDirSize, 12); // central dir size
  eocd.writeUInt32LE(offset, 16); // central dir offset
  eocd.writeUInt16LE(0, 20); // comment len

  return Buffer.concat([...localHeaders, ...centralHeaders, eocd]);
}

async function runTests() {
  console.log('--- Phase 2: Geospatial File Upload Pipeline Test ---');

  // Step 1: Login to acquire JWT token
  const authRes = await fetch('http://localhost:8080/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'testuser@geovision.local', password: 'TestPassword123' })
  });
  const auth = await authRes.json();
  const token = auth.token;
  console.log('1. Authenticated as testuser@geovision.local');

  async function uploadFile(filename, buffer, mimeType) {
    const formData = new FormData();
    const blob = new Blob([buffer], { type: mimeType });
    formData.append('file', blob, filename);

    const res = await fetch('http://localhost:8080/api/v1/imagery/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Origin': 'http://localhost:3000'
      },
      body: formData
    });

    const data = await res.json();
    return { status: res.status, data };
  }

  // Test A: Disallowed extension (.png)
  console.log('\n[Test A] Disallowed format (.png)...');
  const pngHeader = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const resA = await uploadFile('test_image.png', pngHeader, 'image/png');
  console.log(`Status: ${resA.status}, Message: ${resA.data.message}`);

  // Test B: Valid TIFF (.tif with little-endian magic bytes II*\0)
  console.log('\n[Test B] Valid TIFF raster (.tif)...');
  const tiffBuffer = Buffer.alloc(256);
  tiffBuffer[0] = 0x49; // I
  tiffBuffer[1] = 0x49; // I
  tiffBuffer[2] = 0x2A; // *
  tiffBuffer[3] = 0x00; // \0
  tiffBuffer.write('Sentinel-2 Band 04 Red 10m GeoTIFF sample payload', 4);
  const resB = await uploadFile('sentinel2_b04.tif', tiffBuffer, 'image/tiff');
  console.log(`Status: ${resB.status}, ID: ${resB.data.id}, Path: ${resB.data.originalFilePath}`);

  // Test C: Valid JPEG 2000 (.jp2 with JP2 Box signature)
  console.log('\n[Test C] Valid JPEG 2000 raster (.jp2)...');
  const jp2Buffer = Buffer.alloc(256);
  // Signature box: 00 00 00 0C 6A 50 20 20 0D 0A 87 0A
  const jp2Sig = [0x00, 0x00, 0x00, 0x0C, 0x6A, 0x50, 0x20, 0x20, 0x0D, 0x0A, 0x87, 0x0A];
  for (let i = 0; i < jp2Sig.length; i++) jp2Buffer[i] = jp2Sig[i];
  jp2Buffer.write('Sentinel-2 JP2 Tile sample payload', 12);
  const resC = await uploadFile('sentinel2_tile.jp2', jp2Buffer, 'image/jp2');
  console.log(`Status: ${resC.status}, ID: ${resC.data.id}, Path: ${resC.data.originalFilePath}`);

  // Test D: Valid ZIP package containing .tif
  console.log('\n[Test D] Valid ZIP containing .tif...');
  const zipBufferD = createZipBuffer([
    { name: 'imagery_tile_red.tif', content: tiffBuffer }
  ]);
  const resD = await uploadFile('dataset_bundle.zip', zipBufferD, 'application/zip');
  console.log(`Status: ${resD.status}, ID: ${resD.data.id}, Path: ${resD.data.originalFilePath}`);

  // Test E: Malicious ZIP with Zip Slip (../../slip.tif)
  console.log('\n[Test E] Security Check: Zip Slip attack (../../slip.tif)...');
  const zipBufferE = createZipBuffer([
    { name: '../../slip.tif', content: tiffBuffer }
  ]);
  const resE = await uploadFile('zip_slip_attack.zip', zipBufferE, 'application/zip');
  console.log(`Status: ${resE.status}, Message: ${resE.data.message}`);

  // Test F: Malicious ZIP with executable (malware.exe)
  console.log('\n[Test F] Security Check: Executable in archive (malware.exe)...');
  const zipBufferF = createZipBuffer([
    { name: 'payload.tif', content: tiffBuffer },
    { name: 'malware.exe', content: 'MZ executable binary payload' }
  ]);
  const resF = await uploadFile('malicious_archive.zip', zipBufferF, 'application/zip');
  console.log(`Status: ${resF.status}, Message: ${resF.data.message}`);

  // Test G: ZIP without geospatial raster files
  console.log('\n[Test G] ZIP without geospatial raster files...');
  const zipBufferG = createZipBuffer([
    { name: 'readme.txt', content: 'just a text file' }
  ]);
  const resG = await uploadFile('no_geospatial.zip', zipBufferG, 'application/zip');
  console.log(`Status: ${resG.status}, Message: ${resG.data.message}`);

  console.log('\n--- All Automated Security & Validation Checks Completed ---');
}

runTests().catch(err => console.error('Test execution error:', err));
