import { Router, type IRouter } from "express";
import { db, ordersTable, productsTable } from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetTopProductsResponse,
} from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayOrders = allOrders.filter(
    (o) => o.createdAt >= todayStart
  );

  const totalSalesToday = todayOrders.reduce(
    (sum, o) => sum + Number(o.totalAmount),
    0
  );

  // Find best selling item across all orders
  const itemCounts = new Map<string, number>();
  for (const order of allOrders) {
    const items = order.items as Array<{ productName: string; quantity: number }>;
    for (const item of items) {
      itemCounts.set(item.productName, (itemCounts.get(item.productName) ?? 0) + item.quantity);
    }
  }

  let bestSellingItem: string | null = null;
  let maxCount = 0;
  for (const [name, count] of itemCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestSellingItem = name;
    }
  }

  res.json(
    GetDashboardSummaryResponse.parse({
      totalSalesToday,
      totalOrdersToday: todayOrders.length,
      totalOrdersAllTime: allOrders.length,
      bestSellingItem,
    })
  );
});

router.get("/dashboard/top-products", async (req, res): Promise<void> => {
  const allOrders = await db.select().from(ordersTable);
  const products = await db.select().from(productsTable);

  const productIdToId = new Map(products.map((p) => [p.name, p.id]));
  const productStats = new Map<
    number,
    { productName: string; totalQuantity: number; totalRevenue: number }
  >();

  for (const order of allOrders) {
    const items = order.items as Array<{
      productId: number;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
    for (const item of items) {
      const existing = productStats.get(item.productId);
      if (existing) {
        existing.totalQuantity += item.quantity;
        existing.totalRevenue += item.unitPrice * item.quantity;
      } else {
        productStats.set(item.productId, {
          productName: item.productName,
          totalQuantity: item.quantity,
          totalRevenue: item.unitPrice * item.quantity,
        });
      }
    }
  }

  const topProducts = Array.from(productStats.entries())
    .map(([productId, stats]) => ({ productId, ...stats }))
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, 10);

  res.json(GetTopProductsResponse.parse(topProducts));
});

export default router;
