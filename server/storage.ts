import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { ENV } from "./_core/env";

function getS3Client(): S3Client {
  if (!ENV.awsAccessKeyId || !ENV.awsSecretAccessKey || !ENV.s3Bucket) {
    throw new Error(
      "S3 credentials missing: set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET, S3_REGION"
    );
  }
  return new S3Client({
    region: ENV.s3Region,
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  });
}

function buildPublicUrl(key: string): string {
  const base = ENV.s3PublicBaseUrl
    ? ENV.s3PublicBaseUrl.replace(/\/+$/, "")
    : `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com`;
  return `${base}/${key}`;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const client = getS3Client();
  const key = relKey.replace(/^\/+/, "");

  await client.send(
    new PutObjectCommand({
      Bucket: ENV.s3Bucket,
      Key: key,
      Body: data as Buffer,
      ContentType: contentType,
    })
  );

  return { key, url: buildPublicUrl(key) };
}
