const express=require('express'),{publicList,publicDetail}=require('../controllers/committeeController');const r=express.Router();r.get('/',publicList);r.get('/:slug',publicDetail);module.exports=r;
