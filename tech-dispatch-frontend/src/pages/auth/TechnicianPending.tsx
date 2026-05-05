import { Link } from "react-router-dom";
import { Wrench, Clock } from "lucide-react";

export default function TechnicianPending() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center">
            <Clock size={40} className="text-amber-500" />
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-2">
          <Wrench size={20} className="text-blue-600" />
          <span className="text-lg font-bold text-gray-900">TechDispatch</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mt-4">Account Pending Approval</h1>
        <p className="text-gray-500 mt-3 leading-relaxed">
          Your technician account has been registered successfully. An admin will review and approve your account before you can log in.
        </p>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-700">
          You will be able to log in once your account is approved. Check back soon.
        </div>

        <Link
          to="/login"
          className="mt-6 inline-block w-full py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-700 transition-colors no-underline text-sm"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
