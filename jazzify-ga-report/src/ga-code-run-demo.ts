import { exitWithError, GA_SITE, logGaHeader } from "./client.js";
import { printCodeRunDemoReports } from "./reports/codeRunDemo.js";

async function main(): Promise<void> {
  if (GA_SITE !== "jazzify") {
    console.log("Skip: code run demo report is Jazzify-only.");
    return;
  }

  logGaHeader("GA4 コードラン埋め込み（7daysAgo 〜 yesterday）");
  await printCodeRunDemoReports();
}

main().catch((error: unknown) => {
  exitWithError("GA4 コードラン埋め込みレポートの取得に失敗しました。", error);
});
