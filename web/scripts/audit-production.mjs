import { spawnSync } from 'node:child_process';

const ALLOWED_ADVISORIES = new Set(['https://github.com/advisories/GHSA-fc5q-39xc-vjpf']);
const ALLOWED_CHAIN = new Set([
  '@rollup/plugin-commonjs',
  '@rollup/pluginutils',
  '@sentry/nextjs',
  'fdir',
  'picomatch',
]);

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const audit = spawnSync(npmCommand, ['audit', '--omit=dev', '--json'], {
  encoding: 'utf8',
  shell: process.platform === 'win32',
});

if (audit.error || !audit.stdout) {
  console.error('Không thể chạy npm audit.', audit.error?.message || audit.stderr);
  process.exit(1);
}

let report;
try {
  report = JSON.parse(audit.stdout);
} catch {
  console.error('Không thể đọc kết quả npm audit.');
  console.error(audit.stderr || audit.stdout);
  process.exit(1);
}

const blocking = Object.values(report.vulnerabilities || {}).filter((vulnerability) =>
  ['high', 'critical'].includes(vulnerability.severity)
);
const advisoryUrls = new Set(
  blocking.flatMap((vulnerability) =>
    vulnerability.via
      .filter((item) => typeof item === 'object' && item !== null && 'url' in item)
      .map((item) => item.url)
  )
);

const hasUnexpectedPackage = blocking.some(
  (vulnerability) => !ALLOWED_CHAIN.has(vulnerability.name)
);
const hasUnexpectedAdvisory = [...advisoryUrls].some(
  (advisoryUrl) => !ALLOWED_ADVISORIES.has(advisoryUrl)
);
const hasCritical = blocking.some((vulnerability) => vulnerability.severity === 'critical');

if (hasUnexpectedPackage || hasUnexpectedAdvisory || hasCritical) {
  console.error('Phát hiện lỗ hổng production mới ở mức high hoặc critical:');
  for (const vulnerability of blocking) {
    console.error(`- ${vulnerability.name}: ${vulnerability.severity}`);
  }
  process.exit(1);
}

if (blocking.length > 0) {
  console.warn(
    'Tạm chấp nhận GHSA-fc5q-39xc-vjpf trong chuỗi build của Sentry; advisory chưa có phiên bản picomatch được vá.'
  );
}

console.log('Không phát hiện lỗ hổng production high/critical ngoài allowlist.');
