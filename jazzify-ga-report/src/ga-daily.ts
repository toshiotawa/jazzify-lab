import { analyticsDataClient, exitWithError, GA_PROPERTY } from "./client.js";

async function main(): Promise<void> {
  const [response] = await analyticsDataClient.runReport({
    property: GA_PROPERTY,
    dateRanges: [
      {
        startDate: "7daysAgo",
        endDate: "yesterday",
      },
    ],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "keyEvents" },
    ],
    orderBys: [
      {
        dimension: {
          dimensionName: "date",
        },
      },
    ],
  });

  const rows =
    response.rows?.map((row) => ({
      date: row.dimensionValues?.[0]?.value ?? "",
      activeUsers: Number(row.metricValues?.[0]?.value ?? 0),
      sessions: Number(row.metricValues?.[1]?.value ?? 0),
      pageViews: Number(row.metricValues?.[2]?.value ?? 0),
      keyEvents: Number(row.metricValues?.[3]?.value ?? 0),
    })) ?? [];

  console.log("GA4 日次概況（直近7日 / yesterdayまで）");
  console.table(rows);
}

main().catch((error: unknown) => {
  exitWithError("GA4日次レポートの取得に失敗しました。", error);
});
