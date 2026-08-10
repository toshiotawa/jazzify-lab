import { analyticsDataClient, GA_PROPERTY } from "../client.js";

const RANGE = [{ startDate: "7daysAgo", endDate: "yesterday" }] as const;

export const CODE_RUN_DEMO_EVENTS = [
  "lp_chord_run_demo_open",
  "code_run_demo_play",
  "code_run_demo_clear",
  "code_run_demo_timeout",
  "code_run_demo_cta_click",
] as const;

export type CodeRunDemoEventName = (typeof CODE_RUN_DEMO_EVENTS)[number];

export const EMBED_FROM_LABELS: Readonly<Record<string, string>> = {
  lp_ja: "LP 日本語",
  lp_en: "LP 英語",
  en_blog: "英語ブログ",
  jazzpianodays: "Jazz Piano Days",
};

export const embedFromLabel = (embedFrom: string): string =>
  EMBED_FROM_LABELS[embedFrom] ?? embedFrom;

/** iframe URL の ?from= または LP の hostName から embed_from を推定（customEvent 未登録時の代替） */
export const inferEmbedFrom = (
  pagePathPlusQuery: string,
  eventName: string,
  hostName: string,
): string => {
  const path = pagePathPlusQuery.split("?")[0] ?? pagePathPlusQuery;
  if (path.startsWith("/embed/code-run")) {
    const query = pagePathPlusQuery.includes("?")
      ? pagePathPlusQuery.split("?")[1]
      : "";
    const from = new URLSearchParams(query).get("from");
    return from?.trim() || "(no from param)";
  }
  if (eventName === "lp_chord_run_demo_open") {
    if (hostName === "en.jazzify.jp") return "lp_en";
    if (hostName === "jazzify.jp") return "lp_ja";
    return hostName || "(unknown lp)";
  }
  return "(other)";
};

interface ReportRow {
  dims: string[];
  metrics: number[];
}

async function fetchRows(
  req: Omit<Parameters<typeof analyticsDataClient.runReport>[0], "property">,
): Promise<ReportRow[]> {
  const [response] = await analyticsDataClient.runReport({
    property: GA_PROPERTY,
    ...req,
  });
  return (
    response.rows?.map((row) => ({
      dims: row.dimensionValues?.map((d) => d.value ?? "") ?? [],
      metrics: row.metricValues?.map((m) => Number(m.value ?? 0)) ?? [],
    })) ?? []
  );
}

export interface CodeRunFunnelRow {
  event: CodeRunDemoEventName | string;
  eventCount: number;
  users: number;
}

export interface CodeRunByEmbedFromRow {
  embedFrom: string;
  label: string;
  open: number;
  play: number;
  clear: number;
}

const emptyByEmbed = (): CodeRunByEmbedFromRow => ({
  embedFrom: "",
  label: "",
  open: 0,
  play: 0,
  clear: 0,
});

export async function fetchCodeRunFunnel(): Promise<CodeRunFunnelRow[]> {
  const rows = await fetchRows({
    dateRanges: [...RANGE],
    dimensions: [{ name: "eventName" }],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...CODE_RUN_DEMO_EVENTS] },
      },
    },
    orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
  });
  return rows.map((row) => ({
    event: row.dims[0] ?? "",
    eventCount: row.metrics[0] ?? 0,
    users: row.metrics[1] ?? 0,
  }));
}

export async function fetchCodeRunByEmbedFrom(): Promise<CodeRunByEmbedFromRow[]> {
  const rows = await fetchRows({
    dateRanges: [...RANGE],
    dimensions: [
      { name: "pagePathPlusQueryString" },
      { name: "eventName" },
      { name: "hostName" },
    ],
    metrics: [{ name: "eventCount" }],
    dimensionFilter: {
      filter: {
        fieldName: "eventName",
        inListFilter: { values: [...CODE_RUN_DEMO_EVENTS] },
      },
    },
    limit: 500,
  });

  const byEmbed = new Map<string, CodeRunByEmbedFromRow>();

  for (const row of rows) {
    const [pagePathPlusQuery = "", eventName = "", hostName = ""] = row.dims;
    const [eventCount = 0] = row.metrics;
    const embedFrom = inferEmbedFrom(pagePathPlusQuery, eventName, hostName);
    const existing = byEmbed.get(embedFrom) ?? {
      ...emptyByEmbed(),
      embedFrom,
      label: embedFromLabel(embedFrom),
    };

    if (eventName === "lp_chord_run_demo_open") {
      existing.open += eventCount;
    } else if (eventName === "code_run_demo_play") {
      existing.play += eventCount;
    } else if (eventName === "code_run_demo_clear") {
      existing.clear += eventCount;
    }

    byEmbed.set(embedFrom, existing);
  }

  return [...byEmbed.values()].sort((a, b) => b.play - a.play || b.open - a.open);
}

export function printReportTable(
  label: string,
  rows: Record<string, string | number>[],
): void {
  console.log(`\n== ${label} ==`);
  if (rows.length === 0) {
    console.log("(no rows)");
    return;
  }
  console.table(rows);
}

export async function printCodeRunDemoReports(): Promise<void> {
  const funnel = await fetchCodeRunFunnel();
  printReportTable(
    "code run funnel (eventCount / users)",
    funnel.map((r) => ({
      event: r.event,
      eventCount: r.eventCount,
      users: r.users,
    })),
  );

  const byEmbed = await fetchCodeRunByEmbedFrom();
  printReportTable(
    "code run by embed_from (open / play / clear)",
    byEmbed.map((r) => ({
      embed_from: r.embedFrom,
      label: r.label,
      open: r.open,
      play: r.play,
      clear: r.clear,
      clear_rate:
        r.play > 0 ? `${Math.round((r.clear / r.play) * 1000) / 10}%` : "—",
    })),
  );

  console.log(
    "\n(note) embed_from は pagePathPlusQueryString / hostName から推定。出所別 UU は GA4 Admin で customEvent:embed_from 登録後に取得可能。",
  );
}
