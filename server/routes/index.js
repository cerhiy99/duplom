const router = require('express')();
const tempEmail=require('./tempEmailRouter');
const downoload=require('./downoloadfile');

router.use('/tempEmail', tempEmail);
router.use('/downoload', downoload)

module.exports = router;
