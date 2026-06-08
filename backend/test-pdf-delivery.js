const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: 'da5mujqqo',
  api_key: '866397911878491',
  api_secret: 'ZJnhx39emMU14AcEfkDKfCGmNVs'
});

async function test() {
  console.log('=== Test 1: Cloudinary API download endpoint ===');
  
  // Try to get a downloadable URL via the API
  const timestamp = Math.round(Date.now() / 1000);
  const public_id = 'spmb/brosur/k7nmnba49ewsj9apdzdi';
  
  // Sign the request
  const params = { public_id, timestamp };
  const signature = cloudinary.utils.api_sign_request(params, 'ZJnhx39emMU14AcEfkDKfCGmNVs');
  
  const url = 'https://api.cloudinary.com/v1_1/da5mujqqo/image/download';
  const body = new URLSearchParams({
    public_id,
    timestamp: timestamp.toString(),
    signature,
    api_key: '866397911878491'
  });
  
  console.log('POST URL:', url);
  const resp = await fetch(url, { method: 'POST', body, redirect: 'manual' });
  console.log('Status:', resp.status);
  console.log('Content-Type:', resp.headers.get('content-type'));
  console.log('Location:', resp.headers.get('location'));
  
  if (resp.status === 200) {
    const buf = await resp.arrayBuffer();
    console.log('Body size:', buf.byteLength, 'bytes');
  } else if (resp.status >= 300 && resp.status < 400) {
    console.log('Redirect to:', resp.headers.get('location'));
  } else {
    const text = await resp.text();
    console.log('Body:', text.substring(0, 500));
  }

  console.log('\n=== Test 2: Proxy via fetch with Admin API credentials ===');
  
  // Get the resource info
  const resource = await cloudinary.api.resource(public_id, { resource_type: 'image' });
  console.log('Resource URL:', resource.secure_url);
  
  // Try to fetch the resource URL with Basic Auth
  const authString = Buffer.from('866397911878491:ZJnhx39emMU14AcEfkDKfCGmNVs').toString('base64');
  const resp2 = await fetch(resource.secure_url, {
    headers: { 'Authorization': `Basic ${authString}` }
  });
  console.log('Status with auth:', resp2.status);
  
  if (resp2.status === 200) {
    const buf = await resp2.arrayBuffer();
    console.log('Body size:', buf.byteLength, 'bytes');
  }

  console.log('\n=== Test 3: Try converting PDF page to JPG ===');
  // This works - verified earlier! Pages render as images
  const jpgUrl = cloudinary.url(public_id + '.jpg', {
    resource_type: 'image',
    type: 'upload',
    secure: true,
    transformation: [{ page: 1 }]
  });
  console.log('JPG URL:', jpgUrl);
  const resp3 = await fetch(jpgUrl, { method: 'HEAD' });
  console.log('Status:', resp3.status);
}

test().catch(e => console.error('Error:', e.message));
