const express = require("express");
require("./config/config");
const cors = require("cors");
require("dotenv").config();
const app = express();
const router = require("./routers/userRouter");
const ngrok = require("@ngrok/ngrok");

const allowedOrigins = [
  "https://laundromat-frontend.vercel.app",
  "https://www.laundromat-frontend.vercel.app",
  "laundromat-frontend.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps, Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);
// app.use(cors({
//     origin: '*', // or specify the exact frontend origin if needed
//     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//     credentials: true
// }));

app.use(express.json());

app.use("/api", router);

const port = process.env.PORT || 5001;

app.get("/", (req, res) => res.send("laundromat backend"));

app.listen(port, "0.0.0.0", async () => {
  console.log(`This server is listening on port: ${port}`);
  if (process.env.NODE_ENV !== "production") {
    // const url = await ngrok.connect({
    //   addr: port,
    //   authtoken: process.env.NGROK_AUTHTOKEN,
    // });
    // console.log("ngrok tunnel URL:", url);
    const forwarder = await ngrok.forward({
      addr: port,
      authtoken: process.env.NGROK_AUTHTOKEN,
      // domain: "broken-estranged-cymbal.ngrok-free.dev",
    });
    console.log(`ngrok tunnel URL: ${forwarder.url()}`);
    console.log(
      `To test your webhook, set the Twilio WhatsApp webhook URL to: ${forwarder.url()}/api/whatsapp`,
    );
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});
// https://broken-estranged-cymbal.ngrok-free.dev/api/whatsapp
