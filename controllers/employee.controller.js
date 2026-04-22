const { products, bills, stores, generateId } = require('../data/mockData');

// ─── Products ──────────────────────────────────────────────────────────────

const getProducts = (req, res) => {
  const { storeId } = req.user;
  const storeProducts = products.filter((p) => p.storeId === storeId);
  res.json(storeProducts);
};

const createProduct = (req, res) => {
  const { storeId } = req.user;
  const { name, price, stock = 0 } = req.body;

  if (!name || price === undefined) {
    return res.status(400).json({ message: 'Name and price are required' });
  }

  if (price < 0 || stock < 0) {
    return res.status(400).json({ message: 'Price and stock must be non-negative' });
  }

  const newProduct = {
    id: generateId('product'),
    name,
    price: Number(price),
    stock: Number(stock),
    storeId,
  };

  products.push(newProduct);
  res.status(201).json(newProduct);
};

const updateProduct = (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;
  const { name, price, stock } = req.body;

  const idx = products.findIndex((p) => p.id === id && p.storeId === storeId);
  if (idx === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (name) products[idx].name = name;
  if (price !== undefined) {
    if (price < 0) return res.status(400).json({ message: 'Price must be non-negative' });
    products[idx].price = Number(price);
  }
  if (stock !== undefined) {
    if (stock < 0) return res.status(400).json({ message: 'Stock must be non-negative' });
    products[idx].stock = Number(stock);
  }

  res.json(products[idx]);
};

const deleteProduct = (req, res) => {
  const { storeId } = req.user;
  const { id } = req.params;

  const idx = products.findIndex((p) => p.id === id && p.storeId === storeId);
  if (idx === -1) {
    return res.status(404).json({ message: 'Product not found' });
  }

  products.splice(idx, 1);
  res.json({ message: 'Product deleted successfully' });
};

// ─── Stock ─────────────────────────────────────────────────────────────────

const adjustStock = (req, res) => {
  const { storeId } = req.user;
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

  const product = products.find((p) => p.id === productId && p.storeId === storeId);
  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (type === 'decrease') {
    if (product.stock < qty) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }
    product.stock -= qty;
  } else {
    product.stock += qty;
  }

  res.json({ message: 'Stock adjusted', product });
};

// ─── Bills ─────────────────────────────────────────────────────────────────

const getBills = (req, res) => {
  const { storeId } = req.user;
  const storeBills = bills.filter((b) => b.storeId === storeId);
  res.json(storeBills);
};

const createBill = (req, res) => {
  const { storeId, userId } = req.user;
  const { items, customerName = 'Walk-in Customer' } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'items array is required' });
  }

  const store = stores.find((s) => s.id === storeId);
  if (!store) {
    return res.status(404).json({ message: 'Store not found' });
  }

  const billItems = [];
  let total = 0;

  for (const item of items) {
    const { productId, quantity } = item;
    const qty = Number(quantity);

    if (!productId || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Each item must have a valid productId and quantity' });
    }

    const product = products.find((p) => p.id === productId && p.storeId === storeId);
    if (!product) {
      return res.status(404).json({ message: `Product ${productId} not found` });
    }

    if (product.stock < qty) {
      return res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
    }

    product.stock -= qty;
    const subtotal = product.price * qty;
    total += subtotal;

    billItems.push({
      productId,
      productName: product.name,
      price: product.price,
      quantity: qty,
      subtotal,
    });
  }

  const newBill = {
    id: generateId('bill'),
    storeId,
    storeName: store.name,
    storeAddress: store.address,
    storeGst: store.gst,
    storePhone: store.phone || '',
    storeFooterNote: store.footerNote || '',
    storeLogo: store.logo || null,
    createdBy: userId,
    customerName,
    items: billItems,
    total,
    createdAt: new Date().toISOString(),
  };

  bills.push(newBill);
  res.status(201).json(newBill);
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
  getBills,
  createBill,
};
