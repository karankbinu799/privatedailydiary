const express = require("express");
const router = express.Router();
const DiaryEntry = require("../models/diaryEntry");
const User = require("../models/user");
// Create a new diary entry
router.post("/create-entry", async (req, res) => {
  try {
    const { date, title, body } = req.body;

    // Assuming user is logged in and their ID is in session
    const newEntry = new DiaryEntry({
      user: req.session.user._id,
      username: req.session.user.username,
      date,
      title,
      body,
    });

    await newEntry.save();
    res.locals.successMessage = "New Diary Entry was created successfully";
    res.render("index", {
      user: req.session.user,
      successMessage: res.locals.successMessage,
      errorMessage: "",
    });
  } catch (error) {
    console.error(error);
    res.locals.errorMessage = "Error occured While creating new entry";
    res.render("index", {
      user: req.session.user,
      successMessage: "",
      errorMessage: res.locals.errorMessage,
    });
  }
});
// Read all diary entries
// router.get("/entries", async (req, res) => {
//   try {
//     const userId = req.session.user._id; // Assuming user ID is stored in the session
//     const entries = await DiaryEntry.find({ user: userId });
//     const successMessage = "Welcome to your Diary Entries Page";
//     res.render("entries", {
//       entries,
//       user: req.session.user,
//       successMessage,
//       errorMessage: "",
//     });
//   } catch (error) {
//     console.error(error);
//     const errorMessage = "Error occurred while fetching data";
//     res.render("entries", {
//       entries: [],
//       user: req.session.user,
//       successMessage: "",
//       errorMessage,
//     });
//   }
// });

router.get("/entries", async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { verificationCode } = req.query;

    // Check if verificationCode is not provided
    if (!verificationCode) {
      return res.render("index", {
        user: req.session.user,
        errorMessage: "Two-step verification code is required.",
        successMessage: "",
      });
    }

    // Check if the provided verificationCode matches the user's code
    const user = await User.findById(userId);
    if (user.TwoStepVerficationCode !== verificationCode) {
      return res.render("index", {
        user: req.session.user,
        errorMessage: "Invalid two-step verification code.",
        successMessage: "",
      });
    }

    // If verification is successful, proceed to fetch entries
    const entries = await DiaryEntry.find({ user: userId });
    const successMessage = "Welcome to your Diary Entries Page";
    res.render("entries", {
      entries,
      user: req.session.user,
      successMessage,
      errorMessage: "",
    });
  } catch (error) {
    console.error(error);
    const errorMessage = "Error occurred while fetching data";
    res.render("entries", {
      entries: [],
      user: req.session.user,
      successMessage: "",
      errorMessage,
    });
  }
});

// Read a specific diary entry
router.get("/entries/:id", async (req, res) => {
  try {
    const userId = req.session.user._id;
    // Retrieve all entries after the update
    const entry = await DiaryEntry.find({ user: userId });

    if (!entry) {
      res.render("entries", {
        entries: [],
        user: req.session.user,
        successMessage: "",
        errorMessage: "Requested Data was Not Found on the server",
      });
    }
    const entries = await DiaryEntry.find({ user: userId });
    return res.render("entries", {
      entries: entries,
      user: req.session.user,
      successMessage: "Updation Successfull",
      errorMessage: "",
    });
  } catch (error) {
    console.error(error);
    res.render("entries", {
      entries: [],
      user: req.session.user,
      successMessage: "",
      errorMessage: "Error occured while updation",
    });
  }
});

// Update a diary entry
router.put("/entries/:id", async (req, res) => {
  try {
    const { body, date, title } = req.body;
    const updatedEntry = await DiaryEntry.findByIdAndUpdate(
      req.params.id,
      { body, date, title },
      { new: true }
    );
    if (!updatedEntry) {
      res.render("entries", {
        entries: [],
        user: req.session.user,
        successMessage: "",
        errorMessage: "Requested Data was Not Found on the server",
      });
    }
    const userId = req.session.user._id;
    // Retrieve all entries after the update
    const entries = await DiaryEntry.find({ user: userId });

    res.render("entries", {
      entries: entries,
      user: req.session.user,
      successMessage: "Updation Successfull",
      errorMessage: "",
    });
  } catch (error) {
    console.error(error);
    res.render("entries", {
      entries: [],
      user: req.session.user,
      successMessage: "",
      errorMessage: "Error occured while updation",
    });
  }
});

// Delete a diary entry
router.delete("/entries/:id", async (req, res) => {
  try {
    const deletedEntry = await DiaryEntry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).send("Entry not found");
    }
    res.json(deletedEntry);
  } catch (error) {
    console.error(error);
    res.render("entries", {
      entries: [],
      user: req.session.user,
      successMessage: "",
      errorMessage: "Error occured while Deletion",
    });
  }
});

// router.get("/delAlentries", async (req, res) => {
//   try {
//     const entries = await DiaryEntry.deleteMany();
//     res.json(entries);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });
module.exports = router;
