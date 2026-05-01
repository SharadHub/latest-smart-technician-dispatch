import User from "../models/User.js";
import Technician from "../models/Technician.js";
import Booking from "../models/Booking.js";
import Rating from "../models/Rating.js";

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await User.countDocuments();

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Private/Admin
export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
export const updateUser = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === "technician") {
      const tech = await Technician.findOne({ user: user._id });
      if (tech) {
        await Rating.deleteMany({ technicianId: tech._id });
        await tech.deleteOne();
      }
    }
    await Booking.deleteMany({ userId: user._id });
    await Rating.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all technicians
// @route   GET /api/admin/technicians
// @access  Private/Admin
export const getTechnicians = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const technicians = await Technician.find()
      .populate('user', 'name email phone')
      .skip(skip)
      .limit(limit)
      .sort('-createdAt');

    const total = await Technician.countDocuments();

    res.status(200).json({
      success: true,
      count: technicians.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: technicians,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify technician
// @route   PUT /api/admin/technicians/:id/verify
// @access  Private/Admin
export const verifyTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate('user', 'name email phone');

    if (!technician) {
      return res.status(404).json({
        success: false,
        message: 'Technician not found',
      });
    }

    res.status(200).json({
      success: true,
      data: technician,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats (aggregate counts - no time-series)
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getAdminStats = async (req, res, next) => {
  try {
    // Aggregate bookings by status
    const bookingStats = await Booking.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object for easier access
    const bookingsByStatus = {};
    bookingStats.forEach((stat) => {
      bookingsByStatus[stat._id] = stat.count;
    });

    res.status(200).json({
      success: true,
      data: {
        users: await User.countDocuments(),
        technicians: await Technician.countDocuments(),
        bookings: {
          total: await Booking.countDocuments(),
          byStatus: bookingsByStatus
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
