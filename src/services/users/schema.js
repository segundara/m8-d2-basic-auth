const { Schema } = require("mongoose")
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")
const v = require("validator")

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    surname: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 7,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: async (value) => {
          if (!v.isEmail(value)) {
            throw new Error("Email is invalid")
          }
        },
      },
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      required: true,
    },
    age: {
      type: Number,
      min: [18, "You are toooooo young!"],
      max: [65, "You are toooooo old!"],
      validate(value) {
        if (value < 0) {
          throw new Error("Age must be a positive number!")
        }
      },
    },
    professions: Array,
  },
  { timestamps: true }
)

UserSchema.statics.findByCredentials = async (email, password) => {
  const user = await UserModel.findOne({ email })

  if (user) {
    const isMatch = await bcrypt.compare(password, user.password)
    if (isMatch) return user
    else return null
  } else return null
}

UserSchema.methods.toJSON = function () {
  const user = this
  const userObject = user.toObject()

  delete userObject.password
  delete userObject.__v

  return userObject
}

UserSchema.pre("save", async function (next) {
  const user = this

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8)
  }

  next()
})

UserSchema.post("validate", function (error, doc, next) {
  if (error) {
    error.httpStatusCode = 400
    next(error)
  } else {
    next()
  }
})

UserSchema.post("save", function (error, doc, next) {
  if (error.name === "MongoError" && error.code === 11000) {
    error.httpStatusCode = 400
    next(error)
  } else {
    next()
  }
})

const UserModel = mongoose.model("User", UserSchema)

module.exports = UserModel
