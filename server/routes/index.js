const router = require('express')();
const tempEmail=require('./tempEmailRouter');
const downoload=require('./downoloadfile');
const userRouter=require('./userRouter');

router.use('/tempEmail', tempEmail);
router.use('/downoload', downoload)
router.use('/user',userRouter)

module.exports = router;
