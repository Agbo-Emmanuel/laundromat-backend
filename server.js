const express = require("express");
require("./config/config");
const cors = require("cors");
require("dotenv").config();
const app = express();
const router = require("./routers/userRouter");

const allowedOrigins = [
  "https://finfrevia.vercel.app",
  "https://www.finfrevia.org",
  "finfrevia.org",
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

app.use("/api/v1", router);

const port = process.env.PORT || 5001;

app.get("/", (req, res) => res.send("laundromat backend"));

app.listen(port, "0.0.0.0", () => {
  console.log(`This server is listening on port: ${port}`);
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Internal Server Error");
});
