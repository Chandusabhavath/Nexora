# NEXORA — Deployment & Production Guide

## 1. Local Run Instructions
1. **Server**:
   ```bash
   cd server
   npm start
   ```
   Server starts at `http://localhost:5000` serving both the REST API and the compiled React production frontend.

2. **Frontend Development Server** (for live hot-reload):
   ```bash
   cd client
   npm run dev
   ```
   Runs at `http://localhost:5173` with proxy pointing to `http://localhost:5000`.

3. **Run Automated Test Suite**:
   ```bash
   cd server
   npm test
   ```
   Executes all 23 unit, lifecycle, and E2E integration tests.

## 2. Cloud Deployment (Render / Railway / Heroku / AWS)

### Environment Variables
Configure the following environment variables in your hosting provider:
```ini
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/nexora?retryWrites=true&w=majority
JWT_SECRET=your_super_strong_production_jwt_secret_key
CORS_ORIGIN=https://your-nexora-domain.com
ADMIN_DEFAULT_EMAIL=admin@nexora.com
ADMIN_DEFAULT_PASSWORD=YourStrongAdminPassword2026!
```

### Build & Start Commands
- **Root Build Command**:
  ```bash
  cd client && npm install && npm run build && cd ../server && npm install
  ```
- **Start Command**:
  ```bash
  cd server && node src/server.js
  ```

## 3. Seed Credentials (Out of the Box)
- **Administrator Account**:
  - Email: `admin@nexora.com`
  - Password: `NexoraAdmin2026!`
- **Customer Account**:
  - Email: `aarav@example.com`
  - Password: `CustomerPass123!`
- **Provider Accounts**:
  - Email: `rajesh.electric@example.com` (Electrician)
  - Password: `ProviderPass123!`
  - Email: `sunita.cleaning@example.com` (Home Cleaning)
  - Password: `ProviderPass123!`
