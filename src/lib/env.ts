import { z } from "zod";

const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((value) => value === "" ? undefined : value, schema.optional());

const databaseSchema = z.object({
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgresql://") || value.startsWith("postgres://"), {
    message: "must use the postgresql:// or postgres:// protocol",
  }),
  DB_POOL_MAX: z.coerce.number().int().positive().default(10),
  DB_IDLE_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(30_000),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().nonnegative().default(5_000),
});

const sessionSchema = z.object({
  JWT_SECRET: z.string().min(32, "must contain at least 32 characters"),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(604_800),
});

const oauthSchema = z
  .object({
    APP_URL: z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), {
      message: "must use the https:// or http:// protocol",
    }),
    AUTH_GOOGLE_ID: optional(z.string().min(1)),
    AUTH_GOOGLE_SECRET: optional(z.string().min(1)),
  })
  .refine(
    ({ APP_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET }) =>
      (!AUTH_GOOGLE_ID && !AUTH_GOOGLE_SECRET) || Boolean(AUTH_GOOGLE_ID && AUTH_GOOGLE_SECRET),
    { message: "AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET must be configured together" }
  );

const bootstrapAdminSchema = z
  .object({
    BOOTSTRAP_ADMIN_NAME: optional(z.string().min(1)),
    BOOTSTRAP_ADMIN_EMAIL: optional(z.string().email()),
    BOOTSTRAP_ADMIN_PASSWORD: optional(z.string().min(12)),
  })
  .refine(
    ({ BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD }) => {
      const configured = [BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD].filter(Boolean);
      return configured.length === 0 || configured.length === 3;
    },
    { message: "BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD must be configured together" }
  );

type Environment = Record<string, string | undefined>;

function parse<T>(schema: z.ZodType<T>, env: Environment, concern: string): T {
  const result = schema.safeParse(env);
  if (result.success) return result.data;
  throw new Error(`Invalid ${concern} configuration: ${z.prettifyError(result.error)}`);
}

export function getDatabaseConfig(env: Environment = process.env) {
  return parse(databaseSchema, env, "database");
}

export function getSessionConfig(env: Environment = process.env) {
  return parse(sessionSchema, env, "session");
}

export function getOAuthConfig(env: Environment = process.env) {
  const config = parse(oauthSchema, env, "Google OAuth");
  if (!config.AUTH_GOOGLE_ID || !config.AUTH_GOOGLE_SECRET) return null;
  return {
    appUrl: new URL(config.APP_URL),
    clientId: config.AUTH_GOOGLE_ID,
    clientSecret: config.AUTH_GOOGLE_SECRET,
  };
}

export function getBootstrapAdminConfig(env: Environment = process.env) {
  const config = parse(bootstrapAdminSchema, env, "bootstrap admin");
  if (!config.BOOTSTRAP_ADMIN_NAME || !config.BOOTSTRAP_ADMIN_EMAIL || !config.BOOTSTRAP_ADMIN_PASSWORD) return null;
  return {
    name: config.BOOTSTRAP_ADMIN_NAME,
    email: config.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
    password: config.BOOTSTRAP_ADMIN_PASSWORD,
  };
}