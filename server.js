import express from "express";
import sendMail from "./config/nodemailerConfig.js";
import cors from "cors";
import authenticateToken from "./middleware/auth.js";
import connectDB from "./database.js";
import User from "./Models/UserModel.js";
import jwt from "jsonwebtoken";
import Qr from "./Models/QrModel.js";
import multer from "multer";
import adminRoutes from "./routes/admin.js";

import rateLimit from "express-rate-limit";
import upload from "./utils/multer.js";
import cloudinary from "./utils/cloudinary.js";
import UserPayment from "./Models/UserPayment.js";
import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();
import bcrypt from "bcrypt";
const app = express();
connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://wealthx7.netlify.app",
      "https://wealthx.live",
    ],
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/admin", adminRoutes);


// app.use("/api/boards", boardRoutes);

// Register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Remove password from response
    const userResponse = { ...newUser._doc };
    delete userResponse.password;

    res.status(201).json({
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error registering the user:\n", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT Token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    // Return user info and token
    res.status(200).json({
      message: "Login successful 🚀",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:\n", error);
    res.status(500).json({ message: "Server error" });
  }
});

// const storage = multer.memoryStorage();

app.patch(
  "/upload",
  upload.fields([{ name: "qr1" }, { name: "qr2" }]),
  async (req, res) => {
    try {
      let uploadQr1 = null;
      let uploadQr2 = null;

      if (req.files["qr1"]) {
        const result = await cloudinary.uploader.upload(
          req.files["qr1"][0].path
        );
        uploadQr1 = result.secure_url;
      }

      if (req.files["qr2"]) {
        const result = await cloudinary.uploader.upload(
          req.files["qr2"][0].path
        );
        uploadQr2 = result.secure_url;
      }

      const updateData = {};
      if (uploadQr1) updateData.qr1 = uploadQr1;
      if (uploadQr2) updateData.qr2 = uploadQr2;

      // Force upsert (update if exists, insert if not)
      const updatedQr = await Qr.findOneAndUpdate(
        {},
        { $set: updateData },
        { new: true, upsert: true }
      );

      console.log("qr1:", updatedQr.qr1, "qr2:", updatedQr.qr2);

      res.status(200).json({
        message: "QR codes updated successfully",
        qr1: updatedQr.qr1,
        qr2: updatedQr.qr2,
      });
    } catch (error) {
      console.error("QR Upload Error:", error);
      res.status(500).json({ message: "QR upload failed", error });
    }
  }
);

// get Qr Codes

app.get("/api/qrcodes", async (req, res) => {
  try {
    const qr = await Qr.find();
    if (qr.length === 0) {
      return res.status(404).json({ message: "QR codes not found." });
    }
    res.status(200).json(qr);
  } catch (error) {
    console.error("Error fetching QR codes:", error);
    res.status(500).json({ message: "Server error while fetching QR codes." });
  }
});

// user payment data...
app.post(
  "/api/submit-payment",
  upload.single("screenshot"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        utr,
        plan,
        status,
        submittedAt,
        loggedInEmail,
      } = req.body;

      if (!req.file) {
        return res.status(400).json({ message: "Screenshot is required." });
      }

      // Upload file to Cloudinary
      const cloudRes = await cloudinary.uploader.upload(req.file.path, {
        folder: "paymentScreenshots",
      });

      // Save data with Cloudinary URL
      const newPayment = new UserPayment({
        name,
        email,
        phone,
        utr,
        plan,
        status,
        submittedAt: new Date(submittedAt),
        screenshotPath: cloudRes.secure_url,
        loggedInEmail,
      });

      await newPayment.save();

      console.log("Uploaded URL:", cloudRes.secure_url);

      res.status(201).json({ message: "Payment submitted successfully." });
    } catch (error) {
      console.error("Submit Payment Error:", error);
      res
        .status(500)
        .json({ message: "Backend error from submit payments..." });
    }
  }
);

// mail send on form submission

app.post("/contact-form", (req, res) => {
  const { firstName, lastName, email, phone, message } = req.body;

  // Debug log
  console.log("📨 Contact form submitted:", {
    firstName,
    lastName,
    email,
    phone,
    message,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // Your Gmail email address
      pass: process.env.EMAIL_PASS, // App password (not your Gmail password)
    },
  });

  const mailOptions = {
    from: `"${firstName} ${lastName}" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: "📬 New Contact Form Submission Received",
    replyTo: email, // So you can reply directly from Gmail
    text: `
You have received a new message from your website contact form:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Name: ${firstName} ${lastName}
📧 Email: ${email}
📱 Phone: ${phone}
💬 Message:
${message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This message was submitted via the contact form on your website.
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("❌ Email sending failed:", error);
      return res
        .status(500)
        .json({
          success: false,
          message: "Failed to send email. Please try again later.",
        });
    } else {
      console.log("✅ Email sent:", info.response);
      return res
        .status(200)
        .json({
          success: true,
          message: "Thank you! Your message has been sent successfully.",
        });
    }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// get status from email...

app.get("/by-email/:email", async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error while fetching user" });
  }
});

// user ScreenShot Upload...

app.post("/upload-image", upload.single("image"), (req, res) => {
  try {
    res.json({ imageUrl: req.file.path }); // Cloudinary URL
  } catch (err) {
    res.status(500).json({ message: "Image upload failed" });
  }
});

// update the status of user...

// app.patch('/update-userstatus', async (req, res) => {
//   const { email, status } = req.body;

//   if (!email || !status) {
//     return res.status(400).json({ message: "Email and status are required" });
//   }

//   try {
//     const updatedUser = await User.findOneAndUpdate(
//       { email: email },
//       { status: status },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     res.json(updatedUser);
//   } catch (error) {
//     console.error("Error updating user status:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// update the status of payment

app.patch("/update-paymentstatus", async (req, res) => {
  const { id, status } = req.body;

  // Check for required fields
  if (!id || !status) {
    return res.status(400).json({ message: "ID and status are required" });
  }

  try {
    // Find by ID and update the status
    const updatedUser = await UserPayment.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Success
    return res.status(200).json({
      message: "Payment status updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user status:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// Get logged-in user's data
app.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Server error from getting userDetails..." });
  }
});

// Get all users (Admin access only)
app.get("/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "Admin")
    return res.status(403).json({ message: "Access denied" });
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server is running on localhost:${process.env.PORT} 🚀`);
});
