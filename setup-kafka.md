# Docker & Kafka Setup Guide (Ubuntu)

This guide helps you install Docker, Docker Compose, and run Kafka/Zookeeper for the gas-backend-main project.

---

## 1. Install Docker

```sh
sudo apt-get update
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) \
  signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
```

---

## 2. Install Docker Compose

```sh
sudo apt-get install -y docker-compose
```

---

## 3. Verify Installation

```sh
docker --version
docker-compose --version
```

---

## 4. Start Kafka and Zookeeper

1. Make sure you are in your project directory (where `docker-compose.yml` is located):

   ```sh
   cd ~/gas-backend-main
   ```

2. Start the services:

   ```sh
  docker compose down
  docker compose pull
  docker compose up -d
   ```

   - This will start Zookeeper and Kafka in the background.

3. Check running containers:

   ```sh
   docker ps
   ```

---

## 5. Tast Kafka 

```sh
docker exec -it gas-backend-main-kafka-1 bash
kafka-topics --bootstrap-server localhost:9092 --list
```


## 5. Stopping the Services

```sh
docker-compose down
```

---

## 6. Running the Backend

1. Install dependencies:

   ```sh
   npm install
   ```

2. Build and start the server:

   ```sh
   npm run build
   npm start
   ```

---

## 7. Kafka Usage

- Kafka broker will be available at `localhost:9092`.
- Use this address in your backend `.env` or config files.

---

**You are now ready to use Kafka and Zookeeper with your backend!**