const frontend = process.env.SMOKE_FRONTEND_URL || "http://127.0.0.1:3000";
const backend = process.env.SMOKE_BACKEND_URL || "http://127.0.0.1:8000";

async function fetchText(url, init) {
  const response = await fetch(url, init);
  const text = await response.text();
  return { response, text };
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

await check("backend-health", async () => {
  const { response, text } = await fetchText(`${backend}/health`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  if (!text.includes("healthy")) throw new Error("unexpected health payload");
});

await check("login-page", async () => {
  const { response, text } = await fetchText(`${frontend}/login/`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  if (!text.includes("Ayn")) throw new Error("login page missing brand marker");
});

await check("landing-page", async () => {
  const { response, text } = await fetchText(`${frontend}/`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  if (!text.includes("Ayn")) throw new Error("landing page missing brand marker");
});

await check("platform-entry", async () => {
  const { response } = await fetchText(`${frontend}/platform/`);
  if (!response.ok) throw new Error(`status ${response.status}`);
});

await check("horus-page", async () => {
  const { response, text } = await fetchText(`${frontend}/platform/horus-ai/`);
  if (!response.ok) throw new Error(`status ${response.status}`);
  if (!text.includes("Ayn")) throw new Error("unexpected Horus shell payload");
});

if (process.exitCode) {
  process.exit(process.exitCode);
}
