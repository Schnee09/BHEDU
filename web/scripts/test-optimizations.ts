import { requestCache } from "../lib/api/requestCache";
import { logger } from "../lib/logger";
import { performanceMonitor } from "../lib/performanceMonitor";

// Mock fetch for testing
const originalFetch = global.fetch;
let mockDelay = 100;
let fetchCount = 0;

global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    fetchCount++;
    console.log(`[Network] Fetching ${input.toString()}...`);
    await new Promise((resolve) => setTimeout(resolve, mockDelay));

    return new Response(
        JSON.stringify({ data: { id: 1, name: "Test" }, success: true }),
        {
            status: 200,
            headers: { "Content-Type": "application/json" },
        },
    );
};

async function testOptimizations() {
    console.log("--- Starting Optimization Tests ---");

    // Test 1: Logger
    console.log("\n1. Testing Logger");
    logger.info("Test Info Log", { foo: "bar" });
    logger.warn("Test Warn Log");
    logger.error("Test Error Log", new Error("Something went wrong"));

    // Test 2: Request Cache
    console.log("\n2. Testing Request Cache");
    const url = "https://api.example.com/data";

    // Set cache
    requestCache.set(url, { cached: true }, undefined, 1000);
    console.log("Cache set.");

    // Get cache
    const cached = requestCache.get(url);
    console.log("Cache get:", cached);

    if (cached && (cached as any).cached) {
        console.log("✅ Cache get successful");
    } else {
        console.error("❌ Cache get failed");
    }

    // Test 3: Deduplication (simulated via requestCache.getOrSetInFlight)
    console.log("\n3. Testing Deduplication");
    fetchCount = 0; // Reset count
    mockDelay = 200; // Longer delay to ensure overlap

    const fetcher = async () => {
        return global.fetch(url);
    };

    const p1 = requestCache.getOrSetInFlight(url, undefined, fetcher);
    const p2 = requestCache.getOrSetInFlight(url, undefined, fetcher);
    const p3 = requestCache.getOrSetInFlight(url, undefined, fetcher);

    await Promise.all([p1, p2, p3]);

    console.log(`Fetch count: ${fetchCount}`);
    if (fetchCount === 1) {
        console.log("✅ Deduplication successful (only 1 network request)");
    } else {
        console.error(
            `❌ Deduplication failed (expected 1, got ${fetchCount})`,
        );
    }

    // Test 4: Performance Monitor
    console.log("\n4. Testing Performance Monitor");
    performanceMonitor.start("test-op");
    await new Promise((resolve) => setTimeout(resolve, 50));
    performanceMonitor.end("test-op");

    const stats = performanceMonitor.getStats();
    console.log("Performance Stats:", JSON.stringify(stats, null, 2));

    if (stats && stats.count > 0) {
        console.log("✅ Performance monitor recording successful");
    } else {
        console.error("❌ Performance monitor failed");
    }

    console.log("\n--- Tests Completed ---");
}

testOptimizations().catch(console.error);
