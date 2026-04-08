export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Admin credentials (replaces Manus OAuth)
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // AI Gateway (for LLM translations and image generation)
  aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  // AWS S3 storage
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "", // optional CDN / custom domain
};
