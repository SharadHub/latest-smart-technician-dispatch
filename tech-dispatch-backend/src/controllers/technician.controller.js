import Technician from "../models/Technician.js";

export const getProfile = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician profile not found" });
    }
    res.status(200).json({ success: true, data: technician });
  } catch (error) {
    next(error);
  }
};
