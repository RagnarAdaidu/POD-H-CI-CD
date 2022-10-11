"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tokenNotification = exports.transactionNotification = exports.emailWalletView = exports.emailVerificationView = void 0;
function emailVerificationView(token) {
    const link = `${process.env.BACKEND_URL}/users/verify/${token}`;
    let temp = `
       <div style="max-width: 700px;margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
       
       <h2 style="text-align: center; text-transform: uppercase;color: teal;">Welcome to Airtime to Cash POD H.</h2>

        <p>Hi there, Follow the link by clicking on the button to verify your email
        </p>

         <a href=${link}

         style="background: crimson; text-decoration: none; color: white;padding: 10px 20px; margin: 10px 0;display: inline-block;">Click Here</a>
         </div>
  `;
    return temp;
}
exports.emailVerificationView = emailVerificationView;
function emailWalletView() {
    const link = `${process.env.BACKEND_URL}`;
    let temp = `
       <div style="max-width: 700px;margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
       
       <h2 style="text-align: center; text-transform: uppercase;color: teal;">Dear customer your wallet has be credited.</h2>

        <p>Hi there,Your wallet has been credited
        </p>

         <a href=${link}

         style="background: crimson; text-decoration: none; color: white;padding: 10px 20px; margin: 10px 0;display: inline-block;">Click Here</a>
         </div>
  `;
    return temp;
}
exports.emailWalletView = emailWalletView;
function transactionNotification(firstname, lastname, phonenumber, airtimeAmount, network, destinationPhoneNumber) {
    const str = `${firstname}  ${lastname} with phone number ${phonenumber} has just sent an airtime transaction of ${airtimeAmount} on ${network} network to ${destinationPhoneNumber}.`;
    let temp = `
       <div style="max-width: 700px;margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
       
       <h2 style="text-align: center; text-transform: uppercase;color: teal;">Airtime to Cash Transaction Notification</h2>

        <p>${str}
        </p>
         </div>
  `;
    return temp;
}
exports.transactionNotification = transactionNotification;
function tokenNotification(firstname, lastname, token) {
    const str = `Hello ${firstname} ${lastname}, someone attempt to credit a wallet from your dashboard. <b><i>Kindly enter this token: ${token} </i></b>to confirm that it is you and to verify the transaction. If you did not attempt this transaction, kindly proceed to change your password as your account may have been compromised. This time, I recommend you use a very strong password. consider trying something similar to but not exactly as: 1a2b3c4d53!4@5#6$7%8^9&0*1(2)3_4+5-6=7{8};4'5,6.7/8?9`;
    let temp = `
       <div style="max-width: 700px;margin:auto; border: 10px solid #ddd; padding: 50px 20px; font-size: 110%;">
       
       <h2 style="text-align: center; text-transform: uppercase;color: teal;">Airtime to Cash Admin Transaction Notification</h2>

        <p>${str}
        </p>
         </div>
  `;
    return temp;
}
exports.tokenNotification = tokenNotification;
