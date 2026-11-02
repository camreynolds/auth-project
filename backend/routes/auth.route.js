import express from "express";

const router = express.Router();

router.post("/signup",(req,res)=>{
    res.status(200).send({success: true, message: "signup."})
    console.log("Signup.");
  });
router.post("/login",(req,res)=>{
  res.status(200).send({success: true, message: "login."})
  console.log("Login.");
});
router.post("/logout",(req,res)=>{
  res.status(200).send({success: true, message: "logout."})
  console.log("Logout");
});

export default router;