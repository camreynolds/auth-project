import express from "express";
import { signup, verifyEmail, resendVerificationEmail, login } from "../controllers/auth.controllers.js";

const router = express.Router();

// Valida los datos de registro, aplica límites de tasa de registro y crea una nueva cuenta.
router.post("/signup",signup);
// Valida los datos de inicio de sesión, aplica límites de velocidad de inicio de sesión y autentica al usuario.
router.post("/login",login);
// Requiere un token válido, limita las solicitudes y cierra la sesión del usuario autenticado.
router.post("/logout",(req,res)=>{
  res.status(200).send({success: true, message: "logout."})
  console.log("Logout");
});
// Valida la solicitud de verificación de correo electrónico y confirma la dirección de correo electrónico del usuario.
router.post("/verify-email",verifyEmail);
// Valida y limita la frecuencia de una solicitud para enviar otro correo electrónico de verificación.
router.post("/resend-verification",resendVerificationEmail);
// Valida los datos de inicio de sesión, aplica límites de velocidad de inicio de sesión y autentica al usuario.
router.post("/login",login);

export default router;