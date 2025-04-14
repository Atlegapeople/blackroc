import React from "react";
// Comment out navigate for now as we don't have proper router setup
// import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import HeroSection from "./HeroSection";
import ProductsSection from "./ProductsSection";
import ContactSection from "./ContactSection";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import logo from "../images/logo.png";
import {
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Users,
  Award,
  Target,
  Shield,
  Menu,
  X,
} from "lucide-react";

// ============================================
// COMPONENT: ScrollProgressBar
// ============================================
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

// ============================================
// MAIN COMPONENT: HomePage
// ============================================
const HomePage = () => {
  // const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // ============================================
  // Navigation handler
  // ============================================
  const handleNavigation = (item: string) => {
    if (item.toLowerCase() === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const element = document.getElementById(item.toLowerCase());
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const handleLogin = () => {
    // navigate('/login');
    window.location.href = '/login';
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ============================================
          Navigation Bar
          ============================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-champagne-400">
        <ScrollProgressBar />
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <img 
                src={logo} 
                alt="BlackRoc Logo" 
                className="h-14 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              />
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

              {/* Login Button (Desktop) */}
              <motion.button
                onClick={handleLogin}
                className="ml-4 px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Login
              </motion.button>
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

              {/* Login Button (Mobile) */}
              <motion.button
                onClick={handleLogin}
                className="block w-full px-4 py-2 rounded bg-black text-white hover:bg-gray-800 transition"
                whileHover={{ x: 5 }}
              >
                Login
              </motion.button>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* ============================================
          Main Content Sections
          ============================================ */}
      <div className="pt-20">
        {/* ============================================
            Hero Section
            ============================================ */}
        <HeroSection />

        {/* ============================================
            Products Section
            ============================================ */}
        <section id="products" className="py-16 bg-champagne-800">
          <ProductsSection />
        </section>

        {/* ============================================
            Services Section
            ============================================ */}
        <section id="services" className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-jet-500 mb-4">
                Our Services
              </h2>
              <p className="text-jet-600 max-w-2xl mx-auto text-lg">
                We provide comprehensive solutions for your construction needs
                with our reliable services.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="group bg-white p-8 rounded-xl shadow-lg border border-champagne-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-champagne-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-jet-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-jet-500 mb-4">Transport</h3>
                <p className="text-jet-600 mb-6 text-lg">
                  Reliable transportation services for all your construction
                  materials. We ensure timely delivery to your site.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 border-buff-500 text-jet-500 hover:bg-buff-500 hover:text-white transition-colors duration-200"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="group bg-white p-8 rounded-xl shadow-lg border border-champagne-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="bg-champagne-600 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-jet-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-jet-500 mb-4">
                  Site Clearance
                </h3>
                <p className="text-jet-600 mb-6 text-lg">
                  Professional site preparation and clearance services to get your
                  construction project off to a smooth start.
                </p>
                <Button
                  variant="outline"
                  className="mt-2 border-buff-500 text-jet-500 hover:bg-buff-500 hover:text-white transition-colors duration-200"
                >
                  Learn More <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ============================================
            About Section
            ============================================ */}
        <section id="about" className="py-20 bg-champagne-800">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl font-bold text-jet-500 mb-4">
                About BlackRoc
              </h2>
              <p className="text-jet-600 max-w-3xl mx-auto text-lg">
                Black Roc (Pty) Ltd is a construction aggregates and brick
                distributor across Gauteng and was founded in April 2018. The
                business is 100% female owned, with Roxanne Bellingham and
                Kgomotso Modise as Directors. The Directors have extensive
                experience in the manufacturing, construction and logistics
                industries, totalling 25 years.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                className="group bg-white p-8 rounded-xl shadow-lg border border-champagne-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-champagne-600 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Target className="h-6 w-6 text-jet-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-jet-500">Vision</h3>
                </div>
                <p className="text-jet-600 text-lg">
                  We aim to extend our reach so we can serve more Clients, and to
                  extend our products and services so we can create new
                  opportunities.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                className="group bg-white p-8 rounded-xl shadow-lg border border-champagne-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-champagne-600 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-6 w-6 text-jet-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-jet-500">
                    Core Strategies
                  </h3>
                </div>
                <p className="text-jet-600 text-lg">
                  At Black Roc, our experienced team works proudly, delivering
                  value to our Clients each and every day. We are committed to
                  providing you the highest quality products and best customer
                  service in the industry.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="group bg-white p-8 rounded-xl shadow-lg border border-champagne-400 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center mb-6">
                  <div className="bg-champagne-600 p-3 rounded-full mr-4 group-hover:scale-110 transition-transform duration-300">
                    <Award className="h-6 w-6 text-jet-500" />
                  </div>
                  <h3 className="text-2xl font-bold text-jet-500">
                    Black Empowerment
                  </h3>
                </div>
                <p className="text-jet-600 text-lg">
                  Black Roc is a Level 4 B-BBEE contributor. We would like to
                  create a platform where other black South Africans will be
                  mentored and up-skilled with the opportunities we want to
                  create, more especially for women and youth.
                </p>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-jet-400 text-white p-8 rounded-xl shadow-xl"
            >
              <div className="flex flex-col md:flex-row items-center justify-between">
                <div className="mb-6 md:mb-0">
                  <h3 className="text-3xl font-bold mb-2">
                    100% Female Owned Business
                  </h3>
                  <p className="text-champagne-500 text-lg">
                    Proudly contributing to transformation in the construction
                    industry
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="bg-buff-500/20 p-4 rounded-full mr-4">
                    <Users className="h-12 w-12 text-buff-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">Level 4 B-BBEE</p>
                    <p className="text-champagne-500 text-lg">Contributor</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ============================================
            Contact Section
            ============================================ */}
        <section id="contact" className="py-16 bg-white">
          <ContactSection />
        </section>

        {/* ============================================
            Footer Section
            ============================================ */}
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
                      href="#"
                      className="text-champagne-600 hover:text-buff-500"
                    >
                      Home
                    </a>
                  </li>
                  <li>
                    <a
                      href="#products"
                      className="text-champagne-600 hover:text-buff-500"
                    >
                      Products
                    </a>
                  </li>
                  <li>
                    <a
                      href="#services"
                      className="text-champagne-600 hover:text-buff-500"
                    >
                      Services
                    </a>
                  </li>
                  <li>
                    <a
                      href="#about"
                      className="text-champagne-600 hover:text-buff-500"
                    >
                      About Us
                    </a>
                  </li>
                  <li>
                    <a
                      href="#contact"
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
    </div>
  );
};

export default HomePage;
