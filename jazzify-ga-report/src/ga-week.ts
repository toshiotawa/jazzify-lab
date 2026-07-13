import { analyticsDataClient, exitWithError, GA_PROPERTY } from "./client.js";

const RANGE = [{ startDate: "7daysAgo", endDate: "yesterday" }] as const;

const KEY_EVENTS = [
  "sign_up",
  "sign_up_click",
  "trial_start",
  "purchase",
  "begin_checkout",
  "tutorial_begin",
  "tutorial_complete",
  "quest_start",
  "quest_complete",
  "midi_connected",
] as const;

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
  console.table(
    rows.map((r) => ({
      ...Object.fromEntries(r.dims.map((d, i) => [`d${i}`, d])),
      ...Object.fromEntries(r.metrics.map((m, i) => [`m${i}`, m])),
    })),
  );
}

async function main(): Promise<void> {
  console.log("GA4 週次レポート（7daysAgo 〜 yesterday）");

  await report("daily (date / users / sessions / pageViews / keyEvents)", {
    property: GA_PROPERTY,
    dateRanges: [...RANGE],
    dimensions: [{ name: "date" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "screenPageViews" },
      { name: "keyEvents" },
    ],
    orderBys: [{ dimension: { dimensionName: "date" } }],
  });

  await report("deviceCategory (users / sessions / keyEvents)", {
    property: GA_PROPERTY,
    dateRanges: [...RANGE],
    dimensions: [{ name: "deviceCategory" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "keyEvents" },
    ],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  await report("country top15 (users / sessions / keyEvents)", {
    property: GA_PROPERTY,
    dateRanges: [...RANGE],
    dimensions: [{ name: "country" }],
    metrics: [
      { name: "activeUsers" },
      { name: "sessions" },
      { name: "keyEvents" },
    ],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
    limit: 15,
  });

  await report("platform (users / sessions)", {
    property: GA_PROPERTY,
    dateRanges: [...RANGE],
    dimensions: [{ name: "platform" }],
    metrics: [{ name: "activeUsers" }, { name: "sessions" }],
    orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
  });

  await report("key events (eventCount / users)", {
    property: GA_PROPERTY,
    dateRanges: [...RANGE],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...KEY_EVENTS] },
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  });

  await report(
    "acquisition top25 (source / medium / campaign / content / sessions / users / keyEvents)",
    {
      property: GA_PROPERTY,
      dateRanges: [...RANGE],
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
      orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
      limit: 25,
    },
  );

  await report(
    "sign_up by source (source / medium / campaign / content / events / users)",
    {
      property: GA_PROPERTY,
      dateRanges: [...RANGE],
      dimensions: [
        { name: "sessionSource" },
        { name: "sessionMedium" },
        { name: "sessionCampaignName" },
        { name: "sessionManualAdContent" },
      ],
      metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
      dimensionFilter: {
        filter: {
          fieldName: "eventName",
          stringFilter: { value: "sign_up" },
        },
      },
      orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
      limit: 20,
    },
  );
}

main().catch((error: unknown) => {
  exitWithError("GA4週次レポートの取得に失敗しました。", error);
});
