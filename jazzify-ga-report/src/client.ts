import "dotenv/config";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

const propertyId = process.env.GA_PROPERTY_ID;

if (!propertyId) {
  throw new Error("GA_PROPERTY_ID が .env に設定されていません。");
}

if (!/^\d+$/.test(propertyId)) {
  throw new Error(
    `GA_PROPERTY_ID は数字のプロパティIDである必要があります（測定ID G-... ではありません）: ${propertyId}`,
  );
}

export const GA_PROPERTY = `properties/${propertyId}`;
export const analyticsDataClient = new BetaAnalyticsDataClient();

export const exitWithError = (label: string, error: unknown): never => {
  console.error(label);

  if (error instanceof Error) {
    console.error(error.message);
  } else {
    console.error(error);
  }

  process.exit(1);
};
