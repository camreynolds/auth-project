import express from "express";
import "./config/env.js";

import {connectDB} from "./db/connectDB.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Llamada a la función de conexion a la base de datos.
await connectDB();

// Inicialización del servidor express.
app.listen(PORT, () => {
  console.log("Server is running on port:",PORT);  
});