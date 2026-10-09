export const ENV = {
  isProduction: process.env.NODE_ENV === "production",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  // Admin credentials (replaces Manus OAuth)
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  adminPassword: process.env.ADMIN_PASSWORD ?? "",
  // Preferred OpenAI-compatible LLM (translations)
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "",
  llmModel: process.env.LLM_MODEL ?? process.env.OPENAI_MODEL ?? "",
  // Legacy Manus / HappyCapy AI Gateway
  aiGatewayApiKey: process.env.AI_GATEWAY_API_KEY ?? "",
  aiGatewayBaseUrl: process.env.AI_GATEWAY_BASE_URL ?? "",
  aiGatewayModel: process.env.AI_GATEWAY_MODEL ?? "",
  // AWS S3 storage
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3Region: process.env.S3_REGION ?? "us-east-1",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "", // optional CDN / custom domain
  /** Optional Manus/Forge-style API (map, notifications, etc.) */
  forgeApiUrl: process.env.FORGE_API_URL ?? "",
  forgeApiKey: process.env.FORGE_API_KEY ?? "",
};
