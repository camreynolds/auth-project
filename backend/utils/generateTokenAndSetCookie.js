import jwt from "jsonwebtoken";

export const generateVerificationToken = (res,userId,tokenVersion = 0) => {
  const token = jwt.sign({userId,tokenVersion},process.env.JWT_SECRET,{expiresIn: "7d"});

  res.cookie("token",token,{
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // solo funciona en https.
    sameSite: "strict", // previene ataques csrf.
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};