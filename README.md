# 🚀 BizFlow — Local Business Automation Platform

A complete, production-ready web application for automating small businesses in India — shops, salons, and restaurants.

Developed by Rohit Arabale.

---

## ✨ Features

### 🏪 Core Modules
| Module | Description |
|--------|-------------|
| **WhatsApp Chatbot** | Rule-based auto-reply system with live simulator |
| **Inventory Management** | Full CRUD, stock tracking, low-stock alerts, analytics |
| **Appointment Booking** | Calendar UI, time slots, public booking page |
| **Digital Menu + Orders** | QR-accessible menu, cart, order placement & tracking |
| **Admin Dashboard** | Revenue charts, stats, notifications |

### 🔐 Auth & Access
- JWT-based login/signup
- Multi-business support (each business is isolated)
- Role-based access: **Admin** and **Staff**

### 📱 Public Facing Pages
- `/menu/:slug` — Digital menu with cart and order placement
- `/book/:slug` — Appointment booking for salons/services
- `/track/:orderNumber` — Order tracking

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens) |
| Charts | Recharts |
| WhatsApp | Twilio API (mock-ready) |

---

## 📁 Project Structure

```
bizflow/
├── backend/
│   ├── config/         # DB connection
│   ├── controllers/    # Route logic
│   ├── middleware/     # Auth, error handling
│   ├── models/         # Mongoose schemas
│   ├── routes/         # Express routers
│   ├── seed/           # Demo data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js
│
└── frontend/
    ├── src/
    │   ├── components/ # Layout, shared UI
    │   ├── context/    # Auth context
    │   ├── pages/      # All page components
    │   └── utils/      # Axios instance
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)

### 1. Clone and Setup

```bash
git clone <repo-url>
cd bizflow
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and secrets
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Seed Demo Data

```bash
cd ../backend
npm run seed
```

This creates 3 demo businesses with products, orders, appointments, and WhatsApp rules.

### 5. Start Development

**Terminal 1 – Backend:**
```bash
cd backend
npm run dev
# Runs on http://localhost:5000
```

**Terminal 2 – Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 6. Login with Demo Accounts

| Business | Email | Password |
|----------|-------|----------|
| 🍛 Spice Garden Restaurant | ramesh@spicegarden.com | password123 |
| 💅 Glamour Salon | priya@glamoursalon.com | password123 |
| 🛒 Daily Needs Shop | suresh@dailyneeds.com | password123 |

---

## 🌐 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register business + admin |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/staff` | Create staff (admin only) |
| GET | `/api/auth/staff` | List staff |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List products |
| POST | `/api/inventory` | Create product |
| PUT | `/api/inventory/:id` | Update product |
| DELETE | `/api/inventory/:id` | Delete product |
| PUT | `/api/inventory/:id/stock` | Update stock |
| GET | `/api/inventory/analytics` | Stats + low stock |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List orders (admin) |
| POST | `/api/orders` | Create order (admin) |
| PUT | `/api/orders/:id/status` | Update status |
| POST | `/api/orders/public/:slug` | Place public order |
| GET | `/api/orders/track/:orderNumber` | Public order tracking |

### Appointments
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/appointments` | List appointments |
| POST | `/api/appointments` | Create appointment |
| GET | `/api/appointments/slots/:date` | Available slots |
| POST | `/api/appointments/public/:slug` | Public booking |
| GET | `/api/appointments/public/slots/:slug/:date` | Public slots |

### WhatsApp
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whatsapp/rules` | List rules |
| POST | `/api/whatsapp/rules` | Create rule |
| PUT | `/api/whatsapp/rules/:id` | Update rule |
| POST | `/api/whatsapp/simulate` | Test chatbot |
| POST | `/api/whatsapp/webhook` | Twilio webhook |
| GET | `/api/whatsapp/stats` | Chat stats |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Overview stats + charts |

---

## 🔗 Public URLs (after seed)

| Page | URL |
|------|-----|
| Restaurant Menu | `http://localhost:5173/menu/spice-garden-restaurant-<id>` |
| Salon Booking | `http://localhost:5173/book/glamour-salon-spa-<id>` |
| Order Tracking | `http://localhost:5173/track/ORD-0001` |

> Find exact slugs in the Settings page after login.

---

## 📱 WhatsApp Integration (Twilio)

1. Create free account at [twilio.com](https://twilio.com)
2. Go to Messaging → Try it out → Send a WhatsApp message
3. Join the sandbox by texting the join code
4. Set webhook URL: `https://your-domain.com/api/whatsapp/webhook?business=your-slug`
5. Add credentials to `backend/.env`

---

## 🚀 Production Deployment

### Backend (Railway / Render)
```bash
# Set env vars in dashboard
# Build: npm install
# Start: node server.js
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL env var if backend is on different domain
```

### MongoDB Atlas
- Use free M0 cluster
- Whitelist your server IP
- Update MONGO_URI in .env

---

## 🔮 Future Improvements

- [ ] Real-time order updates with WebSockets
- [ ] Razorpay payment integration
- [ ] SMS notifications (Twilio SMS)
- [ ] QR code generator for menu/booking
- [ ] Customer loyalty program
- [ ] Multiple staff scheduling
- [ ] Invoice/receipt PDF generation
- [ ] Multi-language support (Hindi, Marathi)
- [ ] Analytics exports (CSV/Excel)
- [ ] Mobile app (React Native)

---

## 📄 License

MIT — Built for India's 60+ million small businesses 🇮🇳
