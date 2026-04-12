import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";
import Rating from "../models/Rating.js";


export const getProfile = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }

    res.status(200).json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { skills, name, email, location, status } = req.body;

    const technician = await Technician.findOneAndUpdate(
      { user: req.user.id },
      { skills, name, email, location, status },
      { new: true, runValidators: true }
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }

    res.status(200).json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

export const getAssignedBookings = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const bookings = await Booking.find({ technicianId: technician._id })
      .populate("userId", "name email")
      .skip(skip)
      .limit(limit)
      .sort("-createdAt");

    const total = await Booking.countDocuments({ technicianId: technician._id });

    res.status(200).json({
      success: true,
      count: bookings.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: bookings
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findOneAndUpdate(
      {
        _id: req.params.id,
        technicianId: req.user.id
      },
      {
        $set: { status },
        $push: {
          statusHistory: {
            status,
            triggeredBy: "technician",
            timestamp: new Date()
          }
        }
      },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or not assigned to you"
      });
    }

    res.status(200).json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const updateLocation = async (req, res, next) => {
  try {
    const { coordinates } = req.body;

    const technician = await Technician.findOneAndUpdate(
      { user: req.user.id },
      {
        location: {
          type: "Point",
          coordinates
        }
      },
      { new: true }
    );

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }

    res.status(200).json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
};

export const getRatings = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });
    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician profile not found" });
    }
    const ratings = await Rating.find({ technicianId: technician._id })
      .populate("userId", "name")
      .populate("bookingId", "serviceType")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: ratings.length,
      data: ratings
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAvailability = async (req, res, next) => {
  try {
    const technician = await Technician.findOne({ user: req.user.id });

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: "Technician profile not found"
      });
    }

    // Toggle between "active" and "inactive"
    technician.status = technician.status === "active" ? "inactive" : "active";
    await technician.save();

    res.status(200).json({
      success: true,
      data: technician
    });
  } catch (error) {
    next(error);
  }
};
