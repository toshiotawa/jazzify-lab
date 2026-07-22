/**
 * Jazz Piano Days 当月アクセス（ホスト別・レッスンLP切り分け）
 */
import {
  analyticsDataClient,
  exitWithError,
  GA_PROPERTY,
  logGaHeader,
} from "./client.js";

const monthStart = (() => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
})();

const MONTH_RANGE = [{ startDate: monthStart, endDate: "yesterday" }] as const;

async function report(
  label: string,
  req: Parameters<typeof analyticsDataClient.runReport>[0],
): Promise<void> {
  const [response] = await analyticsDataClient.runReport(req);
  const rows =
    response.rows?.map((row) => ({
      dims: row.dimensionValues?.map((d) => d.value ?? "") ?? [],
      metrics: row.metricValues?.map((m) => Number(m.value ?? 0)) ?? [],
    })) ?? [];

  console.log(`\n== ${label} ==`);
  if (rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  console.table(
    rows.map((r) => ({
      ...Object.fromEntries(r.dims.map((d, i) => [`d${i}`, d])),
      ...Object.fromEntries(r.metrics.map((m, i) => [`m${i}`, m])),
    })),
  );
}

async function main(): Promise<void> {
  logGaHeader(`Jazz Piano Days 当月（${monthStart} 〜 yesterday）`);

  await report("totals (users / sessions / pageViews / engSessions)", {
    property: GA_PROPERTY,
    dateRanges: [...MONTH_RANGE],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "engagedSessions" },
      { name: "averageSessionDuration" },
    ],
  });

  await report("daily (date / users / sessions / pageViews)", {
    property: GA_PROPERTY,
    dateRanges: [...MONTH_RANGE],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  await report("by hostname (host / users / sessions / pageViews)", {
    property: GA_PROPERTY,
    dateRanges: [...MONTH_RANGE],
    dimensions: [{ name: "hostName" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
    ],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 20,
  });

  await report(
    "lesson subdomain only (daily: date / users / sessions / pageViews)",
    {
      property: GA_PROPERTY,
      dateRanges: [...MONTH_RANGE],
      dimensions: [{ name: "date" }],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      dimensionFilter: {
        filter: {
          fieldName: "hostName",
          stringFilter: {
            matchType: "EXACT",
            value: "jazz-piano-lesson.jazzpianodays.com",
          },
        },
      },
      orderBys: [{ dimension: { dimensionName: "date" } }],
    },
  );

  await report(
    "lesson subdomain top pages (path / pageViews / users)",
    {
      property: GA_PROPERTY,
      dateRanges: [...MONTH_RANGE],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "hostName",
          stringFilter: {
            matchType: "EXACT",
            value: "jazz-piano-lesson.jazzpianodays.com",
          },
        },
      },
      orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
      limit: 15,
    },
  );

  await report("all sites top pages (path / pageViews / users)", {
    property: GA_PROPERTY,
    dateRanges: [...MONTH_RANGE],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "screenPageViews" }, { name: "activeUsers" }],
    orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
    limit: 20,
  });

  await report(
    "acquisition (source / medium / campaign / sessions / users)",
    {
      property: GA_PROPERTY,
      dateRanges: [...MONTH_RANGE],
      dimensions: [
        { name: "sessionSource" },
        { name: "sessionMedium" },
        { name: "sessionCampaignName" },
      ],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 20,
    },
  );

  await report(
    "lesson subdomain acquisition (source / medium / sessions / users)",
    {
      property: GA_PROPERTY,
      dateRanges: [...MONTH_RANGE],
      dimensions: [
        { name: "sessionSource" },
        { name: "sessionMedium" },
      ],
      metrics: [{ name: "sessions" }, { name: "activeUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "hostName",
          stringFilter: {
            matchType: "EXACT",
            value: "jazz-piano-lesson.jazzpianodays.com",
          },
        },
      },
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 15,
    },
  );

  await report("device (deviceCategory / users / sessions)", {
    property: GA_PROPERTY,
    dateRanges: [...MONTH_RANGE],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });
}

main().catch((error: unknown) => {
  exitWithError("Jazz Piano Days 当月レポートの取得に失敗しました。", error);
});
