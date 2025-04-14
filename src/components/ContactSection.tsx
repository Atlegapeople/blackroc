import React from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent } from "./ui/card";
import { MapPin, Phone, Mail } from "lucide-react";

interface ContactSectionProps {
  title?: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  mapUrl?: string;
}

const ContactSection = ({
  title = "Get in Touch",
  description = "We'd love to hear from you. Fill out the form below and we'll get back to you as soon as possible.",
  address = "43 Phoenix Street, Kensington, 2094",
  phone = "011 972 1349",
  email = "info@blackroc.co.za",
  mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.9982332562716!2d28.1062693!3d-26.1929283!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1e950e9df6a8b1d7%3A0x4c7944a5b2da25ab!2s43%20Phoenix%20St%2C%20Kensington%2C%20Johannesburg%2C%202094!5e0!3m2!1sen!2sza!4v1651234567890!5m2!1sen!2sza",
}: ContactSectionProps) => {
  return (
    <section className="py-16 px-4 bg-champagne-800">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-jet-500 sm:text-4xl mb-4">
            {title}
          </h2>
          <p className="text-lg text-jet-600 max-w-2xl mx-auto">
            {description}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <Card className="shadow-lg">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      First Name *
                    </label>
                    <Input id="firstName" placeholder="First Name" required />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Last Name *
                    </label>
                    <Input id="lastName" placeholder="Last Name" required />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Phone Number *
                  </label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Phone Number"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email Address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmEmail"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Confirm Email *
                  </label>
                  <Input
                    id="confirmEmail"
                    type="email"
                    placeholder="Confirm Email Address"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Comment or Message *
                  </label>
                  <Textarea
                    id="message"
                    placeholder="Your message"
                    className="min-h-[120px]"
                    required
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-buff-500 hover:bg-buff-600 text-white"
                >
                  Submit
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Contact Information and Map */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h3 className="text-xl font-semibold mb-6">
                Contact Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-6 w-6 text-buff-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Find us at the office</h4>
                    <p className="text-gray-600 mt-1">{address}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-6 w-6 text-buff-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Give us a ring</h4>
                    <p className="text-gray-600 mt-1">{phone}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-6 w-6 text-buff-500 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Send us an email</h4>
                    <p className="text-gray-600 mt-1">{email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Google Map */}
            <div className="h-[300px] rounded-lg overflow-hidden shadow-lg">
              <iframe
                src={mapUrl}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="BlackRoc Location"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
