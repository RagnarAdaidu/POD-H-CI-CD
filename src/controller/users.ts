import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { v4 as uuidv4, validate } from "uuid";
import { UserInstance } from "../models/user";
import { validationSchema, options, loginSchema, updateProfileSchema, changePasswordSchema, updateWalletSchema, updateAdminStatusSchema } from '../utils/validation'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { emailVerificationView, emailWalletView, tokenNotification } from "./mailSender";
import { sendMail, sendWalletMail } from "./emailService";
import { generateToken } from "../utils/utils";
import { forgotPasswordVerification } from "../email/emailVerification";
import { AccountInstance } from "../models/account";
import { defaultValueSchemable } from "sequelize/types/utils";
const twofactor = require("node-2fa");

const secret = process.env.JWT_SECRET as string



export async function RegisterUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
    const id = uuidv4();
    try {
        const ValidateUser = validationSchema.validate(req.body,options);
        if (ValidateUser.error) {
            return res.status(400).json({
                Error: ValidateUser.error.details[0].message,
            });
        }
        const duplicatEmail = await UserInstance.findOne({
            where: { email: req.body.email },
        });
        if (duplicatEmail) {
            return res.status(409).json({
                msg: "Email is used, please enter another email",
            });
        }

        const duplicatePhone = await UserInstance.findOne({
            where: { phonenumber: req.body.phonenumber },
        });

        if (duplicatePhone) {
            return res.status(409).json({
                msg: "Phone number is used",
            });
        }
        const passwordHash = await bcrypt.hash(req.body.password, 8);
        const record = await UserInstance.create({
            id: id,
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username,
            email: req.body.email,
            phonenumber: req.body.phonenumber,
            password: passwordHash,
            isVerified: true,
            avatar: "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?w=2000",
            wallet: 0,
            isAdmin: false,
            twoFactorAuth: '',
        })
        if (record) {
            const email = req.body.email as string;
            const subject = "User verification";
            const username =req.body.username as string
            const token = jwt.sign({id},secret,{expiresIn:'7d'}) 
            const html:string = emailVerificationView(token)
            await sendMail(html,email,subject,username)
            
       return res.status(201).json({
        status:"Success",
        msg:"User created successfully",
        record})
        }  
    } catch (error) {
      console.log(error);
        res.status(500).json({
            message:'failed to register',
            route:'/create'

        })
    }
    
}

export async function verifyUser(token: string) {
  const decode = jwt.verify(token, process.env.JWT_SECRET as string);
  const details = decode as unknown as Record<string, unknown>;
  const id = details.id as string;
  const user = await UserInstance.findByPk(id);
  if (!user) throw new Error('user not found');

  return await user.update({ isVerified: true });
}



export async function getUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    //const id=req.user.id;
    const { id } = req.params;
    const record = await UserInstance.findOne({ where: { id } });
    return res.status(200).json({ "record": record });
  } catch (error) {
    return res.status(500).json({
      msg: "Invalid User",
      route: "/read/:id"
    });
  }
}

export async function LoginUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const validationResult = loginSchema.validate(req.body, options);

    if (validationResult.error) {
      return res.status(400).json({
        Error:
        validationResult.error.details[0].message
      });
    }

    const userEmail = req.body.email;
    const userName = req.body.username;

    const record = userEmail
      ? ((await UserInstance.findOne({
        where: [{ email: userEmail }]
      })) as unknown as { [key: string]: string })
      : ((await UserInstance.findOne({
        where: [{ username: userName }]
      })) as unknown as { [key: string]: string });

      if (!record) {
        return res.status(404).json({
          status: "fail",
          msg: "Incorrect username/e-mail or password",
        });
      }

    if (record.isVerified) {
      const { id } = record;
      const { password } = record;
      const token = generateToken({ id });
      const validUser = await bcrypt.compare(req.body.password, password);
      if (!validUser) {
        return res.status(401).json({
          msg: 'Password do not match'
        });
      }
      if (validUser) {
        res.status(200).json({
          status: 'success',
          msg: 'login successful',
          record: record,
          token: token
        });
      }
    } else {
      return res.status(400).json({
        msg: "Please verify your email address"
      });
    }
  } catch (err) {
    res.status(404).json({
      status:'fail',
      msg: 'Incorrect username/e-mail or password',
      route: '/login'
    });
  }
}

export async function forgotPassword(req: Request, res: Response) {
  try {
    const { email } = req.body;

    const user = (await UserInstance.findOne({
      where: {
        email: email
      }
    })) as unknown as { [key: string]: string };

    if (!user) {
      return res.status(404).json({
        message: 'email not found'
      });
    }

    const { id } = user;
    const fromUser = process.env.FROM as string;
    const subject = process.env.SUBJECT as string;
    const html = forgotPasswordVerification(id);

    await sendMail(html, req.body.email, subject, fromUser);

    res.status(200).json({
      message: 'Check email for the verification link'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error'
    });
  }
}

export async function changePassword(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const validationResult = changePasswordSchema.validate(req.body, options);
    if (validationResult.error) {
      return res.status(400).json({
        error: validationResult.error.details[0].message
      });
    }

    const user = await UserInstance.findOne({
      where: {
        id: id
      }
    });
    if (!user) {
      return res.status(403).json({
        message: 'user does not exist'
      });
    }
    const passwordHash = await bcrypt.hash(req.body.password, 8);

    await user?.update({
      password: passwordHash
    });
    return res.status(200).json({
      message: 'Password Successfully Changed'
    });
  } catch (error) {
    res.status(500).json({
      message: 'Internal server error'
    });
  }
}

export async function Updateprofile(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params
    const { firstname, lastname, phonenumber } = req.body
    const validateResult = updateProfileSchema.validate(req.body, options)
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message
      })
    }
    const record = await UserInstance.findByPk(id)
    if (!record) {
      res.status(404).json({
        Error: "cannot find user",
      })
    }
    const updaterecord = await record?.update({
      firstname,
      lastname,
      phonenumber
    })
    res.status(201).json({
      message: 'you have successfully updated your profile',
      record: updaterecord
    })

  } catch (error) {
    res.status(500).json({
      msg: 'failed to update profile',
      route: '/update/:id'

    })
  }
}

export async function getUsers(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id
    const record = await UserInstance.findOne({ where: { id } })
    return res.status(200).json({
      record
    })
  } catch (error) {
   return res.status(500).json({
      msg: 'failed to get user',
      route: '/user/:id'

    })
  }
}


export async function getUserRecords(
  req: Request | any,
  res: Response,
  next: NextFunction
) {
  try {
    const userId = req.user.id;
    const record = (await UserInstance.findOne({
      where: { id: userId },
      include: [{ model: AccountInstance, as: "accounts" }],
    })) as unknown as { [key: string]: string };

    res.status(200).json({
      record: record,
    });
  } catch (err) {
    res.status(500).json({
      msg: "failed to login",
      route: "/login",
    });
  }
}


export default async function LogoutUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('Email');
    localStorage.removeItem('id');
    const link = `${process.env.FRONTEND_URL}`;
    res.redirect(`${link}/login`)
  } catch (err) {
    res.status(500).json({
      msg: "failed to logout",
      route: "/logout",
    });
  }
}





export async function UpdateWallet(req: Request, res: Response) {
  try {
    const { amount, email } = req.body

    const validateResult = updateWalletSchema.validate(req.body.email, options)
    if (validateResult.error) {
      return res.status(400).json({
        Error: validateResult.error.details[0].message
      })
    }
    const record = await UserInstance.findOne({ where: { email } })
    const wallet = record?.getDataValue("wallet")

    const updatedWallet = wallet + amount
    if (!record) {
      return res.status(404).json({
        Error: "Cannot Find User",
      })
    }


    const updaterecord = await record?.update({
      wallet: updatedWallet
    })
    if (updaterecord) {
      const email = req.body.email as string;
      const subject = "Wallet Update Notification";
      const username = req.body.username as string
      const html: string = emailWalletView()
      await sendMail(html, email, subject, username)
    }
    return res.status(201).json({
      message: 'The user account has been successfully credited',
      record: updaterecord
    })

  } catch (error) {

    res.status(500).json({
      msg: 'Failed to credit user Account',
      route: '/update-wallet'
    })
  }
}

export async function twoFactorAuth (req: Request, res: Response){
  try {
    
    const adminID = req.params.id;
    const user = await UserInstance.findOne({
      where: { id: adminID },
    }) as any;
    
    if (!user) {
      return res.status(404).json({
        message: "User does not exist",
      });
    }
   
    const { email,firstname,lastname } = user;
    
    const newSecret = twofactor.generateSecret({ name: "YHWHELOHIM", account: "Yeshua" });
    const newToken = twofactor.generateToken(newSecret.secret);
    const updaterecord = await user?.update({twoFactorAuth: newToken.token})
   
    //const email = "felixtemikotan@yahoo.com"
    const subject = "Airtime2Cash Admin Transaction Notification";
   
    const str = `Hello ${firstname} ${lastname}, someone attempt to credit a wallet from your dashboard. <b>Kindly enter this token: ${newToken.token} </b>to confirm that it is you and to verify the transaction. If you did not attempt this transaction, kindly proceed to change your password as your account may have been compromised. This time, I recommend you use a very strong password. consider trying something similar to but not exactly as: 1a2b3c4d53!4@5#6$7%8^9&0*1(2)3_4+5-6=7{8};4'5,6.7/8?9`;
    
    const html: string = tokenNotification(firstname, lastname,newToken.token);
   
    await sendMail(html, email, subject, str)

    return res.status(200).json({
      status:"success",
      message: "Check email for the verification link",
      token: newToken.token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Internal server error",
    });
  }
}
   

export async function deleteUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    const record = await UserInstance.findOne({ where: { id } });
    if (!record) {
      return res.status(404).json({
        msg: "User not found",
      });
    }
    const deletedRecord = await record.destroy();
    return res.status(200).json({
      msg: "User deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "failed to delete",
      route: "/deleteuser/:id",
    });
  }
}
export async function UpdateAdmin(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const record = await UserInstance.findOne({ where: { id } })
    if (!record) {
      return res.status(404).json({
        Error: "Cannot Find User",
      })
    }
    const updaterecord = await record?.update({
      isAdmin: true
    })
    if (updaterecord) {
      return res.status(201).json({
        message: 'This user is now an admin',
        record: updaterecord
      })
    }
  } catch (error) {
    res.status(500).json({
      msg: 'Failed to credit user Account',
      route: '/update-wallet'
    })
  }
}
