const { query } = require('./config/db');
const SalesRepository = require('./api/sales/sales.repository');

async function test() {
  const repo = new SalesRepository();
  const db = { query };
  try {
    console.log("🧪 Testing paginated sales query...");
    const result = await repo.getPaginatedBytenantId(db, 1, { page: 1, page_size: 10 });
    console.log("✅ Result:", result);
  } catch (err) {
    console.error("❌ Test failed:", err.message);
  }
}

test();
