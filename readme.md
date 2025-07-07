# Gas Backend Main

This is the backend service for the Gas Delivery platform. It provides REST APIs for user management, order processing, payments, chat, notifications, and more. The backend is built with Node.js, TypeScript, Express, MongoDB, and Kafka.

## Features

- User authentication (JWT, roles)
- Order and delivery management
- Payment processing (Stripe)
- Real-time chat and notifications (Socket.IO)
- Kafka integration for messaging
- File uploads (S3 compatible)
- Admin and user dashboards

## Project Structure

```
src/
  app.ts                # Express app setup
  server.ts             # Server entry point
  socket.ts             # Socket.IO integration
  app/                  # Main application modules
    modules/            # Feature modules (auth, user, order, payments, etc.)
    middleware/         # Express middlewares
    utils/              # Utility functions (S3, etc.)
public/                 # Static files
docker-compose.yml      # Docker Compose for Kafka/Zookeeper
.env                    # Environment variables
```

## Prerequisites

- Node.js (v16+)
- MongoDB
- Docker & Docker Compose (for Kafka/Zookeeper)

## Installation

1. **Clone the repository:**
   ```sh
   git clone <your-repo-url>
   cd gas-backend-main
   ```

2. **Install dependencies:**
   ```sh
   npm install
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in your values.

4. **Start MongoDB** (if not using a managed service):
   ```sh
   # Example for local MongoDB
   mongod --dbpath ./data/db
   ```

5. **Start Kafka and Zookeeper (Docker Compose):**
   ```sh
   docker-compose up -d
   ```

6. **Run the backend server:**
   ```sh
   npm run build
   npm start
   ```

## Running in Development

```sh
npm run dev
```

## Running Tests

```sh
npm test
```

## API Documentation

- The API follows RESTful conventions.
- See the `src/app/modules` directory for available endpoints.

## Docker Compose (Kafka/Zookeeper)

- `docker-compose.yml` sets up Kafka and Zookeeper.
- Kafka broker is available at `localhost:9092`.

## Useful Scripts

- `npm run build` – Compile TypeScript
- `npm run dev` – Start server in development mode
- `npm start` – Start server in production mode

## License

MIT