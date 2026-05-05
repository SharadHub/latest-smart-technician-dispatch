import { Link } from "react-router-dom";
import { Wrench, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">TechDispatch</span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Connect with verified professionals for all your home service needs.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 list-none p-0">
              <li><Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Home</Link></li>
              <li><Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Register</Link></li>
              <li><Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Login</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 list-none p-0">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="text-blue-400" />
                support@techdispatch.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-blue-400" />
                +977 9800000000
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-blue-400" />
                Kathmandu, Nepal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} TechDispatch. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
