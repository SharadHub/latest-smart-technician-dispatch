import { Link } from "react-router-dom";
import { SERVICE_TYPES } from "../config/services";
import { Shield, Clock, Star, Users, Wrench } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

const whyUs = [
  { icon: Shield, title: "Verified Professionals", desc: "Every technician is background-checked and reviewed before approval." },
  { icon: Clock, title: "Fast Response", desc: "Get connected with qualified technicians quickly and efficiently." },
  { icon: Star, title: "Quality Service", desc: "All our technicians are rated and approved for quality work." },
  { icon: Users, title: "Trusted Platform", desc: "A growing community of professionals and satisfied customers." },
];

export default function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <Wrench size={16} />
            Professional Home Services
          </div>
          <h1 className="text-5xl font-bold text-gray-900 leading-tight">
            Expert Technicians,<br />When You Need Them
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Connect with verified technicians for all your home service needs. Plumbing, electrical, HVAC, and more — all in one place.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors no-underline text-base"
            >
              Get Started
            </Link>
            <Link
              to="/register?role=technician"
              className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors no-underline text-base shadow-sm"
            >
              Join as Technician
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
            <p className="mt-3 text-gray-500">Professional solutions for every home need</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {SERVICE_TYPES.map((service) => {
              const Icon = service.icon;
              return (
                <div
                  key={service.key}
                  className="bg-white border border-gray-100 rounded-2xl p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className={`w-14 h-14 ${service.bg} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon size={28} className={service.color} />
                  </div>
                  <h3 className="font-semibold text-gray-900 text-sm">{service.label}</h3>
                  <p className="text-xs text-gray-500 mt-1">{service.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-gray-50 py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why TechDispatch?</h2>
            <p className="mt-3 text-gray-500">We connect you with the right professionals</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon size={24} className="text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Ready to get started?</h2>
          <p className="mt-4 text-gray-500">Join thousands of homeowners and technicians on TechDispatch.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors no-underline">
              Create Account
            </Link>
            <Link to="/login" className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors no-underline shadow-sm">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
