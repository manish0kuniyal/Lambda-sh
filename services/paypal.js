// // ./services/paypal.js
// import dotenv from "dotenv";
// dotenv.config();

// import axios from "axios";

// export async function generateAccessToken() {
//   console.log("🧩 PAYPAL_BASE_URL:", process.env.PAYPAL_BASE_URL);

//   if (!process.env.PAYPAL_BASE_URL) {
//     throw new Error("❌ PAYPAL_BASE_URL is undefined");
//   }

//   const response = await axios({
//     url: process.env.PAYPAL_BASE_URL + '/v1/oauth2/token',
//     method: 'POST',
//     data: 'grant_type=client_credentials',
//     auth: {
//       username: process.env.PAYPAL_CLIENT_ID,
//       password: process.env.PAYPAL_SECRET
//     }
//   });

//   return response.data.access_token;
// }


// exports.createOrder=async()=>{
//     const accessToken=await generateAccessToken()
//     const reponse =await axios({
//          url: process.env.PAYPAL_BASE_URL + '/v2/checkout/orders',
//          method:'POST',
//          headers:{
//             'Content-Type':'application/json',
//             'Authorization': 'Bearer' + accessToken         
//         }
//     })
// }

console.log("payments")