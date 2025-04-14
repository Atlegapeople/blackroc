import React from "react";
import { motion } from "framer-motion";
import { ArrowLeft, MapPin, Phone, Mail, Menu, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "./ui/separator";
import logo from "../images/logo.png";

// Scroll progress bar component from the home page
const ScrollProgressBar = () => {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="absolute top-0 left-0 w-full h-1 bg-champagne-200">
      <motion.div
        className="h-full bg-buff-500"
        style={{ width: `${scrollProgress}%` }}
        transition={{ duration: 0.1 }}
      />
    </div>
  );
};

const TermsOfService = () => {
  // State for mobile menu
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Scroll to top when the component mounts
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Navigation handler from home page
  const handleNavigation = (item: string) => {
    if (item.toLowerCase() === 'home') {
      window.location.href = '/';
    } else {
      window.location.href = `/#${item.toLowerCase()}`;
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-champagne-400">
        <ScrollProgressBar />
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Link to="/">
                <img 
                  src={logo} 
                  alt="BlackRoc Logo" 
                  className="h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                />
              </Link>
            </motion.div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {['Home', 'Products', 'Services', 'About', 'Contact'].map((item) => (
                <motion.button
                  key={item}
                  onClick={() => handleNavigation(item)}
                  className="text-jet-500 hover:text-buff-500 font-medium transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {item}
                </motion.button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden text-jet-500 p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation */}
          <motion.div
            initial={false}
            animate={{ height: isMenuOpen ? 'auto' : 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="py-4 space-y-4">
              {['Home', 'Products', 'Services', 'About', 'Contact'].map((item) => (
                <motion.button
                  key={item}
                  onClick={() => handleNavigation(item)}
                  className="block text-jet-500 hover:text-buff-500 font-medium transition-colors duration-200"
                  whileHover={{ x: 5 }}
                >
                  {item}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Add padding to account for fixed nav */}
      <div className="pt-20">
        {/* Header */}
        <div className="bg-jet-400 text-white py-12">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-4xl mx-auto"
            >
              <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
              <p className="text-champagne-500 text-lg">
                Our Agreement with You
              </p>
            </motion.div>
          </div>
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <Link 
              to="/" 
              className="inline-flex items-center text-buff-500 hover:text-buff-600 mb-8 transition-colors"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-lg border border-champagne-400 p-8"
            >
              <p className="text-jet-600 mb-6">
                <strong>Last updated:</strong> {new Date().toLocaleDateString('en-ZA', {year: 'numeric', month: 'long', day: 'numeric'})}
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">1. Acceptance of Terms</h2>
              <p className="text-jet-600 mb-6">
                By accessing or using BlackRoc (Pty) Ltd ("BlackRoc", "we", "us", or "our") website, services, or products, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services or website.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">2. Description of Services</h2>
              <p className="text-jet-600 mb-6">
                BlackRoc is a construction aggregates and brick distributor that provides various construction materials, products, and related services. Our services include, but are not limited to:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>Supply of construction aggregates and building materials</li>
                <li>Delivery of construction materials to client sites</li>
                <li>Site clearance services</li>
                <li>Transportation services for construction materials</li>
                <li>Consultation on construction material requirements</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">3. User Accounts</h2>
              <p className="text-jet-600 mb-6">
                Certain features of our services may require you to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">4. Orders and Payments</h2>
              <p className="text-jet-600 mb-6">
                By placing an order with BlackRoc, you agree to the following:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>All information provided in connection with your order is accurate and complete.</li>
                <li>You are authorized to use the payment method provided.</li>
                <li>Payment terms are as agreed upon in the quotation or invoice.</li>
                <li>Orders are subject to availability and we reserve the right to limit quantities.</li>
                <li>Prices are subject to change without notice prior to order confirmation.</li>
                <li>Once an order is confirmed, it may not be canceled without our consent, which may be subject to a cancellation fee.</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">5. Delivery</h2>
              <p className="text-jet-600 mb-6">
                Delivery of products is subject to the following conditions:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>Delivery times provided are estimates and not guaranteed.</li>
                <li>You are responsible for ensuring accurate delivery information.</li>
                <li>You or your authorized representative must be present at the delivery location to receive the products.</li>
                <li>BlackRoc is not responsible for delays in delivery due to circumstances beyond our control.</li>
                <li>You must ensure that the delivery site is accessible and safe for our delivery vehicles.</li>
                <li>Additional delivery charges may apply for remote locations, difficult access, or specific delivery requirements.</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">6. Product Quality and Returns</h2>
              <p className="text-jet-600 mb-6">
                We strive to provide high-quality products. However:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>You must inspect all products upon delivery and notify us of any defects or inconsistencies within 24 hours.</li>
                <li>Returns or exchanges may be accepted at our discretion for products in their original condition.</li>
                <li>Custom or special orders may not be eligible for return or exchange.</li>
                <li>A restocking fee may apply to returned products.</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">7. Intellectual Property</h2>
              <p className="text-jet-600 mb-6">
                All content on our website, including text, graphics, logos, images, and software, is the property of BlackRoc or its content suppliers and is protected by South African and international copyright laws. You may not reproduce, distribute, display, or create derivative works from any content without our express written permission.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">8. Limitation of Liability</h2>
              <p className="text-jet-600 mb-6">
                To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>BlackRoc is not liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use our services or products.</li>
                <li>Our liability for any claim arising from these terms or your use of our services or products is limited to the amount you paid for the specific product or service that gives rise to the claim.</li>
                <li>We do not warrant that our services will be uninterrupted or error-free.</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">9. Indemnification</h2>
              <p className="text-jet-600 mb-6">
                You agree to indemnify, defend, and hold harmless BlackRoc, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, costs, expenses, or fees (including reasonable attorneys' fees) arising from your use of our services, violation of these terms, or infringement of any rights of a third party.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">10. Governing Law</h2>
              <p className="text-jet-600 mb-6">
                These Terms of Service are governed by the laws of the Republic of South Africa. Any dispute arising from these terms or your use of our services will be subject to the exclusive jurisdiction of the courts of South Africa.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">11. Changes to Terms</h2>
              <p className="text-jet-600 mb-6">
                We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting on our website. Your continued use of our services after any changes indicates your acceptance of the new terms.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">12. Contact Information</h2>
              <p className="text-jet-600 mb-6">
                If you have any questions or concerns about these Terms of Service, please contact us at:
              </p>
              <div className="bg-jet-300 p-6 rounded-lg">
                <p className="text-champagne-600">BlackRoc (Pty) Ltd</p>
                <p className="text-champagne-600">43 Phoenix Street, Kensington, 2094</p>
                <p className="text-champagne-600">Email: info@blackroc.co.za</p>
                <p className="text-champagne-600">Phone: 011 972 1349</p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-jet-300 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4"></h3>
              <p className="text-champagne-600 mb-4">
                A construction aggregates supplier committed to quality and
                excellence.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-champagne-600 hover:text-buff-500">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
                <a href="#" className="text-champagne-600 hover:text-buff-500">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-champagne-600 hover:text-buff-500">
                  <svg
                    className="h-6 w-6"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Home
                  </a>
                </li>
                <li>
                  <a
                    href="/#products"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Products
                  </a>
                </li>
                <li>
                  <a
                    href="/#services"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Services
                  </a>
                </li>
                <li>
                  <a
                    href="/#about"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/#contact"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <a
                    href="/privacy"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/popi"
                    className="text-champagne-600 hover:text-buff-500"
                  >
                    POPI Act
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <MapPin className="h-5 w-5 text-buff-500 mr-2 mt-0.5" />
                  <span className="text-champagne-600">
                    43 Phoenix Street Kensington, 2094
                  </span>
                </li>
                <li className="flex items-center">
                  <Phone className="h-5 w-5 text-buff-500 mr-2" />
                  <span className="text-champagne-600">011 972 1349</span>
                </li>
                <li className="flex items-center">
                  <Mail className="h-5 w-5 text-buff-500 mr-2" />
                  <span className="text-champagne-600">
                    info@blackroc.co.za
                  </span>
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-jet-500" />
          <div className="text-center text-champagne-600">
            <p>
              &copy; {new Date().getFullYear()} BlackRoc (Pty) Ltd. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsOfService; 