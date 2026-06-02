const router = require('express')();
const tempEmail=require('./tempEmailRouter');
const downoload=require('./downoloadfile');
const userRouter=require('./userRouter');
const authEmail=require('./AuthEmails');


router.use('/tempEmail', tempEmail);
router.use('/downoload', downoload)
router.use('/user',userRouter)
router.use('/private',authEmail)

module.exports = router;
