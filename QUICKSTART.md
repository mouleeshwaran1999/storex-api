# Quick Start - MongoDB Setup

## 🚀 5-Minute Setup

### 1. Install Mongoose
```bash
cd API
npm install
```

### 2. Create .env File
```bash
# Copy template
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/storex
JWT_SECRET=your-secret-key-here
PORT=5000
FRONTEND_URL=*
```

### 3. Start MongoDB
```bash
# Local MongoDB
mongod

# OR use MongoDB Atlas connection string in .env
```

### 4. Start Backend
```bash
npm start
```

You should see:
```
✅ MongoDB connected successfully
🌱 Seeding database with default data...
🎉 Database seeding completed successfully!
Server running on port 5000
```

---

## 🔑 Default Login Credentials

| Role        | Username   | Password   |
|-------------|------------|------------|
| Super Admin | superadmin | superadmin |
| Admin       | admin      | admin      |
| Employee    | employee   | employee   |

---

## 📚 Models at a Glance

### User
```javascript
{
  name, username, mobile, passwordHash,
  role: "super_admin" | "admin" | "employee",
  storeId: ObjectId (required for employee)
}
```

### Store
```javascript
{
  name, address, gstNumber, phone,
  footerNote, logoUrl,
  adminId: ObjectId (required)
}
```

### Product
```javascript
{
  name, price, stock,
  storeId: ObjectId (required)
}
```

### Bill
```javascript
{
  storeId, storeName, storeAddress, storeGst,
  items: [{ productId, productName, price, quantity, subtotal }],
  total, customerName,
  createdBy: ObjectId
}
```

### StockLog
```javascript
{
  productId, storeId,
  change: Number,
  reason, updatedBy
}
```

---

## 🧪 Quick Test

```bash
# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "employee", "password": "employee"}'

# Copy the token from response, then:
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🐛 Troubleshooting

### "MONGO_URI is not defined"
→ Create `.env` file with `MONGO_URI=mongodb://localhost:27017/storex`

### "Connection refused"
→ Start MongoDB: `mongod`

### "Module not found: mongoose"
→ Run: `npm install`

---

## 📂 File Structure

```
API/
├── config/
│   ├── database.js    # MongoDB connection
│   └── seed.js        # Auto-seeding
├── models/
│   ├── User.js
│   ├── Store.js
│   ├── Product.js
│   ├── Bill.js
│   └── StockLog.js
├── controllers/       # Updated to use MongoDB
├── .env.example       # Template
└── .env              # Your config (create this)
```

---

## 🌐 Production Deployment

### MongoDB Atlas
1. Create cluster at https://cloud.mongodb.com
2. Create database user
3. Whitelist IP: 0.0.0.0/0
4. Get connection string
5. Set in .env: `MONGO_URI=mongodb+srv://...`

### Environment Variables
```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/storex
JWT_SECRET=generate-random-32-char-string
PORT=5000
FRONTEND_URL=https://your-frontend.com
```

---

## ✅ What Changed?

- ❌ Mock data arrays → ✅ MongoDB collections
- ❌ In-memory storage → ✅ Persistent database
- ❌ Numeric IDs → ✅ MongoDB ObjectIds (`_id`)

## ✅ What Stayed the Same?

- ✅ All API endpoints
- ✅ JWT authentication
- ✅ Response formats
- ✅ Default credentials
- ✅ Frontend compatibility

---

## 📖 Full Documentation

- `MONGODB_MIGRATION.md` - Complete migration guide
- `MIGRATION_SUMMARY.md` - Detailed summary

---

**Need help?** Check the logs for MongoDB connection errors and verify your `.env` file.
