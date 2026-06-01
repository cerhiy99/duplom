const TempEmail = require('../Controller/TempEmail');

const router=require('express')();

router.post('/create', TempEmail.Create);
router.get('/letters',TempEmail.GetLetters)

module.exports=router;