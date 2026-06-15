const { minioClient, BUCKET_NAME } = require('../src/config/minio');

async function run() {
  try {
    console.log(`Checking if bucket "${BUCKET_NAME}" exists...`);
    const exists = await minioClient.bucketExists(BUCKET_NAME);
    if (!exists) {
      console.log(`Bucket "${BUCKET_NAME}" does not exist. Creating it...`);
      await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
      console.log(`Bucket "${BUCKET_NAME}" created successfully.`);
    } else {
      console.log(`Bucket "${BUCKET_NAME}" already exists.`);
    }

    // Set public read-only policy for bucket
    console.log(`Setting public read policy for bucket "${BUCKET_NAME}"...`);
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
        },
      ],
    };

    await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
    console.log(`Public read policy applied to "${BUCKET_NAME}" successfully.`);
    console.log('MinIO setup completed successfully!');
  } catch (err) {
    console.error('Error setting up MinIO:', err);
    process.exit(1);
  }
}

run();
