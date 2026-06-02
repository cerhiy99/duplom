const PrivateEmailController = require('../Controller/PrivateEmailController');
const IsAuthMidlware = require('../MiddleWare/IsAuthMidlware');

const router=require('express')();

router.post('/create', IsAuthMidlware, PrivateEmailController.create);
router.get('/list', IsAuthMidlware, PrivateEmailController.getAll);
router.delete('/delete/:id', IsAuthMidlware, PrivateEmailController.delete);
router.get('/getMyLetters',IsAuthMidlware,PrivateEmailController.getMyLetters)

module.exports=router;