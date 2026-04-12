import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench, Clock, ArrowLeft, CheckCircle } from "lucide-react";

export default function TechnicianPending() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-700 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-white/20 rounded-full" />
          <div className="absolute bottom-20 right-20 w-96 h-96 border border-white/20 rounded-full" />
        </div>
        <div className="relative">
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Wrench size={22} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-white">TechDispatch</span>
          </Link>
        </div>
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight">
            Registration Successful!
          </h2>
          <p className="mt-4 text-blue-100 text-lg leading-relaxed">
            Your technician account is being reviewed by our admin team. You'll receive approval soon and can start accepting jobs.
          </p>
        </div>
        <div className="relative text-blue-200 text-sm">
          &copy; {new Date().getFullYear()} TechDispatch
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-6 no-underline"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <CheckCircle size={40} className="text-green-600" />
            </motion.div>
            <h1 className="text-2xl font-bold text-dark mb-2">
              Awaiting Admin Approval
            </h1>
            <p className="text-gray-500">
              Your technician account has been registered successfully
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-amber-50 border border-amber-100 rounded-lg p-6 mb-6"
          >
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-800 mb-1">
                  What happens next?
                </h3>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Admin team will review your application</li>
                  <li>• You'll receive an email once approved</li>
                  <li>• Then you can login and start receiving jobs</li>
                </ul>
              </div>
            </div>
          </motion.div>

          <div className="space-y-3">
            <Link
              to="/"
              className="w-full py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-dark transition-colors text-center block no-underline"
            >
              Back to Homepage
            </Link>
            <Link
              to="/login"
              className="w-full py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors text-center block no-underline"
            >
              Try Login
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            Questions? Contact our support team
          </p>
        </motion.div>
      </div>
    </div>
  );
}
