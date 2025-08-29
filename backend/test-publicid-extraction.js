// Test public_id extraction logic
function extractPublicId(imageUrl) {
  let publicId;
  if (imageUrl.includes('cloudinary.com')) {
    // Extract from full Cloudinary URL
    const urlParts = imageUrl.split('/');
    const uploadIndex = urlParts.findIndex(part => part === 'upload');
    if (uploadIndex !== -1) {
      // Get everything after 'upload', skip version if present
      let pathParts = urlParts.slice(uploadIndex + 1);
      // Skip version number (starts with 'v' followed by digits)
      if (pathParts[0] && /^v\d+$/.test(pathParts[0])) {
        pathParts = pathParts.slice(1);
      }
      // Join the remaining parts and remove file extension
      publicId = pathParts.join('/').replace(/\.[^/.]+$/, '');
    } else {
      // Fallback: just get the filename without extension
      publicId = imageUrl.split('/').pop().split('.')[0];
    }
  } else {
    // If it's just a filename or simple path
    publicId = imageUrl.split('/').pop().split('.')[0];
  }
  return publicId;
}

// Test with sample URLs
const testUrls = [
  'https://res.cloudinary.com/dfgrknsfy/image/upload/v1756062621/online-assessment/questions/bxh3femwf302mzapv4jv.png',
  'https://res.cloudinary.com/dfgrknsfy/image/upload/online-assessment/questions/bzlsp7cenqe5ate0xrex.png',
  'simple-image.jpg',
  'folder/image.png'
];

testUrls.forEach(url => {
  const publicId = extractPublicId(url);
  console.log(`URL: ${url}`);
  console.log(`Public ID: ${publicId}`);
  console.log('---');
});