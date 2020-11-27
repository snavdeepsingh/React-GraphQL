import nodemailer from "nodemailer";
import { keys } from '../keys';

// async..await is not allowed in global scope, must use a wrapper
export async function sendEmail(to: string, html: string) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();
  // console.log("TEST Account: ", testAccount);
console.log(keys)
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: keys.nodemailer_email, // generated ethereal user
      pass: keys.nodemailer_password, // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: to, // list of receivers
    subject: "Change Password", // Subject line
    html, // plain text body
  });

  console.log("Message sent: %s", info.messageId);
  

  
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));

};
