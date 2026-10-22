// Checks that this Node runtime rejects certificate chains on its TLS blocklist
// (eMudhra, nodejs/node#66871) while still trusting a normal HTTPS endpoint.
// Needs network access; behind a proxy, run with `node --use-env-proxy`.
const https = require('node:https');

const REVOKED_URL = 'https://dv-g3b-emudhra.we-have-a-problem.com/';
const TRUSTED_URL = 'https://www.google.com/';
const TIMEOUT_MS = 20000;

function probe(url) {
  return new Promise((resolve) => {
    const req = https.get(url, (res) => {
      res.resume();
      resolve({ url, ok: true, status: res.statusCode });
    });
    req.on('error', (err) => resolve({ url, ok: false, code: err.code, message: err.message }));
    req.setTimeout(TIMEOUT_MS, () => req.destroy(new Error(`timed out after ${TIMEOUT_MS}ms`)));
  });
}

async function main() {
  console.log(`node ${process.version}`);
  const revoked = await probe(REVOKED_URL);
  const trusted = await probe(TRUSTED_URL);
  console.log(JSON.stringify(revoked));
  console.log(JSON.stringify(trusted));

  const pass = !revoked.ok && revoked.code === 'CERT_REVOKED' && trusted.ok;
  console.log(pass ? 'PASS' : 'FAIL: expected CERT_REVOKED for the blocked chain and success for the trusted one');
  process.exitCode = pass ? 0 : 1;
}

main();
