import User from "../models/User.js";
import Technician from "../models/Technician.js";
import Job from "../models/Job.js";

export const getAdminStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalTechnicians = await Technician.countDocuments();
    const pendingTechnicians = await Technician.countDocuments({ approved: false });
    const approvedTechnicians = await Technician.countDocuments({ approved: true });

    res.status(200).json({
      success: true,
      data: { totalUsers, totalTechnicians, pendingTechnicians, approvedTechnicians },
    });
  } catch (error) {
    next(error);
  }
};

// Returns completed/failed job counts grouped by day for the last N days
function buildDailyBuckets(days) {
  const now = new Date();
  const buckets = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    buckets.push({
      label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      start: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
      end: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
    });
  }
  return buckets;
}

function buildMonthlyBuckets(months) {
  const now = new Date();
  const buckets = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    buckets.push({
      label: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      start: d,
      end: next,
    });
  }
  return buckets;
}

export const getJobStats = async (req, res, next) => {
  try {
    const now = new Date();

    // Daily: last 7 days
    const dailyBuckets = buildDailyBuckets(7);
    // Weekly: last 4 weeks (treat each 7-day block as a week)
    const weeklyBuckets = buildDailyBuckets(28).reduce((acc, _, idx, arr) => {
      if (idx % 7 === 0) {
        const week = arr.slice(idx, idx + 7);
        acc.push({
          label: `Wk ${acc.length + 1}`,
          start: week[0].start,
          end: week[week.length - 1].end,
        });
      }
      return acc;
    }, []);
    // Monthly: last 12 months
    const monthlyBuckets = buildMonthlyBuckets(12);
    // Yearly: last 4 years
    const yearlyBuckets = [];
    for (let i = 3; i >= 0; i--) {
      const yr = now.getFullYear() - i;
      yearlyBuckets.push({
        label: String(yr),
        start: new Date(yr, 0, 1),
        end: new Date(yr + 1, 0, 1),
      });
    }

    const countBucket = async (bucket, status) => {
      return Job.countDocuments({
        status,
        createdAt: { $gte: bucket.start, $lt: bucket.end },
      });
    };

    const fillSeries = async (buckets) =>
      Promise.all(
        buckets.map(async (b) => {
          const [completed, failed] = await Promise.all([
            countBucket(b, "completed"),
            countBucket(b, "expired").then((e) =>
              countBucket(b, "cancelled").then((c) => e + c)
            ),
          ]);
          return { label: b.label, completed, failed };
        })
      );

    const [daily, weekly, monthly, yearly] = await Promise.all([
      fillSeries(dailyBuckets),
      fillSeries(weeklyBuckets),
      fillSeries(monthlyBuckets),
      fillSeries(yearlyBuckets),
    ]);

    res.status(200).json({ success: true, data: { daily, weekly, monthly, yearly } });
  } catch (error) {
    next(error);
  }
};

export const getUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {};

    const users = await User.find(query).skip(skip).limit(limit).sort("-createdAt");
    const total = await User.countDocuments(query);

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

export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getUserActivity = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const jobs = await Job.find({ user: user._id })
      .populate("technician", "name email phone")
      .sort("-createdAt")
      .limit(50);

    res.status(200).json({ success: true, data: { user, jobs } });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (user.role === "admin") {
      return res.status(403).json({ success: false, message: "Cannot delete admin accounts" });
    }
    if (user.role === "technician") {
      await Technician.deleteOne({ user: user._id });
    }
    await user.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const warnUser = async (req, res, next) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Warning reason is required" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { warnings: { reason: reason.trim(), issuedBy: req.user._id } } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const removeWarning = async (req, res, next) => {
  try {
    const { warningId } = req.params;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { warnings: { _id: warningId } } },
      { new: true }
    );

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getTechnicians = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {};

    const technicians = await Technician.find(query)
      .populate("user", "name email phone warnings")
      .skip(skip)
      .limit(limit)
      .sort("-createdAt");

    const total = await Technician.countDocuments(query);

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

export const getTechnicianById = async (req, res, next) => {
  try {
    const technician = await Technician.findById(req.params.id).populate("user", "name email phone warnings createdAt");
    if (!technician) return res.status(404).json({ success: false, message: "Technician not found" });
    res.status(200).json({ success: true, data: technician });
  } catch (error) {
    next(error);
  }
};

export const getTechnicianActivity = async (req, res, next) => {
  try {
    const technician = await Technician.findById(req.params.id).populate("user", "name email phone warnings createdAt");
    if (!technician) return res.status(404).json({ success: false, message: "Technician not found" });

    const jobs = await Job.find({ technician: technician._id })
      .populate("user", "name email phone")
      .sort("-createdAt")
      .limit(50);

    res.status(200).json({ success: true, data: { technician, jobs } });
  } catch (error) {
    next(error);
  }
};

export const verifyTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findByIdAndUpdate(
      req.params.id,
      { approved: true },
      { new: true }
    ).populate("user", "name email phone");

    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician not found" });
    }

    res.status(200).json({ success: true, data: technician });
  } catch (error) {
    next(error);
  }
};

export const deleteTechnician = async (req, res, next) => {
  try {
    const technician = await Technician.findById(req.params.id);
    if (!technician) {
      return res.status(404).json({ success: false, message: "Technician not found" });
    }
    await User.deleteOne({ _id: technician.user });
    await technician.deleteOne();
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};
