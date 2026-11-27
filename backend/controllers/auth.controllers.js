import {User} from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import {generateVerificationToken} from "../utils/generateVerificationToken.js";
import {generateTokenAndSetCookie} from "../utils/generateTokenAndSetCookie.js"
import {sendVerificationEmail,sendWelcomeEmail} from "../mailtrap/emails.js";

// Hash de bcrypt válido utilizado para igualar el tiempo de respuesta durante el inicio de sesión: 
// cuando no se encuentra ningún usuario, aun así ejecutamos bcrypt.compare con este hash ficticio; 
// de este modo, un correo electrónico inexistente requiere el mismo tiempo que una contraseña incorrecta, 
// evitando así revelar la existencia de una cuenta.

const DUMMY_PASSWORD_HASH = bcryptjs.hashSync("dummy-password",10);  

export const signup = async (req,res) => {
  const {name,email,password} = req.body;
  const normalizedName = name.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  try{
    if(!name || !email || !password){
      throw new Error("All fields are required.");
    };

    const userAlreadyExist = await User.findOne({email:normalizedEmail});
    
    if(userAlreadyExist){
      /* Prevención de enumeración: devuelve un mensaje genérico en lugar de «El usuario ya 
      existe», de modo que este endpoint no pueda utilizarse para averiguar qué correos 
      electrónicos están registrados. (Compromiso: a un usuario que ya tiene una cuenta 
      se le indica que vuelva a intentarlo, en lugar de decirle directamente que inicie sesión). */
      return res.status(400).json({
        sucess: false, 
        message: "Unable to create account."
      });
    };

    const hashedPassword = await bcryptjs.hash(password,10);
    const verificationToken = generateVerificationToken();

    const user = new User({
      name: normalizedName,
      email: normalizedEmail,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpiredAt: Date.now() + 15 * 60 * 1000, // 15 minutos.
    })

    await user.save();

    try{
      await sendVerificationEmail(user.email,verificationToken);
    }catch(error){
      console.error("Error sending signup verification email:",error);    
    };

    res.status(201).json({
      sucess: true,
      message: "User created sucessfully",
      user, // depurado mediante la transformación `toJSON` del esquema (sin contraseñas ni tokens).
    })

  }catch(error){
    //Gestiona condición de carrera: correo electrónico duplicado (MongoDB E11000)
    if(error.code === 11000){
      return res.status(400).json({
        success: false, 
        message: "Unable to create account."
      });
    }

    console.error("Error in signup:",error);
    res.status(500).json({ 
      success: false, 
      message: "Unable to create account. Please try again."});
  };
};

export const verifyEmail = async (req,res) => {
  const {email,code} = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try{
    const user = await User.findOne({
      email: normalizedEmail,
      verificationToken: code,
      verificationTokenExpiredAt: {$gt: Date.now()}
    });

    if(!user){
      return res.status(400).json({success:false, message:"Invalid or expired verification code."});
    };

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiredAt = undefined;
    
    await user.save();

    generateTokenAndSetCookie(res,user._id,user.tokenVersion);

    try {
      await sendWelcomeEmail(user.email,user.name);
    } catch (error) {
      console.error("Error sending welcome email:",error);      
    }

    res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      user, // sanitizado mediante la transformación toJSON del esquema (sin contraseñas ni tokens).
    });

  }catch(error){
    console.log("Error in verifyEmail:",error);
    res.status(500).json({status:false, message:"server error."})    
  };
};

/**
 * Sends a new verification code to an unverified account without revealing
 * whether an account exists for the requested email.
 *
 * @param {import("express").Request} req - Request containing the account email.
 * @param {import("express").Response} res - Response used to return a generic status.
 * @returns {Promise<void>}
 */
export const resendVerificationEmail = async (req,res) => {
  const {email} = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const user = await User.findOne({email:normalizedEmail, isVerified:false});
    if(user){
      const verificationToken = generateVerificationToken();
      user.verificationToken = verificationToken;
      
      await user.save();

      try{
        await sendVerificationEmail(user.email,verificationToken);
      }catch(error){
        console.error("Error resending verification email:",error);
      };

    };

    return res.status(200).json({
      success: true,
      message: "If an unverified account exists for that email, a verification code has been sent",
    });

  } catch (error) {
    console.error("Error in resending verification email:",error);
    return res.status(500).json({
      success: false, 
      message:"Unable to send a verification code. Please try again."});    
  }
};

/**
 * Autentica a un usuario con correo electrónico y contraseña, luego emite una cookie de autenticación 
 * después de confirmar que la cuenta está verificada.
 * 
 * @param {import("express").Request} req - Solicitud que contiene correo electrónico y contraseña.
 * @param {import("express").Response} res - Respuesta utilizada para establecer la cookie de autenticación y devolver el estado.
 * @returns {Promise<void>}
 */
export const login = async (req,res) => {
  const {email,password} = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const user = await User.findOne({email: normalizedEmail});
    
    // Ecualización de tiempos: ejecutar siempre bcrypt.compare — contra un hash ficticio 
    // cuando el usuario no está presente — para que el tiempo de respuesta no revele si 
    // existe una cuenta (anteriormente, un usuario no presente devolvía una respuesta temprana).

     const isPasswordValid = await bcryptjs.compare(password, user ? user.password : DUMMY_PASSWORD_HASH);     

     if(!user || !isPasswordValid){
      return res.status(400).json({success: false, message:"Invalid credentials."});
     };

    if(!user.isVerified){
      return res.status(400).json({success: false, message:"Please, verify your email before logging in."});
    };

    user.lastLogin = new Date();
    await user.save();
    generateTokenAndSetCookie(res,user._id,user.tokenVersion);

    res.status(200).json({
      sucess: true,
      message: "Logged successfully.",
      user, // sanitizado mediante la transformación toJSON del esquema (sin contraseñas ni tokens).
    });
  } catch (error) {
    console.error("Error in loging:",error);
    res.status(400).json({success: false, message: error.message});
  }
};

/** 
 * Cierra la sesión del usuario autenticado incrementando la versión de su token y 
 * borrando la cookie de autenticación. 
 * 
 * @param {import("express").Request} req - Solicitud que contiene el ID de usuario autenticado.
 * @param {import("express").Response} res - Respuesta utilizada para borrar la cookie y devolver el estado.
 * @returns {Promise<void>}
*/

export const logout = async (req,res) => {
  try {
    await User.findByIdAndUpdate(req.userId,{$inc:{tokenVersion:1}});
    res.clearCookie("token",{
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });
    return res.status(200).json({success: true, message: "Logged out successfully."});
  } catch (error) {
    console.error("Error in logout:",error);
    return res.status(500).json({success: false, message:"Unable to log out. Please try again."});
  }
};