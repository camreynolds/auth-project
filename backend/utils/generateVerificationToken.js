import crypto from "crypto";

export const generateVerificationToken = () => {
  // Código de 6 dígitos, criptográficamente seguro (100000-999999). 
  // Sustituye al uso de Math.random() en el rango 10000-909999, que era predecible
  // y generaba códigos de 5 dígitos aproximadamente el 10 % de las veces;
  // códigos que la interfaz de usuario de verificación (diseñada para 6 dígitos)
  // no podía procesar.

  return crypto.randomInt(100000,1000000).toString();
};