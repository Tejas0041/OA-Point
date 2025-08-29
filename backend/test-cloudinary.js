require('dotenv').config();
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function testCloudinary() {
  console.log('Testing Cloudinary connection...');
  console.log('Config:', {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
    api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET'
  });

  try {
    // Test connection by getting account details
    const result = await cloudinary.api.ping();
    console.log('Cloudinary ping result:', result);

    // List some resources to verify connection
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'online-assessment',
      max_results: 5
    });
    console.log('Found resources:', resources.resources.length);
    
    if (resources.resources.length > 0) {
      console.log('Sample resources:');
      resources.resources.forEach(resource => {
        console.log(`- ${resource.public_id} (${resource.secure_url})`);
      });

      // Test deletion with the first resource
      const testResource = resources.resources[0];
      console.log(`\nTesting deletion of: ${testResource.public_id}`);
      
      const deleteResult = await cloudinary.uploader.destroy(testResource.public_id);
      console.log('Delete result:', deleteResult);
    }

  } catch (error) {
    console.error('Cloudinary test error:', error);
  }
}

testCloudinary();