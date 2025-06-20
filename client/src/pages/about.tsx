import { Award, Leaf, Users, Globe, Target, Eye } from "lucide-react";

const About = () => {
  const values = [
    {
      icon: <Award className="h-8 w-8 text-white" />,
      title: "Quality Excellence",
      description: "We maintain the highest standards in all our products and processes, with ISO certifications ensuring consistent quality.",
    },
    {
      icon: <Leaf className="h-8 w-8 text-white" />,
      title: "Environmental Responsibility",
      description: "Committed to sustainable manufacturing practices and developing eco-friendly chemical solutions.",
    },
    {
      icon: <Users className="h-8 w-8 text-white" />,
      title: "Customer Focus",
      description: "Our customers' success is our priority. We provide tailored solutions and exceptional service.",
    },
    {
      icon: <Globe className="h-8 w-8 text-white" />,
      title: "Global Reach",
      description: "Serving customers in over 40 countries with reliable supply chains and local support.",
    },
  ];

  return (
    <div className="pt-20">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-primary to-secondary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">About Momtazchem</h1>
            <p className="text-xl max-w-3xl mx-auto">
              Leading the chemical industry with innovation, quality, and sustainability for over 25 years.
            </p>
          </div>
        </div>
      </section>

      {/* Company Story */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Founded in 1999, Momtazchem began as a small chemical manufacturing company with a vision to provide high-quality chemical solutions to industries worldwide. Over the past 25 years, we have grown into a leading manufacturer serving four key market segments.
              </p>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Our journey has been marked by continuous innovation, strategic expansion, and an unwavering commitment to quality. Today, we operate state-of-the-art manufacturing facilities and serve customers in over 40 countries across the globe.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                As we look to the future, we remain dedicated to advancing chemical science, supporting our customers' success, and contributing to a more sustainable world.
              </p>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Modern chemical manufacturing facility"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-blue rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Our Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To develop and manufacture innovative chemical solutions that enhance industrial processes, improve product performance, and contribute to sustainable development while maintaining the highest standards of quality and safety.
              </p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-primary-green rounded-lg flex items-center justify-center mr-4">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Our Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To be the world's most trusted partner in chemical solutions, recognized for our innovation, sustainability, and commitment to advancing industries while protecting the environment for future generations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The principles that guide our decisions and shape our culture every day.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="text-center">
                <div className={`w-16 h-16 ${
                  index % 2 === 0 ? 'bg-primary-blue' : 'bg-primary-green'
                } rounded-lg flex items-center justify-center mx-auto mb-4`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team & Facilities */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Team & Expertise</h2>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                Our success is built on the expertise and dedication of our team. We employ over 500 professionals, including chemical engineers, research scientists, quality specialists, and industry experts.
              </p>
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold primary-blue mb-2">500+</div>
                  <div className="text-gray-600">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold primary-green mb-2">50+</div>
                  <div className="text-gray-600">R&D Scientists</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold accent-orange mb-2">15+</div>
                  <div className="text-gray-600">Manufacturing Sites</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold primary-blue mb-2">99.8%</div>
                  <div className="text-gray-600">Quality Rate</div>
                </div>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
                alt="Chemical research laboratory"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Certifications & Compliance</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We maintain the highest industry standards and certifications to ensure quality, safety, and environmental responsibility.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-certificate text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">ISO 9001:2015</h3>
              <p className="text-gray-600 text-sm">Quality Management Systems</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-shield-alt text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">ISO 14001</h3>
              <p className="text-gray-600 text-sm">Environmental Management</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-hard-hat text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">OHSAS 18001</h3>
              <p className="text-gray-600 text-sm">Occupational Health & Safety</p>
            </div>
            <div className="text-center p-6 bg-gray-50 rounded-lg">
              <i className="fas fa-check-circle text-primary text-4xl mb-4"></i>
              <h3 className="font-semibold text-gray-900 mb-2">REACH Compliance</h3>
              <p className="text-gray-600 text-sm">European Chemicals Regulation</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
