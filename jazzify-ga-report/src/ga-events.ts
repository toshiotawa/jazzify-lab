import {
  analyticsDataClient,
  exitWithError,
  GA_PROPERTY,
  GA_SITE,
  logGaHeader,
} from "./client.js";

const JAZZIFY_EVENTS = [
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

async function main(): Promise<void> {
  const [response] = await analyticsDataClient.runReport({
    property: GA_PROPERTY,
    dateRanges: [
      {
        startDate: "30daysAgo",
        endDate: "yesterday",
      },
    ],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    ...(GA_SITE === "jazzify"
      ? {
          dimensionFilter: {
            filter: {
              fieldName: "eventName",
              inListFilter: {
                values: [...JAZZIFY_EVENTS],
              },
            },
          },
        }
      : {}),
    orderBys: [
      {
        metric: {
          metricName: "eventCount",
        },
        desc: true,
      },
    ],
    limit: GA_SITE === "jazzpianodays" ? 50 : undefined,
  });

  const rows =
    response.rows?.map((row) => ({
      eventName: row.dimensionValues?.[0]?.value ?? "",
      eventCount: Number(row.metricValues?.[0]?.value ?? 0),
      totalUsers: Number(row.metricValues?.[1]?.value ?? 0),
    })) ?? [];

  logGaHeader(
    GA_SITE === "jazzpianodays"
      ? "GA4 イベント別（直近30日 / 上位50）"
      : "GA4 イベント別（直近30日）",
  );
  console.table(rows);

  if (rows.length === 0) {
    console.log(
      "対象イベントの行がありません。GA4にイベントが届いているか、期間を確認してください。",
    );
  }
}

main().catch((error: unknown) => {
  exitWithError("GA4イベントレポートの取得に失敗しました。", error);
});
