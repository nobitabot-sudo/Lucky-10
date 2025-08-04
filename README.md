# Lucky 10 Backend

A Node.js backend for the Lucky 10 gambling game with Supabase integration.

## Features

- User authentication (register/login) with JWT
- Password hashing with bcrypt
- CORS enabled for cross-origin requests
- Wallet management
- Betting system
- Admin dashboard functionality
- Real-time game rounds
- Secure API endpoints

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret
PORT=3000
NODE_ENV=production
```

3. Run the Supabase migration to create tables:
   - Copy the SQL from `supabase/migrations/create_tables.sql`
   - Run it in your Supabase SQL editor

4. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (authenticated)
- `GET /api/users/referral` - Get referral link (authenticated)

### Game
- `GET /api/wallet` - Get wallet balance (authenticated)
- `POST /api/bets` - Place a bet (authenticated)
- `GET /api/round/timer` - Get current round timer (authenticated)
- `GET /api/results/latest` - Get latest results (authenticated)

### Admin
- `GET /api/admin/bets` - Get active bets (admin only)
- `POST /api/admin/result` - Set result manually (admin only)
- `POST /api/admin/result/auto` - Generate auto result (admin only)
- `GET /api/admin/leaderboard` - Get leaderboard (admin only)
- `POST /api/admin/wallet` - Manage user wallet (admin only)

## Deployment

This backend is designed to be deployed on Render.com or similar platforms.
# Lucky-10
