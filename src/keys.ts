import * as dotenv from "dotenv";
import * as path from 'path';

const baseDir = path.join(__dirname, '/../.env')
dotenv.config({path: baseDir });

export const keys = {
  nodemailer_email: process.env.NODEMAILER_EMAIL,
  nodemailer_password: process.env.NODEMAILER_PASSWORD,
}