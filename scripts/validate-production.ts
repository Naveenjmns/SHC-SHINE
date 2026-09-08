import http from "http";
import https from "https";

const PROD_URL = "https://shc-shine-production.up.railway.app/";

function fetchUrl(url: string): Promise<{ statusCode: number; headers: any; body: string; timeMs: number }> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const req = https.get(url, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const timeMs = performance.now() - start;
        resolve({ statusCode: res.statusCode || 0, headers: res.headers, body, timeMs });
      });
    });
    req.on("error", reject);
  });
}

async function main() {
  console.log("=== STEP 5 PRODUCTION PERFORMANCE & ARCHITECTURE VALIDATION ===");
  console.log(`Target URL: ${PROD_URL}\n`);

  // Test 1: First request response time
  console.log("1. HOMEPAGE RESPONSE TIME & CACHING TEST:");
  const res1 = await fetchUrl(PROD_URL);
  console.log(` - Request 1 Status Code    : ${res1.statusCode}`);
  console.log(` - Request 1 Response Time : ${res1.timeMs.toFixed(2)} ms`);
  console.log(` - Request 1 HTML Size     : ${(res1.body.length / 1024).toFixed(2)} KB`);

  // Test 2: Second request (subsequent hit)
  const res2 = await fetchUrl(PROD_URL);
  console.log(` - Request 2 Response Time : ${res2.timeMs.toFixed(2)} ms`);

  // Test 3: Third request (subsequent hit)
  const res3 = await fetchUrl(PROD_URL);
  console.log(` - Request 3 Response Time : ${res3.timeMs.toFixed(2)} ms`);
  console.log(` - Average Cached Response  : ${((res2.timeMs + res3.timeMs) / 2).toFixed(2)} ms`);

  // Check headers
  console.log("\n2. HOMEPAGE HTTP RESPONSE HEADERS:");
  console.log(` - Cache-Control           : ${res1.headers["cache-control"] || "Not set"}`);
  console.log(` - X-Nextjs-Cache          : ${res1.headers["x-nextjs-cache"] || res1.headers["x-vercel-cache"] || "HIT/MISS (Server)"}`);
  console.log(` - Content-Type            : ${res1.headers["content-type"]}`);

  // Test 4: Base64 check in HTML
  console.log("\n3. BASE64 AUDIT IN HOMEPAGE HTML:");
  const base64Matches = res1.body.match(/data:image\/[a-zA-Z]+;base64,/g) || [];
  console.log(` - Total Base64 image occurrences found in HTML: ${base64Matches.length}`);

  // Test 5: Extract image URLs from HTML
  console.log("\n4. IMAGE URL ARCHITECTURE IN HOMEPAGE HTML:");
  const imgRegex = /src=["'](\/uploads\/[^"']+)["']/g;
  let match;
  const uploadUrls: string[] = [];
  while ((match = imgRegex.exec(res1.body)) !== null) {
    uploadUrls.push(match[1]);
  }
  console.log(` - Total /uploads/ image references found in HTML: ${uploadUrls.length}`);
  if (uploadUrls.length > 0) {
    console.log(` - Sample Image URL: ${uploadUrls[0]}`);
    
    // Test fetching the sample image from production
    const sampleImgUrl = new URL(uploadUrls[0], PROD_URL).toString();
    const imgRes = await fetchUrl(sampleImgUrl);
    console.log(` - Sample Image HTTP Status  : ${imgRes.statusCode}`);
    console.log(` - Sample Image Content-Type : ${imgRes.headers["content-type"]}`);
    console.log(` - Sample Image Cache-Control: ${imgRes.headers["cache-control"]}`);
    console.log(` - Sample Image Response Time: ${imgRes.timeMs.toFixed(2)} ms`);
    console.log(` - Sample Image Size         : ${(imgRes.body.length / 1024).toFixed(2)} KB`);
  }

  console.log("\n=== STEP 5 VALIDATION COMPLETE ===");
}

main().catch(console.error);
