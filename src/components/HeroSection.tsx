import React from "react";
import { Button } from "./ui/button";
import { motion } from "framer-motion";

interface HeroSectionProps {
  tagline?: string;
  missionStatement?: string;
  ctaText?: string;
  backgroundImage?: string;
}

const HeroSection = ({
  tagline = "A CONSTRUCTION AGGREGATES SUPPLIER",
  missionStatement = "Black Roc (Pty) Ltd is a construction aggregates and brick distributor across Gauteng, founded in 2018. We deliver high-quality materials with exceptional service to meet all your construction needs.",
  ctaText = "Request a Quote",
  backgroundImage = "/images/hero.webp",
}: HeroSectionProps) => {
  return (
    <div className="relative w-full h-[600px] bg-jet-300 overflow-hidden">
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content Container */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          {/* Tagline */}
          <h2 className="text-buff-500 text-xl md:text-2xl font-bold tracking-wider mb-4">
            {tagline}
          </h2>

          {/* Main Heading */}
          <h1 className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Building <span className="text-buff-500">Foundations</span> for
            Success
          </h1>

          {/* Mission Statement */}
          <p className="text-gray-200 text-lg md:text-xl mb-8">
            {missionStatement}
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-buff-500 hover:bg-buff-600 text-jet-100 font-bold px-8 py-6 text-lg"
            >
              {ctaText}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-white text-white bg-white/10 hover:bg-white/20 px-8 py-6 text-lg transition-colors duration-200"
            >
              Learn More
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black to-transparent" />
      <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-buff-500/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
    </div>
  );
};

export default HeroSection;
