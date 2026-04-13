# Kartify Backend Setup

## Prerequisites
- Node.js installed
- MongoDB installed (local) or MongoDB Atlas account

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Configure your `.env` file:
- For local MongoDB: `MONGO_URI=mongodb://localhost:27017/kartify`
- For MongoDB Atlas: Get your connection string from Atlas dashboard
- Set a strong `JWT_SECRET` for production

4. Start the development server:
```bash
npm run dev
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | Required |
| `PORT` | Server port | 5000 |
| `JWT_SECRET` | JWT signing secret | Required for auth |
| `NODE_ENV` | Environment mode | development |

## MongoDB Setup

### Local MongoDB
1. Install MongoDB Community Server
2. Start MongoDB service
3. Use the default URI in `.env`

### MongoDB Atlas (Recommended for collaboration)
1. Create free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Add your IP to whitelist (or use 0.0.0.0/0 for any IP)
4. Get connection string and update `.env`

## API Endpoints

The API runs on `http://localhost:5000` by default.

- Authentication: `/api/auth`
- Shops: `/api/shops`
- Products: `/api/products`
- Orders: `/api/orders`
- Users: `/api/users`
- Cart: `/api/cart`
- Reviews: `/api/reviews`
