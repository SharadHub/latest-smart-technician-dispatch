import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { SERVICE_TYPES } from "../config/services";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { ArrowRight } from "lucide-react";

export default function Services() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl sm:text-4xl font-bold text-dark"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-3 text-gray-500 max-w-lg mx-auto"
          >
            Choose from a wide range of professional home services. All our
            technicians are verified and rated.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICE_TYPES.map((service, i) => (
            <motion.div
              key={service.key}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Link to={`/book?service=${service.key}`} className="no-underline">
                <motion.div
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-transparent hover:shadow-xl transition-all cursor-pointer group h-full"
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                    style={{ backgroundColor: service.bg }}
                  >
                    <service.icon size={32} style={{ color: service.color }} />
                  </div>
                  <h3 className="font-bold text-dark text-lg mb-2">
                    {service.label}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed mb-4">
                    {service.description}
                  </p>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:gap-2 transition-all">
                    Book Now <ArrowRight size={16} />
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
