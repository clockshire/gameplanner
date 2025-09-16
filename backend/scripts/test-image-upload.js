/**
 * Test script for image upload functionality
 * Run with: node backend/scripts/test-image-upload.js
 */

const fs = require('fs');
const path = require('path');

async function testImageUpload() {
  console.log('🧪 Testing Image Upload API...\n');

  try {
    // First, we need to authenticate to get a session token
    console.log('1️⃣ Testing authentication...');
    const authResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
      }),
    });

    const authData = await authResponse.json();

    if (!authData.success) {
      console.log('   Creating test user...');
      // Try to create the user first
      const signupResponse = await fetch(
        'http://localhost:3001/api/auth/signup',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
          }),
        }
      );

      const signupData = await signupResponse.json();
      if (signupData.success) {
        console.log('   Test user created successfully');
        // Now try to login
        const loginResponse = await fetch(
          'http://localhost:3001/api/auth/login',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'password123',
            }),
          }
        );
        const loginData = await loginResponse.json();
        if (loginData.success) {
          console.log('   Login successful');
          var sessionToken = loginData.data.sessionToken;
        } else {
          throw new Error('Login failed: ' + loginData.message);
        }
      } else {
        throw new Error('Signup failed: ' + signupData.message);
      }
    } else {
      console.log('   Login successful');
      var sessionToken = authData.data.sessionToken;
    }

    // Create a test image file
    console.log('\n2️⃣ Creating test image...');
    const testImagePath = path.join(__dirname, 'test-image.png');

    // Create a simple 1x1 PNG file (base64 encoded)
    const pngData = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngData);
    console.log('   Test image created:', testImagePath);

    // Test image upload
    console.log('\n3️⃣ Testing image upload...');
    const formData = new FormData();
    formData.append(
      'image',
      new Blob([pngData], { type: 'image/png' }),
      'test.png'
    );
    formData.append('folder', 'test-uploads');

    const uploadResponse = await fetch(
      'http://localhost:3001/api/images/upload',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
        body: formData,
      }
    );

    const uploadData = await uploadResponse.json();

    if (uploadData.success) {
      console.log('   ✅ Upload successful!');
      console.log('   File Key:', uploadData.data.key);
      console.log('   File Size:', uploadData.data.size, 'bytes');
      console.log('   Content Type:', uploadData.data.contentType);

      // Test presigned URL generation
      console.log('\n4️⃣ Testing presigned URL generation...');
      const urlResponse = await fetch(
        `http://localhost:3001/api/images/presigned/${encodeURIComponent(
          uploadData.data.key
        )}?expiresIn=300`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        }
      );

      const urlData = await urlResponse.json();

      if (urlData.success) {
        console.log('   ✅ Presigned URL generated!');
        console.log('   URL:', urlData.data.url);
        console.log('   Expires in:', urlData.data.expiresIn, 'seconds');

        // Test file listing
        console.log('\n5️⃣ Testing file listing...');
        const listResponse = await fetch(
          'http://localhost:3001/api/images/list?prefix=test-uploads',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${sessionToken}`,
            },
          }
        );

        const listData = await listResponse.json();

        if (listData.success) {
          console.log('   ✅ File listing successful!');
          console.log('   Files found:', listData.data.length);
          listData.data.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.Key} (${file.Size} bytes)`);
          });

          // Test file deletion
          console.log('\n6️⃣ Testing file deletion...');
          const deleteResponse = await fetch(
            `http://localhost:3001/api/images/${encodeURIComponent(
              uploadData.data.key
            )}`,
            {
              method: 'DELETE',
              headers: {
                Authorization: `Bearer ${sessionToken}`,
              },
            }
          );

          const deleteData = await deleteResponse.json();

          if (deleteData.success) {
            console.log('   ✅ File deleted successfully!');
          } else {
            console.log('   ❌ File deletion failed:', deleteData.message);
          }
        } else {
          console.log('   ❌ File listing failed:', listData.message);
        }
      } else {
        console.log('   ❌ Presigned URL generation failed:', urlData.message);
      }
    } else {
      console.log('   ❌ Upload failed:', uploadData.message);
    }

    // Clean up test file
    if (fs.existsSync(testImagePath)) {
      fs.unlinkSync(testImagePath);
      console.log('\n🧹 Test image cleaned up');
    }

    console.log('\n🎉 Image upload test completed!');
    console.log('\n📝 Next steps:');
    console.log(
      '   • Visit http://localhost:3000/#image-upload to test the UI'
    );
    console.log('   • MinIO Console: http://localhost:9001');
    console.log('   • Credentials: minioadmin / minioadmin123');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   • Make sure both servers are running: npm run dev');
    console.log('   • Check MinIO is running: make start-minio');
    console.log(
      '   • Verify API health: curl http://localhost:3001/api/health'
    );
  }
}

// Run the test
testImageUpload();
