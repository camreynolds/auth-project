import {User} from "../models/user.model.js";
import bcryptjs from "bcryptjs";
import {generateVerificationToken, generateTokenAndSetCookie} from "../utils/generateVerificationToken.js";
import {sendVerificationEmail} from "../mailtrap/emails.js";

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

    generateTokenAndSetCookie()

  }catch(error){
    console.log("Error in verifyEmail:",error);
    res.status(500).json({status:false, message:"server error."})    
  };
};