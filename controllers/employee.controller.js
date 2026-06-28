const Product = require('../models/Product'); // ← REPLACED: Mock data with MongoDB models
const Bill = require('../models/Bill');
const Store = require('../models/Store');
const StockLog = require('../models/StockLog');
const Customer = require('../models/Customer');

// ================================================================
// EMPLOYEE CONTROLLER
// ================================================================
// DATA ACCESS ENFORCEMENT:
// - All operations are scoped to req.user.storeId
// - Employee can ONLY access data belonging to their store
// - Backend enforces data isolation - frontend cannot bypass
// - Products, Bills, Stock are ALL filtered by storeId
// ================================================================

// ─── Products ──────────────────────────────────────────────────────────────

const getProducts = async (req, res) => {
  const { storeId } = req.user;
  const { page, limit } = req.query;
  if (page !== undefined) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 25));
    const total = await Product.countDocuments({ storeId });
    const data  = await Product.find({ storeId }).skip((p - 1) * l).limit(l);
    return res.json({ data, total, page: p, pages: Math.ceil(total / l), limit: l });
  }
  // Unpaginated — used by billing cart / stock dropdown
  const storeProducts = await Product.find({ storeId });
  res.json(storeProducts);
};

const createProduct = async (req, res) => {
  const { storeId } = req.user;
  const { name, price, stock = 0, gstPercent = 0 } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  if (price < 0 || stock < 0) {
    return res.status(400).json({ message: 'Price and stock must be non-negative' });
  }

  if (gstPercent < 0 || gstPercent > 100) {
    return res.status(400).json({ message: 'GST percent must be between 0 and 100' });
  }

  // Check for duplicate product name in the same store
  const existingProduct = await Product.findOne({ name: name.trim(), storeId });
  if (existingProduct) {
    return res.status(409).json({ message: 'A product with this name already exists in this store.' });
  }

  const newProduct = await Product.create({
    name,
    price: Number(price),
    stock: Number(stock),
    gstPercent: Number(gstPercent) || 0,
    storeId,
  });

  res.status(201).json(newProduct);
};

const updateProduct = async (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;
  const { name, price, stock, gstPercent } = req.body;

  // ← REPLACED: Mock array find with MongoDB query
  const product = await Product.findOne({ _id: id, storeId });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (name) product.name = name;
  if (price !== undefined) {
    if (price < 0) return res.status(400).json({ message: 'Price must be non-negative' });
    product.price = Number(price);
  }
  if (stock !== undefined) {
    if (stock < 0) return res.status(400).json({ message: 'Stock must be non-negative' });
    product.stock = Number(stock);
  }
  if (gstPercent !== undefined) {
    const gp = Number(gstPercent);
    if (isNaN(gp) || gp < 0 || gp > 100) {
      return res.status(400).json({ message: 'GST percent must be between 0 and 100' });
    }
    product.gstPercent = gp;
  }

  await product.save(); // ← CHANGED: Save to MongoDB

  res.json(product);
};

const deleteProduct = async (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;

  // ← REPLACED: Mock array splice with MongoDB deleteOne
  const result = await Product.deleteOne({ _id: id, storeId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Product not found' });
  }

  res.json({ message: 'Product deleted successfully' });
};

// ─── Stock ─────────────────────────────────────────────────────────────────

const adjustStock = async (req, res) => {
  const { storeId, userId } = req.user;
  const { productId, type, quantity } = req.body;

  if (!productId || !type || quantity === undefined) {
    return res.status(400).json({ message: 'productId, type (increase|decrease) and quantity are required' });
  }

  if (!['increase', 'decrease'].includes(type)) {
    return res.status(400).json({ message: 'type must be "increase" or "decrease"' });
  }

  const qty = Number(quantity);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'quantity must be a positive number' });
  }

  // ← REPLACED: Mock array find with MongoDB query
  const product = await Product.findOne({ _id: productId, storeId });
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const previousStock = product.stock;
  if (type === 'decrease') {
    if (product.stock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    product.stock -= qty;
  } else {
    product.stock += qty;
  }

  await product.save();

  // Log stock adjustment for audit trail
  const delta = type === 'increase' ? qty : -qty;
  await StockLog.create({
    productId: product._id,
    storeId,
    delta,
    previousStock,
    newStock: product.stock,
    reason: `Manual ${type}`,
    updatedBy: userId,
  });

  res.json({ message: 'Stock adjusted', product });
};

// ─── Bills ─────────────────────────────────────────────────────────────────

const getBills = async (req, res) => {
  const { storeId } = req.user;
  const { page, limit } = req.query;
  if (page !== undefined) {
    const p = Math.max(1, Number(page) || 1);
    const l = Math.min(100, Math.max(1, Number(limit) || 25));
    const total = await Bill.countDocuments({ storeId });
    const data  = await Bill.find({ storeId }).sort({ createdAt: -1 }).skip((p - 1) * l).limit(l);
    return res.json({ data, total, page: p, pages: Math.ceil(total / l), limit: l });
  }
  const storeBills = await Bill.find({ storeId }).sort({ createdAt: -1 });
  res.json(storeBills);
};

const payBill = async (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;
  const { paymentMode = 'cash' } = req.body;

  const bill = await Bill.findOne({ _id: Number(id), storeId: Number(storeId) });
  if (!bill) return res.status(404).json({ message: 'Bill not found' });
  if (bill.paid) return res.status(400).json({ message: 'Bill is already paid' });

  bill.paid = true;
  bill.paymentMode = paymentMode;
  await bill.save();
  res.json(bill);
};

const createBill = async (req, res) => {
  const { storeId, userId } = req.user;
  const {
    items,
    customerName = 'Walk-in Customer',
    customerId = null,
    paid = true,
    paymentMode = 'cash',
  } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items array is required' });
  }

  // ← REPLACED: Mock array find with MongoDB query
  const store = await Store.findById(storeId);
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }

  const billItems = [];
  let subtotal = 0;
  let gstTotal = 0;

  for (const item of items) {
    const { productId, quantity } = item;
    const qty = Number(quantity);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Each item must have a valid productId and quantity' });
    }

    // ← REPLACED: Mock array find with MongoDB query
    const product = await Product.findOne({ _id: productId, storeId });
    if (!product) {
      return res.status(404).json({ message: `Product ${productId} not found` });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
    }

    const previousStock = product.stock;
    product.stock -= qty;
    await product.save();

    const lineSubtotal = +(product.price * qty).toFixed(2);
    const gstPercent = product.gstPercent || 0;
    const gstAmount = +(lineSubtotal * gstPercent / 100).toFixed(2);

    subtotal += lineSubtotal;
    gstTotal += gstAmount;

    billItems.push({
      productId: product._id,
      productName: product.name,
      price: product.price,
      quantity: qty,
      gstPercent,
      gstAmount,
      subtotal: lineSubtotal,
    });

    // Log stock reduction caused by this sale
    await StockLog.create({
      productId: product._id,
      storeId,
      delta: -qty,
      previousStock,
      newStock: product.stock,
      reason: 'Sale - Bill creation',
      updatedBy: userId,
    });
  }

  const isPaid = paid !== false;
  const newBill = await Bill.create({
    storeId,
    storeName: store.name,
    storeAddress: store.address,
    storeGst: store.gstNumber,
    storePhone: store.phone || '',
    storeFooterNote: store.footerNote || '',
    storeLogo: store.logoUrl || null,
    createdBy: userId,
    customerName,
    customerId: customerId ? Number(customerId) : null,
    items: billItems,
    subtotal: +subtotal.toFixed(2),
    gstTotal: +gstTotal.toFixed(2),
    total: +(subtotal + gstTotal).toFixed(2),
    paid: isPaid,
    paymentMode: isPaid ? (paymentMode || 'cash') : 'credit',
  });

  res.status(201).json(newBill);
};

// ─── Customers ─────────────────────────────────────────────────────────────

const getCustomers = async (req, res) => {
  const { storeId } = req.user;
  const customers = await Customer.find({ storeId: Number(storeId) }).sort({ name: 1 });

  // Aggregate outstanding (unpaid) bill totals per customer
  const unpaidAgg = await Bill.aggregate([
    { $match: { storeId: Number(storeId), paid: false, customerId: { $ne: null } } },
    { $group: { _id: '$customerId', outstanding: { $sum: '$total' }, count: { $sum: 1 } } },
  ]);
  const outstandingMap = {};
  const countMap = {};
  unpaidAgg.forEach((r) => {
    outstandingMap[r._id] = r.outstanding;
    countMap[r._id] = r.count;
  });

  const result = customers.map((c) => ({
    ...c.toJSON(),
    outstandingAmount: outstandingMap[c._id] || 0,
    unpaidBillsCount: countMap[c._id] || 0,
  }));
  res.json(result);
};

const createCustomer = async (req, res) => {
  const { storeId, adminId } = req.user;
  const { name, mobile = '' } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ message: 'Customer name is required' });
  }

  const existing = await Customer.findOne({ name: name.trim(), storeId });
  if (existing) {
    return res.status(409).json({ message: 'A customer with this name already exists' });
  }

  const newCustomer = await Customer.create({
    name: name.trim(),
    mobile: mobile.trim(),
    storeId: Number(storeId),
    adminId: Number(adminId),
  });
  res.status(201).json(newCustomer);
};

const updateCustomer = async (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;
  const { name, mobile } = req.body;

  const customer = await Customer.findOne({ _id: Number(id), storeId: Number(storeId) });
  if (!customer) return res.status(404).json({ message: 'Customer not found' });

  if (name) {
    const dup = await Customer.findOne({
      name: name.trim(), storeId: Number(storeId), _id: { $ne: Number(id) },
    });
    if (dup) return res.status(409).json({ message: 'A customer with this name already exists' });
    customer.name = name.trim();
  }
  if (mobile !== undefined) customer.mobile = mobile.trim();

  await customer.save();
  res.json(customer);
};

const deleteCustomer = async (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;

  const result = await Customer.deleteOne({ _id: Number(id), storeId: Number(storeId) });
  if (result.deletedCount === 0) {
    return res.status(404).json({ message: 'Customer not found' });
  }
  res.json({ message: 'Customer deleted successfully' });
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getBills,
  createBill,
  payBill,
  getCustomers,
  createCustomer,
  updateCustomer,
  deleteCustomer,
};
