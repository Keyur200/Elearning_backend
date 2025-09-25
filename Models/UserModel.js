const { Schema, model } = require('mongoose')

const  UserSchema = new Schema({
    name : {type:String},
    email: {type:String, unique:true},
    password : {type:String},
    roleId: {type:Schema.Types.ObjectId, ref: "Role"}
}, {timestamps:true})

const User = model('User', UserSchema)

module.exports = User