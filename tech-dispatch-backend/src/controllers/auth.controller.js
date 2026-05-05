import User from "../models/User.js";
import Technician from "../models/Technician.js";

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone, role, skills } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password, phone, role: role || "user" });

    if (role === "technician") {
      const skillsArr = Array.isArray(skills) ? skills : [];
      await Technician.create({ user: user._id, email, name, phone: phone || undefined, skills: skillsArr });
      // Technicians need admin approval before they can log in — don't start a session
      return res.status(201).json({
        success: true,
        pending: true,
        data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
      });
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    res.status(201).json({
      success: true,
      pending: false,
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    if (user.role === "technician") {
      const technician = await Technician.findOne({ user: user._id });
      if (!technician || !technician.approved) {
        return res.status(403).json({
          success: false,
          message: "Technician account is pending admin approval.",
        });
      }
    }

    req.session.userId = user._id;
    req.session.role = user.role;

    res.status(200).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie("connect.sid");
    res.status(200).json({ success: true, message: "Logged out" });
  });
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
