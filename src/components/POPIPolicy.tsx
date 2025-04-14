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

const POPIPolicy = () => {
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
              <h1 className="text-4xl font-bold mb-4">POPI Act Compliance Policy</h1>
              <p className="text-champagne-500 text-lg">
                Protection of Personal Information
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
              <h2 className="text-2xl font-bold text-jet-500 mb-6">1. Introduction</h2>
              <p className="text-jet-600 mb-6">
                BlackRoc (Pty) Ltd ("BlackRoc", "we", "us" or "our") is committed to protecting the privacy of personal information of our clients, employees, suppliers and other stakeholders. This policy outlines how we comply with the Protection of Personal Information Act 4 of 2013 ("POPIA") and our commitment to protecting your personal information.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">2. Purpose</h2>
              <p className="text-jet-600 mb-6">
                The purpose of this policy is to:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>Define how we collect, use, and protect personal information in accordance with POPIA</li>
                <li>Establish a standard for the collection, storage, use, and sharing of personal information</li>
                <li>Outline the rights of data subjects and our obligations as a responsible party</li>
                <li>Prevent unauthorized access and use of personal information</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">3. Scope</h2>
              <p className="text-jet-600 mb-6">
                This policy applies to all personal information processed by BlackRoc, including information relating to our clients, employees, suppliers, and any other persons who provide us with their personal information.
              </p>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">4. Collection of Personal Information</h2>
              <p className="text-jet-600 mb-6">
                We collect and process personal information for various purposes related to our business operations, including but not limited to:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>Providing construction aggregates and materials to clients</li>
                <li>Managing customer relationships and accounts</li>
                <li>Processing orders and deliveries</li>
                <li>Employee administration and management</li>
                <li>Supplier and contractor management</li>
                <li>Marketing and communications</li>
                <li>Compliance with legal and regulatory requirements</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">5. Processing of Personal Information</h2>
              <p className="text-jet-600 mb-6">
                We process personal information in accordance with the following principles:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>Accountability: We take responsibility for ensuring that personal information is processed in accordance with POPIA.</li>
                <li>Processing limitation: We only collect and process personal information that is necessary for legitimate business purposes.</li>
                <li>Purpose specification: We collect personal information for specific, explicitly defined, and legitimate purposes.</li>
                <li>Further processing limitation: We do not further process personal information in a manner incompatible with the purpose for which it was collected.</li>
                <li>Information quality: We take reasonable steps to ensure that personal information is accurate, complete, and up-to-date.</li>
                <li>Openness: We are transparent about our practices regarding the processing of personal information.</li>
                <li>Security safeguards: We implement appropriate technical and organizational measures to protect personal information.</li>
                <li>Data subject participation: We respect the rights of data subjects to access and correct their personal information.</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">6. Rights of Data Subjects</h2>
              <p className="text-jet-600 mb-6">
                Data subjects have the following rights under POPIA:
              </p>
              <ul className="list-disc pl-6 text-jet-600 mb-6 space-y-2">
                <li>The right to be informed about the collection and use of their personal information</li>
                <li>The right to access their personal information</li>
                <li>The right to request correction of their personal information</li>
                <li>The right to request deletion of their personal information</li>
                <li>The right to object to the processing of their personal information</li>
                <li>The right to submit a complaint to the Information Regulator</li>
              </ul>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">7. Contact Information</h2>
              <p className="text-jet-600 mb-6">
                If you have any questions or concerns about this policy or how we process your personal information, please contact our Information Officer:
              </p>
              <div className="bg-jet-300 p-6 rounded-lg mb-6">
                <p className="text-champagne-600">Information Officer: Roxanne Bellingham</p>
                <p className="text-champagne-600">Email: info@blackroc.co.za</p>
                <p className="text-champagne-600">Phone: 011 972 1349</p>
                <p className="text-champagne-600">Address: 43 Phoenix Street, Kensington, 2094</p>
              </div>

              <h2 className="text-2xl font-bold text-jet-500 mb-6">8. Updates to this Policy</h2>
              <p className="text-jet-600">
                We may update this policy from time to time to reflect changes in our practices or applicable laws. The updated policy will be posted on our website with the effective date of the updated version.
              </p>
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

export default POPIPolicy; 