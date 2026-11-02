import express from "express";
import "./config/env.js";
import helmet from "helmet";

import {connectDB} from "./db/connectDB.js";
import authRoutes from "./routes/auth.route.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet()); // Security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, ...).
app.use(express.json({limit:"1 kb"})); // allows us to parse incoming request:req.body. Security limit request 1 kb.

app.use("/api/auth/",authRoutes);

await connectDB(); // Llamada a la función de conexion a la base de datos.

// Inicialización del servidor express.
app.listen(PORT, () => {
  console.log("Server is running on port:",PORT);  
});