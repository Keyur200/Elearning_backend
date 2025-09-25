const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const User = require("../Models/UserModel")

const register = async (req, res) => {
    try {
        const { name, email, password, roleId} = req.body
        if(!name || !email || !password || !roleId ) {
            return res.json({ error: "Please fill up all the fields." })
        }

        const emailCheck = await User.findOne({ email })
        if (emailCheck) {
            return res.json({ error: "Email is already used." })
        }

        const hashedPass = await bcrypt.hash(password, 10)

        const user = await User.create({ name, email, password: hashedPass, roleId })

        return res.json({ mes: "User created successfully", user })

    } catch (error) {
        console.log(error)
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email })
        if (!user) {
            return res.json({ error: "Email and password are incorrect." })
        }

        if (user) {
            const passCheck = await bcrypt.compare(password, user.password)
            if (!passCheck) {
                return res.json({ error: "Email and password are incorrect." })
            }
            if (passCheck) {
                jwt.sign({ _id: user._id, }, process.env.SECRET, {}, (err, token) => {
                    if (err) throw err;
                    res.cookie('token', token).json({ user,token })
                })
            }
        }
    } catch (error) {
        console.log(error)
    }
}

const userdata = async (req, res) => {
    try {
        const { token } = req.cookies;
        if (token) {
            jwt.verify(token, process.env.SECRET, {}, async (err, user) => {
                if (err) throw err
                const { name, email, roleId, _id } = await User.findById(user._id).populate('roleId')
                res.json({ name, email, roleId, _id })
            })
        }
    } catch (error) {
        console.log(error)
    }
}

const test = async ( req,res) => {
    try {
        res.json("yes u r login")
    } catch (error) {
        console.log(error)
    }
}

module.exports = {register, login, userdata, test}