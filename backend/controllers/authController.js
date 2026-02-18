const User =require("../models/user")
const Admin = require("../models/admin")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const crypto = require('crypto')
const { uploadToCloudinary } = require('../configs/cloudinary'); // Import the new helper
const { sendVerificationEmail } = require('../configs/email')


//Login Controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Try to find in User collection first, then Admin
    let user = await User.findOne({ email });
    let isAdminAccount = false;
    if (!user) {
      user = await Admin.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      isAdminAccount = true;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Require verification for non-admin accounts
    if (!isAdminAccount) {
      if (!user.isVerified) {
        return res.status(403).json({ message: "Email not verified. Please check your inbox." });
      }
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: isAdminAccount ? 'admin' : user.role },
      process.env.JWT_SECRET,
      { expiresIn: "3h" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: isAdminAccount ? 'admin' : user.role
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

//Register Controller
exports.register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Ensure email is unique across both collections
        const existingUser = await User.findOne({ email });
        const existingAdmin = await Admin.findOne({ email });
        if (existingUser || existingAdmin) {
            return res.status(400).json({ message: "Account with this email already exists." });
        }

        const isAdmin = role === 'admin';
        const baseData = { name, email, password };

        // If a file is uploaded, handle it
        if (req.file) {
            // Upload the file buffer to Cloudinary
            const result = await uploadToCloudinary(req.file.buffer, "wastevision-avatars");
            baseData.avatar = {
                public_id: result.public_id,
                url: result.secure_url
            };
        }

        let created;
        if (isAdmin) {
            created = await Admin.create({ ...baseData, role: 'admin' });
        } else {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            const verificationTokenExpires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
            created = await User.create({
                ...baseData,
                role: 'user',
                isVerified: false,
                verificationToken,
                verificationTokenExpires
            });

            // Send verification email (non-blocking)
            sendVerificationEmail({ to: email, name, token: verificationToken })
              .catch(err => console.log('Verification email failed:', err.message));
        }

        const userResponse = {
            _id: created._id,
            name: created.name,
            email: created.email,
            avatar: created.avatar,
            role: created.role
        };

        return res.status(201).json({
            message: isAdmin
              ? "Admin registered successfully"
              : "User registered successfully. Please verify your email to activate your account.",
            user: userResponse
        });

    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find in User, then Admin
    let user = await User.findById(userId);
    let isAdminAccount = false;
    if (!user) {
      user = await Admin.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      isAdminAccount = true;
    }

    // Update name if provided
    if (name) {
      user.name = name;
    }

    // Handle avatar upload if file is provided
    if (req.file) {
      // Delete old avatar from Cloudinary if it exists
      if (user.avatar && user.avatar.public_id) {
        try {
          await cloudinary.uploader.destroy(user.avatar.public_id);
        } catch (error) {
          console.log("Error deleting old avatar:", error.message);
        }
      }

      // Upload new avatar to Cloudinary
      const result = await uploadToCloudinary(req.file.buffer, "wastevision-avatars");
      user.avatar = {
        public_id: result.public_id,
        url: result.secure_url
      };
    }

    // Update password if provided
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to update password"
        });
      }

      // Verify current password
      const bcrypt = require('bcrypt');
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect"
        });
      }

      user.password = newPassword;
    }

    await user.save();

    // Return user without password
    const updatedUser = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatar: user.avatar?.url || null,
      role: isAdminAccount ? 'admin' : user.role
    };

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser
    });
  } catch (error) {
    console.log("Error in updateProfile:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    let user = await User.findById(userId).select('-password');
    let isAdminAccount = false;
    if (!user) {
      user = await Admin.findById(userId).select('-password');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }
      isAdminAccount = true;
    }

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar?.url || user.avatar || null, // Return avatar URL or null
        role: isAdminAccount ? 'admin' : user.role
      }
    });
  } catch (error) {
    console.log("Error in getProfile:", error.message);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Verify Email Controller
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Missing token' });
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Invalid token' });
    }

    if (!user.verificationTokenExpires || user.verificationTokenExpires < new Date()) {
      return res.status(400).json({ success: false, message: 'Token expired. Please request a new verification link.' });
    }

    user.isVerified = true;
    user.verificationToken = null;
    user.verificationTokenExpires = null;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('verifyEmail error:', error.message);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
}