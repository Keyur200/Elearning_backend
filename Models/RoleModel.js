const { Schema, model } = require('mongoose')

const RoleSchema = new Schema({
    name: {type:String},    
})

const Role = model('Role', RoleSchema)

module.exports = Role