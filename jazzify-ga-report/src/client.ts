import "dotenv/config";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export type GaSite = "jazzify" | "jazzpianodays";

const SITE_ALIASES: Record<string, GaSite> = {
  jazzify: "jazzify",
  jfy: "jazzify",
  jazzpianodays: "jazzpianodays",
  jpd: "jazzpianodays",
};

const SITE_ENV_KEYS: Record<GaSite, string> = {
  jazzify: "GA_PROPERTY_ID",
  jazzpianodays: "GA_PROPERTY_ID_JAZZPIANODAYS",
};

const SITE_LABELS: Record<GaSite, string> = {
  jazzify: "Jazzify",
  jazzpianodays: "Jazz Piano Days (jazzpianodays.com)",
};

const parseSiteArg = (argv: string[]): string | undefined => {
  for (const arg of argv) {
    if (arg.startsWith("--site=")) {
      return arg.slice("--site=".length);
    }
  }

  const index = argv.indexOf("--site");
  if (index >= 0 && argv[index + 1]) {
    return argv[index + 1];
  }

  return undefined;
};

const resolveGaSite = (): GaSite => {
  const raw = parseSiteArg(process.argv.slice(2)) ?? process.env.GA_SITE ?? "jazzify";
  const site = SITE_ALIASES[raw.toLowerCase()];

  if (!site) {
    throw new Error(
      `不明なサイト指定です: ${raw}（jazzify / jazzpianodays / jpd）`,
    );
  }

  return site;
};

const readPropertyId = (site: GaSite): string => {
  const envKey = SITE_ENV_KEYS[site];
  const propertyId = process.env[envKey];

  if (!propertyId) {
    throw new Error(`${envKey} が .env に設定されていません。`);
  }

  if (!/^\d+$/.test(propertyId)) {
    throw new Error(
      `${envKey} は数字のプロパティIDである必要があります（測定ID G-... ではありません）: ${propertyId}`,
    );
  }

  return propertyId;
};

export const GA_SITE = resolveGaSite();
export const GA_SITE_LABEL = SITE_LABELS[GA_SITE];
export const GA_PROPERTY_ID = readPropertyId(GA_SITE);
export const GA_PROPERTY = `properties/${GA_PROPERTY_ID}`;
export const analyticsDataClient = new BetaAnalyticsDataClient();

export const logGaHeader = (title: string): void => {
  console.log(`${title}`);
  console.log(`site: ${GA_SITE_LABEL} / property: ${GA_PROPERTY_ID}`);
};

export const exitWithError = (label: string, error: unknown): never => {
  console.error(label);

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
};
