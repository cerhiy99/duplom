const UserController = require('../Controller/UserController');

const router=require('express')();

router.post('/register',UserController.Register);
router.post('/login',UserController.Login);


module.exports=router;