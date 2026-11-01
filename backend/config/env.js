import dotenv from "dotenv";

// Carga las variables de entorno una sola vez, antes de que cualquier otro módulo lea process.env. 
// Usar quiet: true para suprimir los registros "env inyectados" de dotenv v18+.
dotenv.config({quiet: true});