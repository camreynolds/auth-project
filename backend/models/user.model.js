import mongoose from "mongoose";

//mongoose.Schema.Types.String.set('trim',true);

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    maxlength: 254,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  lastLogin: {
    type: Date,
    default: Date.now, 
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  tokenVersion: {
    type: Number,
    default: 0,
  },
  resetPasswordToken: String,
  resetPasswordExpiredAt: Date,
  verificationToken: String,
  verificationTokenExpiredAt: Date,
},{timestamps: true});

userSchema.index({verificationToken:1},{sparse:true});
userSchema.index({resetPasswordToken:1},{sparse:true});

/* Elimina los campos sensibles o internos de las respuestas JSON (hash de contraseña, tokens, `__v`) 
para evitar que se filtren a través de `res.json()`. Anteriormente, los controladores utilizaban 
el operador de propagación (`...user._doc`), lo que exponía al cliente campos 
como `verificationToken`, `resetPasswordToken` y otros datos internos. */

userSchema.set("toJSON",{
  transform: (_doc,ret) => {
    delete ret.password;
    delete ret.verificationToken;
    delete ret.verificationTokenExpiredAt;
    delete ret.resetPasswordToken;
    delete ret.verificationTokenExpiredAt;
    delete ret.tokenVersion;
    delete ret.__v;
    return ret;
  },
});

// los campos createdAt y updatedAt serán añadidos automáticamente en el documento.

export const User = mongoose.model("User",userSchema);