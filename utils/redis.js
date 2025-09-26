// import { createClient } from "redis";

// const client = createClient({
//   username: process.env.REDIS_USERNAME,
//   password: process.env.REDIS_PASSWORD,
//   socket: {
//     host: process.env.REDIS_HOST,
//     port: Number(process.env.REDIS_PORT),
//     // tls: true, // uncomment if your Redis server requires TLS
//   },
// });

// client.on("error", (err) => console.error("❌ Redis Client Error:", err));

// let redisClient;

// async function connectRedis() {
//   if (!redisClient) {
//     await client.connect();
//     redisClient = client;
//     console.log("✅ Connected to Redis Cloud");
//   }
//   return redisClient;
// }

// // Export the promise resolving to the connected client
// const redis = await connectRedis();
// export default redis;
