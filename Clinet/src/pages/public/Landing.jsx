import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiTruck, 
  FiShield, 
  FiClock, 
  FiBarChart2, 
  FiUsers, 
  FiGlobe, 
  FiAnchor, 
  FiTrendingUp, 
  FiChevronRight, 
  FiFileText, 
  FiCheckCircle 
} from 'react-icons/fi';

export default function Landing() {
  const [activeStep, setActiveStep] = useState(0);

  const features = [
    { 
      icon: FiTruck, 
      title: 'Global Supply Chain', 
      description: 'Streamlined multi-modal logistics linking continents by land, air, and sea.' 
    },
    { 
      icon: FiShield, 
      title: 'Certified Quality Control', 
      description: 'Strict testing and international compliance certification at every loading point.' 
    },
    { 
      icon: FiClock, 
      title: 'Precision Scheduling', 
      description: 'On-time delivery performance backed by robust fallback dispatch networks.' 
    },
    { 
      icon: FiBarChart2, 
      title: 'Trade Intelligence', 
      description: 'Real-time commodity pricing indexes and global demand forecasting.' 
    },
    { 
      icon: FiUsers, 
      title: 'Multilingual Support', 
      description: 'Local representative support in multiple jurisdictions to smooth customs clearance.' 
    },
    { 
      icon: FiGlobe, 
      title: 'Bilateral Trade Networks', 
      description: 'Established government and institutional relationships in over 50 countries.' 
    }
  ];

  const products = [
    { 
      name: 'Natural Stones', 
      image: 'https://images.unsplash.com/photo-1549887534-1541e9326642?w=600', 
      category: 'Minerals & Construction',
      description: 'Premium Indian Granite, Marble, Slate, and Sandstone cut to international grade specifications.' 
    },
    { 
      name: 'Industrial Coal', 
      image: 'https://images.unsplash.com/photo-1581094288338-1a3eb6e1c5a4?w=600', 
      category: 'Energy Commodities',
      description: 'High-grade bituminous and sub-bituminous thermal coal for industrial and power operations.' 
    },
    { 
      name: 'Premium Tea', 
      image: 'https://images.unsplash.com/photo-1544787219-7f47ccb77374?w=600', 
      category: 'Agro-Products',
      description: 'Selected CTC and Orthodox tea leaves sourced directly from India\'s top tea-growing estates.' 
    },
    { 
      name: 'Basmati Rice', 
      image: 'https://images.unsplash.com/photo-1586201375761-83865001b0e5?w=600', 
      category: 'Food Supplies',
      description: 'Long-grain, aromatic aged Basmati and non-basmati varieties processed in state-of-the-art mills.' 
    }
  ];

  const steps = [
    {
      title: 'Sourcing & Verification',
      description: 'We directly contract with verified mines and plantations, performing on-site pre-inspection of product grade.'
    },
    {
      title: 'Quality Certification',
      description: 'Independent inspection agencies (e.g. SGS) perform laboratory analysis to certify quality standards.'
    },
    {
      title: 'Customs & Documents',
      description: 'Our in-house compliance team handles bill of lading, certificates of origin, phytosanitary certs, and customs clearance.'
    },
    {
      title: 'Secure Marine Transit',
      description: 'Commodities are dispatched via top-tier container lines and bulk carriers with real-time tracking.'
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800 font-sans">
      {/* Premium Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden py-32 md:py-40">
        {/* Background Decorative Mesh & Gradients */}
        <div className="absolute inset-0 opacity-15">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500 blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500 blur-3xl"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center space-x-2 bg-blue-900/40 text-blue-300 border border-blue-800 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-6">
              <FiAnchor className="animate-pulse mr-1" /> India Trade Overseas (ITO)
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
              Global Sourcing &amp; <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Exim Logistics</span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Your institutional gateway to premium natural stones, industrial minerals, and raw agro-commodities. Delivered worldwide on schedule.
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
              <Link 
                to="/quote-request" 
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-base font-semibold px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition duration-200"
              >
                Request FOB/CIF Quote
              </Link>
              <Link 
                to="/products" 
                className="w-full sm:w-auto bg-slate-900 text-slate-200 border border-slate-800 hover:bg-slate-800 hover:text-white text-base font-semibold px-8 py-4 rounded-xl hover:-translate-y-0.5 transition duration-200"
              >
                Explore Catalog
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Floating Trust stats */}
      <section className="-mt-8 relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="text-center pt-4 md:pt-0">
              <div className="text-4xl md:text-5xl font-extrabold text-blue-600">50+</div>
              <div className="text-slate-500 text-sm font-medium mt-2 uppercase tracking-wide">Destination Ports</div>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <div className="text-4xl md:text-5xl font-extrabold text-blue-600">100%</div>
              <div className="text-slate-500 text-sm font-medium mt-2 uppercase tracking-wide">Quality Assured</div>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <div className="text-4xl md:text-5xl font-extrabold text-blue-600">10K+</div>
              <div className="text-slate-500 text-sm font-medium mt-2 uppercase tracking-wide">Metric Tons Shipped</div>
            </div>
            <div className="text-center pt-4 md:pt-0">
              <div className="text-4xl md:text-5xl font-extrabold text-blue-600">24/7</div>
              <div className="text-slate-500 text-sm font-medium mt-2 uppercase tracking-wide">Live Vessel Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Product categories */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Core Import-Export Commodities</h2>
          <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
            We inspect and pack each bulk cargo shipment with dedicated logistics experts handling transport constraints.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((product, index) => (
            <div key={index} className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg border border-slate-200/80 transition duration-300 flex flex-col sm:flex-row">
              <div className="sm:w-1/2 h-56 sm:h-auto overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                />
              </div>
              <div className="sm:w-1/2 p-8 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{product.category}</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-4 mb-2">{product.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{product.description}</p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link to="/quote-request" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center">
                    Request CIF Quote <FiChevronRight className="ml-1" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Client workflow timeline */}
      <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_800px_at_100%_200px,#3b82f6,transparent)]"></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Rigorous Trade Workflow</h2>
            <p className="text-slate-400 mt-4 text-lg">We manage the complexities so your procurement remains risk-free.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Steps buttons */}
            <div className="lg:col-span-5 space-y-4">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={() => setActiveStep(index)}
                  className={`w-full text-left p-6 rounded-xl border transition duration-200 flex items-start space-x-4 ${
                    activeStep === index
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-md'
                      : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                    activeStep === index ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{step.title}</h3>
                  </div>
                </button>
              ))}
            </div>

            {/* Step Content */}
            <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-8 min-h-[300px] flex flex-col justify-between shadow-2xl relative">
              <div>
                <FiCheckCircle className="text-blue-500 mb-6" size={40} />
                <h3 className="text-2xl font-bold mb-4 text-white">{steps[activeStep].title}</h3>
                <p className="text-slate-300 leading-relaxed text-lg">{steps[activeStep].description}</p>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center text-sm text-slate-400">
                <span>Phase {activeStep + 1} of 4</span>
                <Link to="/contact" className="text-blue-400 font-semibold hover:underline flex items-center">
                  Talk to a Compliance Specialist <FiChevronRight className="ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Features grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Why Sourcing Partners Choose ITO</h2>
          <p className="text-slate-600 mt-4 text-lg max-w-2xl mx-auto">
            With decades of coupled shipping, logistics, and legal compliance expertise.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-sm hover:shadow-md transition">
              <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-xl mb-6">
                <feature.icon size={26} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modern Call to Action */}
      <section className="bg-gradient-to-r from-blue-700 via-blue-800 to-indigo-900 text-white py-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white rounded-full"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] border border-white rounded-full"></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">Partner with India Trade Overseas</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Ready to secure regular commodity deliveries or customized natural stone blocks? Get in touch with our team today for direct port-to-port pricing.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Link 
              to="/quote-request" 
              className="w-full sm:w-auto bg-white text-blue-900 font-bold px-8 py-4 rounded-xl shadow-lg hover:bg-slate-100 hover:shadow-xl transition duration-200"
            >
              Get FOB / CIF Pricing
            </Link>
            <Link 
              to="/contact" 
              className="w-full sm:w-auto bg-transparent border-2 border-white/80 hover:border-white text-white font-bold px-8 py-4 rounded-xl transition duration-200"
            >
              Contact Commercial Office
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
