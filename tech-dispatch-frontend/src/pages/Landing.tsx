import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { SERVICE_TYPES } from "../config/services";
import {
  ArrowRight,
  CheckCircle,
  Clock,
  Shield,
  Star,
  Users,
  Zap,
} from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
  }),
};

const stats = [
  { label: "Verified Pros", value: "5+", icon: Users },
  { label: "Jobs Completed", value: "10+", icon: CheckCircle },
  { label: "Avg Response", value: "< 10min", icon: Clock },
  { label: "Customer Rating", value: "*.*★", icon: Star },
];

const whyUs = [
  {
    icon: Shield,
    title: "Verified Professionals",
    desc: "Every technician is background-checked, certified, and reviewed by our team before approval.",
  },
  {
    icon: Zap,
    title: "Instant Dispatch",
    desc: "Our smart system finds the nearest available technician and dispatches them in real-time.",
  },
  {
    icon: Clock,
    title: "Real-time Tracking",
    desc: "Track your booking status live — from request to completion, every step is visible.",
  },
  {
    icon: Star,
    title: "Quality Guaranteed",
    desc: "Rate your experience after every job. Only top-rated technicians stay on our platform.",
  },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-cyan-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark leading-tight"
            >
              Find Trusted{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
                Technicians
              </span>{" "}
              Near You
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-6 text-lg text-gray-500 leading-relaxed"
            >
              From plumbing to electrical, carpentry to cleaning, book verified
              professionals instantly. Real-time dispatch, no waiting.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                className="px-8 py-3.5 bg-primary text-white font-semibold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all cursor-pointer border-none text-base flex items-center gap-2"
              >
                Book a Service
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register?role=technician")}
                className="px-8 py-3.5 bg-white text-dark font-semibold rounded-xl border border-gray-200 hover:border-primary hover:text-primary transition-all cursor-pointer text-base"
              >
                Join as Technician
              </motion.button>
            </motion.div>
          </div>

          {/* Stats Bar */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-5 text-center shadow-sm border border-gray-100"
              >
                <stat.icon size={24} className="mx-auto text-primary mb-2" />
                <div className="text-2xl font-bold text-dark">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark">Our Services</h2>
            <p className="mt-3 text-gray-500">
              Choose from a wide range of professional home services
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {SERVICE_TYPES.map((service, i) => (
              <motion.div
                key={service.key}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-50px" }}
                variants={fadeUp}
              >
                <Link
                  to={`/book?service=${service.key}`}
                  className="no-underline"
                >
                  <motion.div
                    whileHover={{ y: -4, scale: 1.02 }}
                    className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all cursor-pointer group"
                  >
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: service.bg }}
                    >
                      <service.icon
                        size={28}
                        style={{ color: service.color }}
                      />
                    </div>
                    <h3 className="font-semibold text-dark text-base">
                      {service.label}
                    </h3>
                    <p className="text-sm text-gray-400 mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark">
              Why TechDispatch?
            </h2>
            <p className="mt-3 text-gray-500">
              We make finding reliable help effortless
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h3 className="font-semibold text-dark text-lg mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-gradient-to-r from-primary to-blue-700 rounded-3xl p-10 lg:p-14 text-center text-white shadow-2xl shadow-primary/20"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-lg mx-auto">
              Join thousands of satisfied customers. Book a service or register
              as a technician today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register")}
                className="px-8 py-3.5 bg-white text-primary font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer border-none text-base"
              >
                Book Now
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/register?role=technician")}
                className="px-8 py-3.5 bg-transparent text-white font-semibold rounded-xl border-2 border-white/30 hover:bg-white/10 transition-colors cursor-pointer text-base"
              >
                Become a Technician
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
