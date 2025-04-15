import React from "react";
import { MapPin, Phone, Mail } from "lucide-react";
import { Separator } from "./ui/separator";
// import logo from "../images/logo.png";

const Footer = () => {
  return (
    <footer className="bg-jet-500 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <img src="/images/logo.png" alt="BlackRoc Logo" className="h-14 mb-4" />
            <p className="text-champagne-400">
              Building Foundations for Success
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="http://localhost:5173/#home"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  Home
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5173/#products"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  Products
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5173/#services"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  Services
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5173/#about"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  About
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:5173/#contact"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  Contact
                </a>
              </li>
              <li>
                <a
                  href="/popi"
                  className="text-champagne-400 hover:text-buff-500"
                >
                  POPI Act
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-2 text-champagne-400">
              <li className="flex items-center">
                <MapPin className="mr-2 h-4 w-4" />
                <span>123 Business Street, Johannesburg</span>
              </li>
              <li className="flex items-center">
                <Phone className="mr-2 h-4 w-4" />
                <span>011 967 2152</span>
              </li>
              <li className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                <a href="mailto:vincentb@cloetesand.co.za" className="hover:text-buff-500">
                  vincentb@cloetesand.co.za
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4">Business Hours</h3>
            <ul className="space-y-2 text-champagne-400">
              <li>Monday - Friday: 7:00 AM - 5:00 PM</li>
              <li>Saturday: 7:00 AM - 1:00 PM</li>
              <li>Sunday: Closed</li>
            </ul>
          </div>
        </div>
        <Separator className="my-8 bg-champagne-400/20" />
        <div className="text-center text-champagne-400">
          <p>&copy; {new Date().getFullYear()} BlackRoc (Pty) Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 