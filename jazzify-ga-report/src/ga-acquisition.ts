import {
  analyticsDataClient,
  exitWithError,
  GA_PROPERTY,
  logGaHeader,
} from "./client.js";

async function main(): Promise<void> {
  const [response] = await analyticsDataClient.runReport({
    property: GA_PROPERTY,
    dateRanges: [
      {
        startDate: "30daysAgo",
        endDate: "yesterday",
      },
    ],
    dimensions: [
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "sessionCampaignName" },
      { name: "sessionManualAdContent" },
    ],
    metrics: [
      { name: "sessions" },
      { name: "activeUsers" },
      { name: "keyEvents" },
    ],
    orderBys: [
      {
        metric: {
          metricName: "sessions",
        },
        desc: true,
      },
    ],
    limit: 50,
  });

  const rows =
    response.rows?.map((row) => ({
      source: row.dimensionValues?.[0]?.value ?? "",
      medium: row.dimensionValues?.[1]?.value ?? "",
      campaign: row.dimensionValues?.[2]?.value ?? "",
      content: row.dimensionValues?.[3]?.value ?? "",
      sessions: Number(row.metricValues?.[0]?.value ?? 0),
      activeUsers: Number(row.metricValues?.[1]?.value ?? 0),
      keyEvents: Number(row.metricValues?.[2]?.value ?? 0),
    })) ?? [];

  logGaHeader("GA4 流入別（直近30日 / sessions上位50）");
  console.table(rows);
}

main().catch((error: unknown) => {
  exitWithError("GA4流入レポートの取得に失敗しました。", error);
});
