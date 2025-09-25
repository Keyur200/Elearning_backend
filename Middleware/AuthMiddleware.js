const jwt = require('jsonwebtoken');
const User = require('../Models/UserModel');
const requireLogin = async(req,res,next) => {
    try {
        const {token} = req.cookies;
        if(!token) {
            return res.json({error:"You must login."})
        }

        jwt.verify(token, process.env.SECRET, {} ,(err,user)=>{
            if(err) {
                return res.json({error:"You must login."})
            }
            else{
                const {_id} = user;
                User.findById(_id).then((userdata)=>{
                    req.user = userdata
                    next()
                })
            }

        })
    } catch (error) {
        console.log(error)
    }
}

module.exports = {requireLogin}