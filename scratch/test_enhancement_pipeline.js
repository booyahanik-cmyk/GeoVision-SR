const fs = require('fs');
const path = require('path');

// Helper to create a valid uncompressed grayscale TIFF image buffer
function createSampleTiff(width, height) {
  // Minimal valid TIFF baseline grayscale (8-bit)
  const numPixels = width * height;
  const headerSize = 8;
  const numEntries = 11;
  const ifdSize = 2 + numEntries * 12 + 4;
  const pixelOffset = headerSize + ifdSize;
  const fileSize = pixelOffset + numPixels;

  const buf = Buffer.alloc(fileSize);

  // Header (Little-Endian)
  buf.write('II', 0); // Intel byte order
  buf.writeUInt16LE(42, 2); // TIFF identifier
  buf.writeUInt32LE(headerSize, 4); // offset to first IFD

  let p = headerSize;
  buf.writeUInt16LE(numEntries, p); p += 2;

  function writeTag(tag, type, count, value) {
    buf.writeUInt16LE(tag, p);
    buf.writeUInt16LE(type, p + 2);
    buf.writeUInt32LE(count, p + 4);
    buf.writeUInt32LE(value, p + 8);
    p += 12;
  }

  // Tags:
  writeTag(256, 4, 1, width); // ImageWidth
  writeTag(257, 4, 1, height); // ImageLength
  writeTag(258, 3, 1, 8); // BitsPerSample = 8
  writeTag(259, 3, 1, 1); // Compression = 1 (None)
  writeTag(262, 3, 1, 1); // PhotometricInterpretation = 1 (BlackIsZero)
  writeTag(273, 4, 1, pixelOffset); // StripOffsets
  writeTag(277, 3, 1, 1); // SamplesPerPixel = 1
  writeTag(278, 4, 1, height); // RowsPerStrip = height
  writeTag(279, 4, 1, numPixels); // StripByteCounts
  writeTag(282, 5, 1, 0); // XResolution (dummy)
  writeTag(283, 5, 1, 0); // YResolution (dummy)

  buf.writeUInt32LE(0, p); // Next IFD offset = 0

  // Pixel data with gradient
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const val = Math.floor(((x + y) / (width + height)) * 255);
      buf.writeUInt8(val, pixelOffset + y * width + x);
    }
  }

  return buf;
}

async function runEnhancementTest() {
  console.log('=== Phase 4: Image Enhancement Pipeline End-to-End Test ===');

  try {
    // 1. Authenticate
    const authRes = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'testuser@geovision.local', password: 'TestPassword123' })
    });
    
    if (!authRes.ok) {
      console.log('Could not authenticate directly, registering or status:', authRes.status);
      return;
    }
    const auth = await authRes.json();
    const token = auth.token;
    console.log('1. Authenticated successfully. Token acquired.');

    // 2. Upload a sample TIFF
    const tiffBuf = createSampleTiff(256, 256);
    const formData = new FormData();
    const blob = new Blob([tiffBuf], { type: 'image/tiff' });
    formData.append('file', blob, 'sample_enhancement_test.tif');

    const uploadRes = await fetch('http://localhost:8080/api/v1/imagery/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const uploadJson = await uploadRes.json();
    console.log('2. Ingested raw TIFF:', uploadJson);
    const imageryId = uploadJson.id;

    // 3. Trigger Enhancement
    console.log(`3. Triggering POST /api/v1/imagery/${imageryId}/enhance ...`);
    const enhanceRes = await fetch(`http://localhost:8080/api/v1/imagery/${imageryId}/enhance`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Enhance HTTP status:', enhanceRes.status);
    const enhanceJson = await enhanceRes.json();
    console.log('4. Enhancement Response:', JSON.stringify(enhanceJson, null, 2));

    if (enhanceJson.status === 'PROCESSED') {
      console.log('SUCCESS: Imagery enhanced!');
      console.log('Enhanced file path:', enhanceJson.enhancedFilePath);
      console.log('Enhancement metadata:', enhanceJson.enhancementMetadata);
    }
  } catch (err) {
    console.error('Test error:', err.message);
  }
}

runEnhancementTest();
