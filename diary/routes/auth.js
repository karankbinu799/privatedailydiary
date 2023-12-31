//auth.js
const express = require("express");
const router = express.Router();
const session = require("express-session");
const cookieParser = require("cookie-parser");
const User = require("../models/user");
const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const randomstring = require("randomstring");
const OTP = require("../models/otp");
const { render } = require("ejs");
require("dotenv").config();
// Middleware setup
router.use(cookieParser());
router.use(
  session({
    secret: "p9ry00l9-30ne-p9rnji11e-nee-enn9-cheyyu3",
    resave: true,
    saveUninitialized: true,
  })
);
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.APP_PASSWORD,
  },
});

router.get("/signup", (req, res) => {
  res.locals.successMessage = "Welcome to our signup page!";
  res.render("signup", {
    successMessage: res.locals.successMessage,
    errorMessage: "",
    user: req.session.user,
  });
});
router.post("/signup", async (req, res) => {
  try {
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (password !== confirmPassword) {
      res.locals.errorMessage = "Passwords do not match!";
      return res.render("signup", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }

    const existingUsername = await User.findOne({
      username: req.body.username,
    });

    if (existingUsername) {
      res.locals.errorMessage =
        "Username already in use. Please choose another.";
      return res.render("signup", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }

    const existingEmail = await User.findOne({ email: req.body.email });

    if (existingEmail) {
      res.locals.errorMessage =
        "Email address already in use. Please choose another.";
      return res.render("signup", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }

    const TwoStepVerficationCode = req.body.TSVCinput;

    if (!TwoStepVerficationCode) {
      res.locals.errorMessage =
        "Enter A correct and 4 digit 2 step verification code please";
      return res.render("signup", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const user = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      TwoStepVerficationCode: TwoStepVerficationCode,
    });

    // Save the user to the database
    await user.save();

    res.locals.successMessage =
      "Account created successfully! You can now log in.";
    // Redirect to login page on successful signup
    res.render("login", {
      errorMessage: "",
      successMessage: res.locals.successMessage,
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render("signup", {
      errorMessage: "An error occurred. Please try again.",
      successMessage: "",
      user: req.session.user,
    });
  }
});

// Render login form
router.get("/login", (req, res) => {
  res.locals.successMessage = "Welcome to our login page";
  res.locals.errorMessage = "";
  res.render("login", {
    errorMessage: res.locals.errorMessage,
    successMessage: res.locals.successMessage,
    user: req.session.user,
  });
});

// login logic
router.post("/login", async (req, res) => {
  const user = await User.findOne({ username: req.body.username });
  if (user) {
    const passwordMatch = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (passwordMatch) {
      req.session.user = user;
      // Check if "Remember me" is checked
      if (req.body.rememberMe) {
        // Set a cookie to remember the user for 7 days
        res.cookie("rememberUser", user._id.toString(), {
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
          httpOnly: true,
        });
      } else {
        // Clear the "rememberUser" cookie
        res.clearCookie("rememberUser");
      }
      res.locals.user = user;
      res.render("index", {
        user: res.locals.user,
        successMessage: "welcome to Private Dialy Diary Entry APP",
        errorMessage: "",
      });
    } else {
      res.locals.errorMessage = "Invalid password !!";
      return res.render("login", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }
  } else {
    res.locals.errorMessage = "User Not found or invalid username !!";
    return res.render("login", {
      errorMessage: res.locals.errorMessage,
      successMessage: "",
      user: req.session.user,
    });
  }
});
// Route to handle logout
router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);
    }
    res.clearCookie("rememberUser");
    res.redirect("/login");
  });
});

router.get("/index", async (req, res) => {
  if (req.session.user) {
    res.render("index", {
      user: req.session.user,
      successMessage: "welcome to Private Dialy Diary Entry APP",
      errorMessage: "",
    });
  } else {
    // Check if the "rememberUser" cookie is present
    const rememberUserId = req.cookies.rememberUser;
    if (rememberUserId) {
      try {
        // Convert the rememberUserId to ObjectId
        const objectId =
          mongoose.Types.ObjectId.createFromHexString(rememberUserId);

        // Retrieve the user from the database using the ID from the cookie
        const user = await User.findOne({ _id: objectId }).exec();

        // If the user is found, set it in the session and render the index page
        if (user) {
          req.session.user = user;
          res.render("index", {
            user: req.session.user,
            successMessage: "welcome to Private Dialy Diary Entry APP",
            errorMessage: "",
          });
        } else {
          res.locals.errorMessage = "User not found.";
          res.render("login", {
            errorMessage: res.locals.errorMessage,
            successMessage: "",
            user: req.session.user,
          });
        }
      } catch (error) {
        console.error(error);
        res.locals.errorMessage = "An error occurred. Please try again.";
        res.render("login", {
          errorMessage: res.locals.errorMessage,
          successMessage: "",
          user: req.session.user,
        });
      }
    } else {
      res.locals.errorMessage = "Please Login to continue..";
      res.render("login", {
        errorMessage: res.locals.errorMessage,
        successMessage: "",
        user: req.session.user,
      });
    }
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const userEmail = req.body.email;

    // Check if the email exists in the user database
    const user = await User.findOne({ email: userEmail }).exec();

    if (!user) {
      // Email not found, redirect to login with an error message
      return res.render("login", {
        errorMessage: "Email not found. Please enter a valid email.",
        successMessage: "",
        user: req.session.user,
      });
    }

    // Email found, generate OTP and proceed with the password reset process
    const otp = generateOTP();

    // Save the OTP and associated email in the database
    await OTP.findOneAndDelete({ email: userEmail }).exec();
    await OTP.create({ email: userEmail, otp: otp });
    req.session.email = userEmail;

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: userEmail,
      subject: "Password Reset OTP",
      text: `Your OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully!");

    res.render("verify-otp", {
      email: userEmail,
      errorMessage: "",
      successMessage: "",
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render("login", {
      errorMessage:
        "An error occurred during password reset. Please try again.",
      successMessage: "",
      user: req.session.user,
    });
  }
});

// ... (other routes)

router.post("/update-password", async (req, res) => {
  try {
    const userEmail = req.session.email;
    const newPassword = req.body.newPassword;
    const newConfirmPassword = req.body.newPasswordConfirm;
    if (newPassword !== newConfirmPassword) {
      return res.render("update-password", {
        errorMessage: "Passwords does not match",
        successMessage: "",
        user: req.session.user,
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email: userEmail },
      { $set: { password: hashedPassword } },
      { new: true }
    ).exec();

    // Remove the OTP document from the database after successful verification
    await OTP.findOneAndDelete({ email: userEmail }).exec();

    if (updatedUser) {
      res.render("login", {
        errorMessage: "",
        successMessage: "Password reset successful. You can now log in.",
        user: req.session.user,
      });
    } else {
      res.render("update-password", {
        email: userEmail,
        errorMessage: "An error occurred. Please try again.",
        successMessage: "",
        user: req.session.user,
      });
    }
  } catch (error) {
    console.error(error);
    res.render("update-password", {
      email: req.session.email,
      errorMessage: "An error occurred. Please try again.",
      successMessage: "",
      user: req.session.user,
    });
  }
});

router.get("/resend-otp", async (req, res) => {
  try {
    const userEmail = req.session.email;
    const otp = generateOTP();

    await OTP.findOneAndDelete({ email: userEmail }).exec();
    await OTP.create({ email: userEmail, otp: otp });

    const mailOptions = {
      from: process.env.SMTP_EMAIL,
      to: userEmail,
      subject: "Password Reset OTP",
      text: `Your new OTP for password reset is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    console.log("New OTP sent successfully!");

    res.render("verify-otp", {
      email: userEmail,
      errorMessage: "",
      successMessage: "New OTP sent successfully",
      user: req.session.user,
    });
  } catch (error) {
    console.error(error);
    res.render("verify-otp", {
      email: req.session.email,
      errorMessage: "An error occurred. Please try again.",
      successMessage: "",
      user: req.session.user,
    });
  }
});

router.get("/verify-otp", (req, res) => {
  res.render("verify-otp", {
    email: req.session.email,
    errorMessage: "",
    successMessage: "Verify your OTP",
    user: req.session.user,
  });
});

router.post("/verify-otp", async (req, res) => {
  try {
    const userEmail = req.session.email;
    const userOTP = req.body.otp;

    const savedOTPDocument = await OTP.findOne({ email: userEmail }).exec();

    if (savedOTPDocument && userOTP === savedOTPDocument.otp) {
      // If OTP is valid, render the page for password update
      res.render("update-password", {
        email: userEmail,
        errorMessage: "",
        successMessage: "",
        user: req.session.user,
      });
    } else {
      res.render("verify-otp", {
        email: userEmail,
        errorMessage: "Invalid OTP. Please try again.",
        successMessage: "",
        user: req.session.user,
      });
    }
  } catch (error) {
    console.error(error);
    res.render("verify-otp", {
      email: req.session.email,
      errorMessage: "An error occurred. Please try again.",
      successMessage: "",
      user: req.session.user,
    });
  }
});
// Helper function to generate a random 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.get("/", async (req, res) => {
  res.render("home", { user: req.session.user });
});

module.exports = router;
