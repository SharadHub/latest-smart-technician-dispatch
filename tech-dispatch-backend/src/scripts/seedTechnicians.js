import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import User from "../models/User.js";
import Technician from "../models/Technician.js";

// Spread of real Kathmandu Valley neighbourhoods [lng, lat]
const KTM_LOCATIONS = [
  { name: "Thamel",         coords: [85.3122, 27.7156] },
  { name: "Baneshwor",      coords: [85.3348, 27.6950] },
  { name: "Bouddha",        coords: [85.3618, 27.7215] },
  { name: "Lazimpat",       coords: [85.3194, 27.7214] },
  { name: "Pulchowk",       coords: [85.3189, 27.6773] },
  { name: "Chabahil",       coords: [85.3518, 27.7175] },
  { name: "Koteshwor",      coords: [85.3479, 27.6840] },
  { name: "Maharajgunj",    coords: [85.3268, 27.7359] },
  { name: "Jawalakhel",     coords: [85.3157, 27.6780] },
  { name: "Kalanki",        coords: [85.2798, 27.6938] },
  { name: "Gongabu",        coords: [85.3098, 27.7355] },
  { name: "Balaju",         coords: [85.3000, 27.7320] },
  { name: "Lagankhel",      coords: [85.3251, 27.6706] },
  { name: "New Road",       coords: [85.3122, 27.7054] },
  { name: "Ratna Park",     coords: [85.3145, 27.7042] },
  { name: "Satdobato",      coords: [85.3353, 27.6607] },
  { name: "Thimi",          coords: [85.3922, 27.6839] },
  { name: "Kupondole",      coords: [85.3200, 27.6860] },
  { name: "Bagbazar",       coords: [85.3200, 27.7042] },
  { name: "Swayambhu",      coords: [85.2905, 27.7146] },
  { name: "Balkhu",         coords: [85.2958, 27.6840] },
  { name: "Kalimati",       coords: [85.2984, 27.6960] },
  { name: "Airport",        coords: [85.3592, 27.6958] },
  { name: "Bhaktapur",      coords: [85.4298, 27.6712] },
  { name: "Patan",          coords: [85.3240, 27.6833] },
  { name: "Naxal",          coords: [85.3289, 27.7154] },
  { name: "Dillibazar",     coords: [85.3286, 27.7094] },
  { name: "Sundhara",       coords: [85.3147, 27.6993] },
  { name: "Tripureshwor",   coords: [85.3074, 27.6952] },
  { name: "Basundhara",     coords: [85.3175, 27.7408] },
  { name: "Nayabazar",      coords: [85.2997, 27.7134] },
  { name: "Sitapaila",      coords: [85.2820, 27.7048] },
  { name: "Samakhushi",     coords: [85.3215, 27.7378] },
  { name: "Shankhamul",     coords: [85.3408, 27.6847] },
  { name: "Minbhawan",      coords: [85.3420, 27.6953] },
  { name: "Sukedhara",      coords: [85.3222, 27.7311] },
  { name: "Narayanthan",    coords: [85.3352, 27.7292] },
  { name: "Khusibu",        coords: [85.3134, 27.7430] },
  { name: "Tokha",          coords: [85.3125, 27.7600] },
  { name: "Manbhawan",      coords: [85.3245, 27.6688] },
];

// 8 service types matching the frontend config
const SERVICE_TYPES = [
  "plumbing",
  "electrical",
  "hvac",
  "appliance_repair",
  "carpentry",
  "painting",
  "cleaning",
  "general_maintenance",
];

const SERVICE_LABELS = {
  plumbing:            "Plumber",
  electrical:          "Electrician",
  hvac:                "HVAC Technician",
  appliance_repair:    "Appliance Repair Tech",
  carpentry:           "Carpenter",
  painting:            "Painter",
  cleaning:            "Cleaning Specialist",
  general_maintenance: "Maintenance Tech",
};

// 5 Nepali-sounding names per service type (40 total, different names)
const TECH_NAMES = {
  plumbing:            ["Ramesh Shrestha",   "Bikram Tamang",     "Suman Gurung",      "Deepak Maharjan",   "Nabin Karki"],
  electrical:          ["Anil Thapa",         "Prabesh Rai",       "Bijay Bhandari",    "Suresh Magar",      "Kiran Lama"],
  hvac:                ["Prakash Adhikari",   "Roshan Pandey",     "Dipesh Pokhrel",    "Arjun Chaudhary",   "Binod Gautam"],
  appliance_repair:    ["Santosh Basnet",     "Rajan Shrestha",    "Milan Limbu",       "Hari Bahadur KC",   "Sagar Dhakal"],
  carpentry:           ["Ganesh Neupane",     "Ram Prasad Tiwari", "Uddhav Yadav",      "Krishna Subedi",    "Mohan Bhattarai"],
  painting:            ["Sujan Bajracharya",  "Pradeep Sapkota",   "Naresh Hamal",      "Umesh Koirala",     "Rajesh Devkota"],
  cleaning:            ["Shova Rai",          "Anjali Tamang",     "Sunita Gurung",     "Puja Shrestha",     "Nirmala Magar"],
  general_maintenance: ["Lok Bahadur Thapa",  "Dhan Raj Karki",    "Madhav Pokhrel",    "Tika Ram Sharma",   "Babu Ram Paudel"],
};

// Phone numbers: 98XXXXXXXX pattern
let phoneCounter = 9845000001;
const nextPhone = () => String(phoneCounter++);

// Seed ─────────────────────────────────────────────────────────────────────
const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  // --- Admin ---
  const adminEmail = "admin@techdispatch.com";
  await User.deleteOne({ email: adminEmail });
  await User.create({
    name: "System Admin",
    email: adminEmail,
    password: "admin123",
    phone: "9800000001",
    role: "admin",
  });
  console.log("✔ Admin created  admin@techdispatch.com / admin123");

  // --- Technicians ---
  let locationIndex = 0;
  let created = 0;

  for (const serviceType of SERVICE_TYPES) {
    const names = TECH_NAMES[serviceType];

    for (let i = 0; i < 5; i++) {
      const name  = names[i];
      const email = `${serviceType}${i + 1}@tech.com`.replace("_", "");
      const phone = nextPhone();
      const loc   = KTM_LOCATIONS[locationIndex % KTM_LOCATIONS.length];
      locationIndex++;

      // Remove stale records
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        await Technician.deleteOne({ user: oldUser._id });
        await oldUser.deleteOne();
      }

      const user = await User.create({
        name,
        email,
        password: "tech1234",
        phone,
        role: "technician",
      });

      await Technician.create({
        user:     user._id,
        name,
        email,
        phone,
        skills:   [serviceType, "general_maintenance"],
        location: { type: "Point", coordinates: loc.coords },
        status:   "active",
        approved: true,
      });

      created++;
      console.log(`  ✔ [${SERVICE_LABELS[serviceType]}] ${name} — ${loc.name}`);
    }
  }

  console.log(`\nSeeded ${created} technicians across ${SERVICE_TYPES.length} service types.`);
  console.log("All technician login password: tech1234");
  await mongoose.disconnect();
  console.log("Done.");
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
