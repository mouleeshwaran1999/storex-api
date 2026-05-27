# Storex Backend API

Store Management System backend with MongoDB persistence.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
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

# OR use MongoDB Atlas connection string
```

### 4. Start Server
```bash
npm start
```

### 5. Verify Setup (Optional)
```bash
npm run verify
```

---

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md)** - Complete migration guide
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - Technical details

---

## 🔑 Default Credentials

| Role        | Username   | Password   |
|-------------|------------|------------|
| Super Admin | superadmin | superadmin |
| Admin       | admin      | admin      |
| Employee    | employee   | employee   |

---

## 📂 Project Structure

```
API/
├── config/
│   ├── database.js       # MongoDB connection
│   └── seed.js           # Auto-seeding
├── controllers/
│   ├── auth.controller.js
│   ├── employee.controller.js
│   ├── admin.controller.js
│   ├── superAdmin.controller.js
│   └── shop.controller.js
├── middleware/
│   └── auth.middleware.js
├── models/
│   ├── User.js
│   ├── Store.js
│   ├── Product.js
│   ├── Bill.js
│   └── StockLog.js
├── routes/
│   ├── auth.routes.js
│   ├── employee.routes.js
│   ├── admin.routes.js
│   ├── superAdmin.routes.js
│   └── shop.routes.js
├── scripts/
│   └── verify-migration.js
├── .env.example          # Environment template
└── server.js             # Entry point
```

---

## 🛠️ NPM Scripts

```bash
npm start          # Start production server
npm run dev        # Start with auto-reload (nodemon)
npm run verify     # Verify MongoDB setup
```

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/mobile
- `POST /api/auth/change-password` - Change password

### Employee (requires employee role)
- `GET /api/products` - Get store products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `POST /api/stock/adjust` - Adjust stock
- `GET /api/bills` - Get store bills
- `POST /api/bills` - Create bill
- `GET /api/shop` - Get store details

### Admin (requires admin role)
- `GET /api/admin/stores` - Get all stores
- `POST /api/admin/stores` - Create store
- `PUT /api/admin/stores/:id` - Update store
- `DELETE /api/admin/stores/:id` - Delete store
- `GET /api/admin/employees` - Get all employees
- `POST /api/admin/employees` - Create employee
- `PUT /api/admin/employees/:id` - Update employee
- `DELETE /api/admin/employees/:id` - Delete employee

### Super Admin (requires super_admin role)
- `GET /api/super-admin/admins` - Get all admins
- `POST /api/super-admin/admins` - Create admin
- `PUT /api/super-admin/admins/:id` - Update admin
- `DELETE /api/super-admin/admins/:id` - Delete admin

---

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:

```bash
Authorization: Bearer <your-jwt-token>
```

JWT payload structure:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "role": "employee",
  "storeId": "507f191e810c19729de860ea"
}
```

---

## 🗄️ Database Models

### User
```javascript
{
  name: String,
  username: String (unique),
  mobile: String (unique),
  passwordHash: String,
  role: "super_admin" | "admin" | "employee",
  storeId: ObjectId (required for employee)
}
```

### Store
```javascript
{
  name: String,
  address: String,
  gstNumber: String,
  phone: String,
  footerNote: String,
  logoUrl: String,
  adminId: ObjectId (required)
}
```

### Product
```javascript
{
  name: String,
  price: Number,
  stock: Number,
  storeId: ObjectId (required)
}
```

### Bill
```javascript
{
  storeId: ObjectId,
  items: Array,
  total: Number,
  customerName: String,
  createdBy: ObjectId
}
```

### StockLog
```javascript
{
  productId: ObjectId,
  storeId: ObjectId,
  change: Number,
  reason: String,
  updatedBy: ObjectId
}
```

---

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "employee", "password": "employee"}'
```

### Test Protected Endpoint
```bash
curl http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚀 Production Deployment

### Environment Variables
Set these in your hosting platform:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/storex
JWT_SECRET=generate-random-32-char-string
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com
```

### MongoDB Atlas Setup
1. Create cluster at https://cloud.mongodb.com
2. Create database user with read/write permissions
3. Whitelist your server IP (or 0.0.0.0/0 for all)
4. Get connection string and set as MONGO_URI
5. Ensure database name is included in connection string

### Deployment Platforms
- **Render**: Add environment variables in dashboard
- **Railway**: Use `.env` file or dashboard
- **Heroku**: Use `heroku config:set`
- **Vercel/Netlify**: Not recommended for Node.js backend

---

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod`
- Check MONGO_URI in .env file
- Verify network/firewall settings
- For Atlas: whitelist IP address

### Module Not Found
- Run `npm install`
- Delete node_modules and reinstall

### JWT Secret Missing
- Add JWT_SECRET to .env file
- Generate secure random string

### Seeding Not Running
- Delete database and restart server
- Or manually run: `node scripts/verify-migration.js`

---

## 📊 Database Seeding

The database is automatically seeded with default data on first run:
- 1 Super Admin
- 1 Admin  
- 1 Employee
- 1 Store (Main Street Shop)
- 2 Products (Product A, Product B)

To re-seed:
1. Drop database: `mongosh storex --eval "db.dropDatabase()"`
2. Restart server: `npm start`

---

## 🔄 Migration from Mock Data

This backend was migrated from in-memory mock data to MongoDB. The migration maintains:
- ✅ All API endpoints
- ✅ Same response formats
- ✅ JWT authentication
- ✅ Default credentials
- ✅ Frontend compatibility

Key changes:
- Numeric IDs → MongoDB ObjectIds (`_id`)
- In-memory arrays → MongoDB collections
- Synchronous code → Async/await patterns

See [MONGODB_MIGRATION.md](./MONGODB_MIGRATION.md) for full details.

---

## 📝 License

ISC

---

## 👥 Support

For issues or questions:
1. Check documentation files
2. Verify .env configuration
3. Run `npm run verify` to check setup
4. Check server logs for errors

---

**Built with ❤️ for store management**
