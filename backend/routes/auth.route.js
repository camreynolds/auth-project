import express from "express";
import { signup, verifyEmail } from "../controllers/auth.controllers.js";

const router = express.Router();

router.post("/signup",signup);

router.post("/login",(req,res)=>{
  res.status(200).send({success: true, message: "login."})
  console.log("Login.");
});
router.post("/logout",(req,res)=>{
  res.status(200).send({success: true, message: "logout."})
  console.log("Logout");
});

router.post("/verify-email",verifyEmail);

export default router;