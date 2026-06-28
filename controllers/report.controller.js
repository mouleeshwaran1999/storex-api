const Store = require('../models/Store');
const Product = require('../models/Product');
const Bill = require('../models/Bill');

// ================================================================
// REPORT CONTROLLER
// ================================================================
// Builds a date-range scoped report for a given store. Stock is
// always the *current* snapshot (not date-bound); bills, revenue,
// GST, items sold and top products are computed within the
// supplied date range.
//
// Query params (both optional, ISO date strings):
//   ?start=YYYY-MM-DD       inclusive lower bound
//   ?end=YYYY-MM-DD         inclusive upper bound (end-of-day)
//
// Used by:
//   - GET /api/report                   (employee, own store)
//   - GET /api/admin/stores/:id/report  (admin, any store they own)
// ================================================================

const parseRange = (query) => {
  const { start, end } = query || {};
  const range = {};
  if (start) {
    const s = new Date(start);
    if (!isNaN(s)) {
      s.setHours(0, 0, 0, 0);
      range.start = s;
    }
  }
  if (end) {
    const e = new Date(end);
    if (!isNaN(e)) {
      e.setHours(23, 59, 59, 999);
      range.end = e;
    }
  }
  return range;
};

const buildStoreReport = async (storeId, range = {}) => {
  const store = await Store.findById(storeId);
  if (!store) return null;

  // ─── Stock (current snapshot) ───────────────────────────────
  const products = await Product.find({ storeId }).sort({ stock: 1 });
  const lowStock = products.filter(p => p.stock <= 5);
  const stockValue = products.reduce((s, p) => s + p.price * p.stock, 0);

  // ─── Bills (within range) ──────────────────────────────────
  const billFilter = { storeId };
  if (range.start || range.end) {
    billFilter.createdAt = {};
    if (range.start) billFilter.createdAt.$gte = range.start;
    if (range.end) billFilter.createdAt.$lte = range.end;
  }
  const bills = await Bill.find(billFilter).sort({ createdAt: -1 });

  let totalRevenue = 0;
  let totalGst = 0;
  let totalItemsSold = 0;
  const productSales = new Map();

  for (const b of bills) {
    totalRevenue += b.total || 0;
    totalGst += b.gstTotal || 0;
    for (const it of b.items || []) {
      totalItemsSold += it.quantity || 0;
      const key = String(it.productId);
      const prev = productSales.get(key) || { name: it.productName, qty: 0, revenue: 0 };
      prev.qty += it.quantity || 0;
      prev.revenue += (it.subtotal || 0) + (it.gstAmount || 0);
      productSales.set(key, prev);
    }
  }

  const topProducts = [...productSales.entries()]
    .map(([id, v]) => ({ id, ...v }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentBills = bills.slice(0, 10).map(b => ({
    id: b._id,
    customerName: b.customerName,
    items: (b.items || []).length,
    total: b.total,
    createdAt: b.createdAt,
  }));

  // ─── Outstanding (unpaid) bills ──────────────────────────────
  const unpaidBills = await Bill.find({ storeId, paid: false }).sort({ createdAt: -1 });
  const totalOutstanding = unpaidBills.reduce((s, b) => s + (b.total || 0), 0);

  return {
    store: {
      id: store._id,
      name: store.name,
      address: store.address,
      gstNumber: store.gstNumber,
      phone: store.phone || '',
    },
    range: {
      start: range.start || null,
      end: range.end || null,
    },
    summary: {
      totalBills: bills.length,
      totalRevenue: +totalRevenue.toFixed(2),
      totalGst: +totalGst.toFixed(2),
      totalItemsSold,
      productCount: products.length,
      lowStockCount: lowStock.length,
      stockValue: +stockValue.toFixed(2),
      unpaidBillsCount: unpaidBills.length,
      totalOutstanding: +totalOutstanding.toFixed(2),
    },
    stock: products.map(p => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
      unit: p.unit,
      price: p.price,
      gstPercent: p.gstPercent || 0,
    })),
    lowStock: lowStock.map(p => ({
      id: p._id,
      name: p.name,
      stock: p.stock,
      unit: p.unit,
    })),
    topProducts,
    recentBills,
    unpaidBills: unpaidBills.slice(0, 50).map(b => ({
      id: b._id,
      customerName: b.customerName,
      customerId: b.customerId,
      items: (b.items || []).length,
      total: b.total,
      createdAt: b.createdAt,
    })),
    generatedAt: new Date(),
  };
};

// Employee — own store
const getMyStoreReport = async (req, res) => {
  const { storeId } = req.user;
  if (!storeId) return res.status(400).json({ message: 'No store assigned' });
  const report = await buildStoreReport(storeId, parseRange(req.query));
  if (!report) return res.status(404).json({ message: 'Store not found' });
  res.json(report);
};

// Admin — any store they own
const getStoreReportForAdmin = async (req, res) => {
  const { id } = req.params;
  const store = await Store.findById(id);
  if (!store) return res.status(404).json({ message: 'Store not found' });
  if (String(store.adminId) !== String(req.user.userId)) {
    return res.status(403).json({ message: 'Access denied: store does not belong to you' });
  }
  const report = await buildStoreReport(id, parseRange(req.query));
  res.json(report);
};

module.exports = { getMyStoreReport, getStoreReportForAdmin };
