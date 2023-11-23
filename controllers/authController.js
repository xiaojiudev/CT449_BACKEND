const User = require("../models/userModel")
const { StatusCodes } = require("http-status-codes")
const CustomError = require("../errors")
const { createTokenUser, attachCookiesToResponse } = require("../utils")

// Register User
const register = async (req, res) => {
  const { name, email, password } = req.body

  const emailAlreadyExists = await User.findOne({ email })
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists")
  }

  // Add first registered user as admin
  const isFirstAccount = (await User.countDocuments({})) === 0
  const role = isFirstAccount ? "admin" : "user"

  // Save user
  const user = await User.create({ name, email, password, role, address: "137/24 Mau Than street, Ninh Kieu district, Can Tho city", phone: "" })

  // Create token user
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({ res, user: tokenUser })
  res.status(StatusCodes.CREATED).json({ user: tokenUser })
}

// Login User
const login = async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    throw new CustomError.BadRequestError("Please provide email and password")
  }
  const user = await User.findOne({ email })
  if (!user) {
    throw new CustomError.UnauthorizedError("No user found")
  }
  const isPasswordCorrect = await user.comparePassword(password)
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials")
  }
  const tokenUser = createTokenUser(user)
  attachCookiesToResponse({ res, user: tokenUser })

  res.status(StatusCodes.OK).json({ user: tokenUser, msg: "Login successful!" })
}

// Logout User
const logout = async (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  })
  //   res.send() ==== this is for production
  res.status(StatusCodes.OK).json({ msg: "user logged out!" }) // this is for testing during development
}

// const logout = async (req, res) => {
//   res.cookie("token", "no token", {
//     httpOnly: true,
//     expires: new Date(Date.now()),
//   })
//   res.send()
// }

module.exports = {
  register,
  login,
  logout,
}
