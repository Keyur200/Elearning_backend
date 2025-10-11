const { Schema, model } = require('mongoose')

const RoleSchema = new Schema({
    name: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
})

const Role = model('Role', RoleSchema)
module.exports = Role
