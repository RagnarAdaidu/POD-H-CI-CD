import express from 'express';
const router = express.Router()

import { auth } from '../middleware/auth';
import { changePassword, forgotPassword, LoginUser, RegisterUser, Updateprofile, verifyUser, getUser, getUserRecords, getUsers, UpdateWallet,twoFactorAuth, UpdateAdmin, deleteUser } from '../controller/users'

router.get("/verify/:token", async (req, res) => {
    const token = req.params.token;
    const response = await verifyUser(token);
    const link = `${process.env.FRONTEND_URL}`;
    res.redirect(`${link}`);
})
router.get('/user/:id', getUsers)
import { isNamedExports } from 'typescript';
//

router.get("/verify/:token", async (req, res) => {
    const token = req.params.token;
    const response = await verifyUser(token);
    const link = `${process.env.FRONTEND_URL}`;
    res.redirect(`${link}`);
})


router.patch('/update/:id', auth, Updateprofile)
router.get('/user/:id', getUsers)


router.patch('/update-wallet', auth, UpdateWallet)
router.patch('/update/:id', auth, Updateprofile)
router.post('/create', RegisterUser);
router.get('/getuser/:id', auth, getUser);
router.post('/login', LoginUser);
router.post('/forgotpassword', forgotPassword)
router.patch('/change-password/:id', changePassword);
router.get('/userrecords', auth, getUserRecords);
router.get('/twofactorauth/:id', twoFactorAuth)
router.delete('/delete/:id', auth, deleteUser);
router.get('/updateadmin/:id', UpdateAdmin)


export default router;
