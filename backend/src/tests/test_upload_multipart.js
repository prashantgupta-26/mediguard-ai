const http = require('http');
const fs = require('fs');
const path = require('path');

const sampleFile = path.resolve(__dirname, '../../uploads/MK-921E36/1788753614661-6d015612.jpg');
const fileBuffer = fs.readFileSync(sampleFile);
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';

const headerPart = Buffer.from(
  '--' + boundary + '\r\n' +
  'Content-Disposition: form-data; name="files"; filename="Outpatient_Prescription.jpg"\r\n' +
  'Content-Type: image/jpeg\r\n\r\n'
);
const footerPart = Buffer.from('\r\n--' + boundary + '--\r\n');

const body = Buffer.concat([headerPart, fileBuffer, footerPart]);

const req = http.request({
  hostname: '127.0.0.1',
  port: 5000,
  path: '/api/patient/records/upload',
  method: 'POST',
  headers: {
    'Content-Type': 'multipart/form-data; boundary=' + boundary,
    'Content-Length': body.length,
    'Authorization': 'Bearer test-token'
  }
}, (res) => {
  let chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    console.log('Upload Status:', res.statusCode);
    const json = JSON.parse(Buffer.concat(chunks).toString('utf-8'));
    console.log('Upload Result:', json.success, json.message);
    const doc = json.documents[0];
    console.log('New Doc ID:', doc.id);
    console.log('Detected Type:', doc.documentType);
    console.log('Confidence:', doc.extractionConfidence);
    console.log('Medicines Extracted:', doc.aiExtractedData?.prescription?.medicines?.length || 0);
    console.log('Medicines List:\n', JSON.stringify(doc.aiExtractedData?.prescription?.medicines, null, 2));
  });
});

req.write(body);
req.end();
