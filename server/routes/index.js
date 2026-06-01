const router = require('express')();
const tempEmail=require('./tempEmailRouter');

router.use('/tempEmail', tempEmail);

module.exports = router;
