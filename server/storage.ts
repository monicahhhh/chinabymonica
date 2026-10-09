import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { ENV } from "./_core/env";
import { getDb } from "./db";

function hasS3Credentials(): boolean {
  return Boolean(ENV.awsAccessKeyId && ENV.awsSecretAccessKey && ENV.s3Bucket);
}

function getS3Client(): S3Client {
  return new S3Client({
    region: ENV.s3Region,
    credentials: {
      accessKeyId: ENV.awsAccessKeyId,
      secretAccessKey: ENV.awsSecretAccessKey,
    },
  });
}

function buildS3PublicUrl(key: string): string {
  const base = ENV.s3PublicBaseUrl
    ? ENV.s3PublicBaseUrl.replace(/\/+$/, "")
    : `https://${ENV.s3Bucket}.s3.${ENV.s3Region}.amazonaws.com`;
  return `${base}/${key}`;
}

async function ensureMediaTable(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
) {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS media_files (
      id INT AUTO_INCREMENT PRIMARY KEY,
      objectKey VARCHAR(512) NOT NULL UNIQUE,
      contentType VARCHAR(128) NOT NULL,
      dataBase64 MEDIUMTEXT NOT NULL,
      createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function storagePutLocal(
  key: string,
  data: Buffer,
  contentType: string,
): Promise<{ key: string; url: string }> {
  const db = await getDb();
  if (!db) {
    throw new Error(
      "Storage unavailable: configure AWS S3 credentials, or set DATABASE_URL for built-in media storage",
    );
  }

  await ensureMediaTable(db);
  const dataBase64 = data.toString("base64");

  await db.execute(sql`
    INSERT INTO media_files (objectKey, contentType, dataBase64)
    VALUES (${key}, ${contentType}, ${dataBase64})
    ON DUPLICATE KEY UPDATE
      contentType = VALUES(contentType),
      dataBase64 = VALUES(dataBase64)
  `);

  return { key, url: `/api/media/${encodeURIComponent(key)}` };
}

export async function getMediaFile(
  key: string,
): Promise<{ contentType: string; data: Buffer } | null> {
  const db = await getDb();
  if (!db) return null;

  await ensureMediaTable(db);

  const [rows] = await db.execute(sql`
    SELECT contentType, dataBase64 FROM media_files WHERE objectKey = ${key} LIMIT 1
  `);

  if (!Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0] as { contentType: string; dataBase64: string };
  return {
    contentType: row.contentType,
    data: Buffer.from(row.dataBase64, "base64"),
  };
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const key = relKey.replace(/^\/+/, "");
  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);

  if (hasS3Credentials()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: ENV.s3Bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    );
    return { key, url: buildS3PublicUrl(key) };
  }

  console.warn(
    "[storage] S3 credentials not set; storing media in MySQL (set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET to use S3)",
  );
  return storagePutLocal(key, buffer, contentType);
}
