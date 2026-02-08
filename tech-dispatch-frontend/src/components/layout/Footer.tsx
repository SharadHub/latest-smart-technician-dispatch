import { Link } from "react-router-dom";
import { Wrench, Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-darker text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 no-underline">
              <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
                <Wrench size={20} className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Tech<span className="text-primary-light">Dispatch</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your one-stop solution for reliable home services. Connect with
              verified professionals instantly.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 list-none p-0">
              <li>
                <Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Home</Link>
              </li>
              <li>
                <Link to="/services" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Services</Link>
              </li>
              <li>
                <Link to="/register" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Register</Link>
              </li>
              <li>
                <Link to="/login" className="text-sm text-gray-400 hover:text-white transition-colors no-underline">Login</Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-white font-semibold mb-4">Services</h4>
            <ul className="space-y-2 list-none p-0">
              <li className="text-sm text-gray-400">Plumbing</li>
              <li className="text-sm text-gray-400">Electrical</li>
              <li className="text-sm text-gray-400">HVAC</li>
              <li className="text-sm text-gray-400">Carpentry</li>
              <li className="text-sm text-gray-400">Painting</li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 list-none p-0">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} className="text-primary-light" />
                support@techdispatch.com
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} className="text-primary-light" />
                +977 9800000000
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} className="text-primary-light" />
                Kathmandu, Nepal
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-700 text-center">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TechDispatch. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
