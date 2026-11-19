import { MailtrapClient } from "mailtrap";

const TOKEN = process.env.MAILTRAP_API_KEY;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN;

export const client = new MailtrapClient({
  token: TOKEN,
});

export const sender = {
  email: EMAIL_DOMAIN,
  name: "Mailtrap Test",
};