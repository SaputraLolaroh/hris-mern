const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// PENTING: Tidak perlu memasukkan credentials secara manual jika server berjalan
// di EC2 dengan IAM Role terpasang (AWS SDK otomatis mendeteksi Instance Metadata).
// Untuk lokal, isi AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY di file .env.
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-southeast-1'
});

// Upload file (misal: slip gaji PDF) ke S3
async function uploadFileToS3(fileBuffer, fileName, contentType = 'application/pdf') {
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName,
    Body: fileBuffer,
    ContentType: contentType
  });
  await s3Client.send(command);
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}

// Membuat Presigned URL: tautan unduh sementara (default 60 detik) untuk file privat
async function generatePresignedDownloadUrl(fileName, expiresInSeconds = 60) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: fileName
  });
  return await getSignedUrl(s3Client, command, { expiresIn: expiresInSeconds });
}

module.exports = { uploadFileToS3, generatePresignedDownloadUrl };
