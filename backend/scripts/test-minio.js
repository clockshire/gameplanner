/**
 * Test script for MinIO S3 functionality
 * Run with: node backend/scripts/test-minio.js
 */

const S3Service = require('../src/s3');

async function testMinIO() {
  console.log('🧪 Testing MinIO S3 Service...\n');

  const s3Service = new S3Service();

  try {
    // Test 1: Initialize bucket
    console.log('1️⃣ Testing bucket initialization...');
    const initResult = await s3Service.initializeBucket();
    console.log('   Result:', initResult.message);
    console.log('   Success:', initResult.success ? '✅' : '❌');
    console.log('');

    if (!initResult.success) {
      console.error('❌ Failed to initialize bucket. Make sure MinIO is running.');
      console.log('   Start MinIO with: make start-minio');
      process.exit(1);
    }

    // Test 2: Upload a test file
    console.log('2️⃣ Testing file upload...');
    const testContent = Buffer.from('Hello MinIO! This is a test file.');
    const uploadResult = await s3Service.uploadFile(
      testContent,
      'test.txt',
      'text/plain',
      'test-uploads'
    );

    console.log('   Result:', uploadResult.message);
    console.log('   Success:', uploadResult.success ? '✅' : '❌');

    if (uploadResult.success) {
      console.log('   File Key:', uploadResult.data.key);
      console.log('   File Size:', uploadResult.data.size, 'bytes');
      console.log('');

      // Test 3: Generate presigned URL
      console.log('3️⃣ Testing presigned URL generation...');
      const urlResult = await s3Service.getPresignedUrl(uploadResult.data.key, 300);
      console.log('   Result:', urlResult.message);
      console.log('   Success:', urlResult.success ? '✅' : '❌');

      if (urlResult.success) {
        console.log('   Presigned URL:', urlResult.data.url);
        console.log('   Expires in:', urlResult.data.expiresIn, 'seconds');
        console.log('');

        // Test 4: List files
        console.log('4️⃣ Testing file listing...');
        const listResult = await s3Service.listFiles('test-uploads');
        console.log('   Result:', listResult.message);
        console.log('   Success:', listResult.success ? '✅' : '❌');

        if (listResult.success) {
          console.log('   Files found:', listResult.data.length);
          listResult.data.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.Key} (${file.Size} bytes)`);
          });
          console.log('');

          // Test 5: Delete test file
          console.log('5️⃣ Testing file deletion...');
          const deleteResult = await s3Service.deleteFile(uploadResult.data.key);
          console.log('   Result:', deleteResult.message);
          console.log('   Success:', deleteResult.success ? '✅' : '❌');
        }
      }
    }

    console.log('\n🎉 MinIO S3 Service test completed!');
    console.log('\n📝 Next steps:');
    console.log('   • MinIO Console: http://localhost:9001');
    console.log('   • Credentials: minioadmin / minioadmin123');
    console.log('   • API Endpoint: http://localhost:9000');
    console.log('   • Test upload: curl -X POST http://localhost:3001/api/images/upload');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure MinIO is running: make start-minio');
    console.log('   • Check MinIO logs: docker logs minio-local');
    console.log('   • Verify MinIO is accessible: curl http://localhost:9000/minio/health/live');
  }
}

// Run the test
testMinIO();
