"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const withdrawal_1 = require("../controller/withdrawal");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/allWithdrawals/:id', withdrawal_1.getAllWithdrawals);
// router.get('/getAllUserWithdrawals', auth, getAllUserWithdrawals)
router.get('/getAllUserWithdrawals/:id', withdrawal_1.getAllUserWithdrawals);
router.post('/withdraw', auth_1.auth, withdrawal_1.withdrawal);
exports.default = router;
