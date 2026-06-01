const TempEmail = require('../Controller/TempEmail');

const router=require('express')();

router.post('/create', TempEmail.Create);

module.exports=router;