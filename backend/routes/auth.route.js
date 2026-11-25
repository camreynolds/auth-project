import express from "express";
import { signup, verifyEmail,resendVerificationEmail } from "../controllers/auth.controllers.js";

const router = express.Router();

// Valida los datos de registro, aplica límites de tasa de registro y crea una nueva cuenta.
router.post("/signup",signup);

router.post("/login",(req,res)=>{
  res.status(200).send({success: true, message: "login."})
  console.log("Login.");
});
router.post("/logout",(req,res)=>{
  res.status(200).send({success: true, message: "logout."})
  console.log("Logout");
});
// Valida la solicitud de verificación de correo electrónico y confirma la dirección de correo electrónico del usuario.
router.post("/verify-email",verifyEmail);
// Valida y limita la frecuencia de una solicitud para enviar otro correo electrónico de verificación.
router.post("/resend-verification",resendVerificationEmail);

export default router;