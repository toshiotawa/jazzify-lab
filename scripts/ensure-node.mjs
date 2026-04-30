/**
 * Node 18 以上を要求する。`npm run wrangler:r2` の前などに利用。
 */
const major = Number.parseInt(process.version.slice(1).split('.')[0], 10);
if (Number.isNaN(major) || major < 18) {
  process.stderr.write(
    `Node.js 18 以上が必要です（現在: ${process.version}）。\n` +
      '  • macOS: brew install node\n' +
      '  • 公式: https://nodejs.org/\n' +
      '  • nvm: ルートで nvm install（.nvmrc 参照）\n',
  );
  process.exit(1);
}
