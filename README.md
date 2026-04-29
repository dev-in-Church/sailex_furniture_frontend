# Sailex Furnitures - E-commerce Platform

A full-stack furniture e-commerce platform built with Next.js (frontend) and Express.js (backend), featuring M-Pesa and Stripe payment integrations.

## Project Structure

```
sailex-furnitures/
├── app/                    # Next.js storefront (App Router)
│   ├── (store)/           # Customer-facing pages
│   │   ├── page.tsx       # Homepage
│   │   ├── products/      # Product listing & details
│   │   ├── cart/          # Shopping cart
│   │   ├── checkout/      # Checkout flow
│   │   ├── auth/          # Login & Register
│   │   ├── account/       # Customer account
│   │   └── categories/    # Category pages
│   └── layout.tsx
├── admin/                  # Admin dashboard (separate deployment)
│   ├── page.tsx           # Dashboard overview
│   ├── products/          # Product management
│   ├── orders/            # Order management
│   ├── customers/         # Customer management
│   ├── categories/        # Category management
│   ├── analytics/         # Sales analytics
│   └── settings/          # Store settings
├── backend/               # Express.js API server
│   ├── src/
│   │   ├── index.js       # Server entry point
│   │   ├── config/        # Database configuration
│   │   ├── middlewares/   # Auth middleware
│   │   └── routes/        # API routes
│   └── package.json
├── components/            # Shared React components
├── lib/                   # Utilities & contexts
├── scripts/               # Database migration scripts
└── public/                # Static assets
```

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or pnpm
- Stripe Account (for card payments)
- Safaricom Daraja API Account (for M-Pesa)
- Google Cloud Console Project (for Google OAuth)

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
pnpm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Database Setup

Create a PostgreSQL database and run the migration scripts:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE sailex_db;

# Connect to database
\c sailex_db

# Run migration scripts in order
\i scripts/001-create-tables.sql
\i scripts/002-seed-data.sql
\i scripts/003-add-google-oauth.sql
```

Or use a connection string with psql:

```bash
psql "postgresql://user:password@host:5432/sailex_db" -f scripts/001-create-tables.sql
psql "postgresql://user:password@host:5432/sailex_db" -f scripts/002-seed-data.sql
psql "postgresql://user:password@host:5432/sailex_db" -f scripts/003-add-google-oauth.sql
```

### 3. Environment Configuration

#### Backend (.env)

Copy the example file and fill in your credentials:

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/sailex_db

# JWT (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-min-32-characters
JWT_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Stripe (from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# M-Pesa Daraja API (from https://developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=your-consumer-key
MPESA_CONSUMER_SECRET=your-consumer-secret
MPESA_BUSINESS_SHORT_CODE=174379
MPESA_PASS_KEY=your-pass-key
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox

# Server
PORT=5000
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local)

Create `.env.local` in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. Select **Web application**
6. Add authorized JavaScript origins:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
7. Add authorized redirect URIs:
   - `http://localhost:3000` (development)
   - `https://your-domain.com` (production)
8. Copy the Client ID to both frontend and backend env files

### 5. Stripe Setup

1. Create account at [Stripe](https://stripe.com)
2. Get API keys from [Dashboard](https://dashboard.stripe.com/apikeys)
3. For webhooks (optional for local dev):
   - Install Stripe CLI: `brew install stripe/stripe-cli/stripe`
   - Run: `stripe listen --forward-to localhost:5000/api/payments/stripe/webhook`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 6. M-Pesa Daraja Setup

1. Create account at [Safaricom Developer Portal](https://developer.safaricom.co.ke)
2. Create a new app and get credentials
3. For sandbox testing, use the test credentials provided
4. For production:
   - Apply for production access
   - Complete the go-live process
   - Update `MPESA_ENVIRONMENT=production`

### 7. Running the Application

#### Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api
- Admin Dashboard: http://localhost:3000/admin

#### Production

```bash
# Build frontend
pnpm build

# Start frontend
pnpm start

# Start backend (use PM2 or similar)
cd backend
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Customer login
- `POST /api/auth/google` - Google OAuth login
- `POST /api/auth/admin/login` - Admin login
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products (with filters)
- `GET /api/products/:id` - Get product details
- `GET /api/products/featured` - Get featured products

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/:slug` - Get category with products

### Cart
- `GET /api/cart` - Get cart items
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:productId` - Update item quantity
- `DELETE /api/cart/items/:productId` - Remove item
- `POST /api/cart/merge` - Merge guest cart after login

### Orders
- `POST /api/orders` - Create new order
- `GET /api/orders` - List customer orders
- `GET /api/orders/:id` - Get order details

### Payments
- `POST /api/payments/mpesa/stkpush` - Initiate M-Pesa STK Push
- `POST /api/payments/mpesa/callback` - M-Pesa callback webhook
- `GET /api/payments/mpesa/status/:checkoutRequestId` - Check payment status
- `POST /api/payments/stripe/create-session` - Create Stripe checkout
- `POST /api/payments/stripe/webhook` - Stripe webhook

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/products` - List all products
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/orders` - List all orders
- `PUT /api/admin/orders/:id/status` - Update order status
- `GET /api/admin/customers` - List customers
- `GET /api/admin/categories` - List categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

## Default Admin Account

After running the seed script, use these credentials:

- **Email:** admin@sailex.co.ke
- **Password:** admin123456

**Important:** Change this password immediately in production!

## Deployment

### Frontend (Vercel)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Backend

Deploy to any Node.js hosting (Railway, Render, DigitalOcean, AWS, etc.):

1. Set environment variables
2. Ensure PostgreSQL is accessible
3. Run database migrations
4. Start with `npm start`

### Admin Dashboard

The admin dashboard is in the `/admin` folder. For separate deployment:

1. Build as a separate Next.js app
2. Configure `basePath` in next.config.mjs if needed
3. Deploy to a separate domain (e.g., admin.sailex.co.ke)

## Features

### Customer Features
- Browse products by category
- Search and filter products
- Shopping cart (persists for guests)
- Guest checkout or account checkout
- M-Pesa STK Push payment
- Stripe card payment
- Order tracking
- Customer account management
- Google OAuth sign-in

### Admin Features
- Dashboard with sales overview
- Product management (CRUD)
- Category management
- Order management with status updates
- Customer management
- Sales analytics
- Inventory tracking
- Low stock alerts

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS, shadcn/ui
- **Backend:** Express.js, Node.js
- **Database:** PostgreSQL
- **Authentication:** JWT, Google OAuth
- **Payments:** Stripe, M-Pesa Daraja API
- **State Management:** React Context, SWR

## License

MIT License
