import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import HeroSection from "../components/HeroSection";

// Scroll-reveal animation variants
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.15, ease: [0.25, 0.4, 0.25, 1] as const }
  }),
};

const sectionFade = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.4, 0.25, 1] as const }
  },
};

const ctaScale = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] as const }
  },
};

const features = [
  { icon: '⚡', title: 'Lightning Fast', desc: 'Generate high-quality content in seconds with our optimized AI models' },
  { icon: '🎨', title: 'Creative Freedom', desc: 'Unlimited styles and customization options for your unique vision' },
  { icon: '🔒', title: 'Secure & Private', desc: 'Your creations are safe with enterprise-grade security' },
  { icon: '💎', title: 'Premium Quality', desc: 'Professional-grade output ready for commercial use' },
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <HeroSection />

      {/* Features Section */}
      <section className="py-20 px-8 bg-black/20">
        <motion.h2
          variants={sectionFade}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          className="text-3xl md:text-4xl font-bold text-center mb-16"
        >
          Why Choose <span className="text-gradient-shine">AI Create Studio</span>?
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              custom={i}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="bg-[#1e1e28]/50 backdrop-blur-sm p-8 rounded-2xl border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all group cursor-default"
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{feature.icon}</div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 text-center">
        <motion.div
          variants={ctaScale}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          className="bg-gradient-to-r from-primary/20 via-purple-500/10 to-secondary/20 p-12 md:p-20 rounded-3xl max-w-5xl mx-auto border border-white/10 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

          {/* Decorative floating orbs inside CTA */}
          <div className="absolute top-6 right-10 w-20 h-20 rounded-full bg-purple-500/10 blur-xl animate-float-slow pointer-events-none"></div>
          <div className="absolute bottom-6 left-10 w-16 h-16 rounded-full bg-cyan-400/10 blur-xl animate-float-delayed pointer-events-none"></div>

          <motion.h2
            variants={sectionFade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-3xl md:text-5xl font-bold mb-6 relative z-10"
          >
            Ready to Create Something <span className="text-gradient-shine">Amazing</span>?
          </motion.h2>

          <motion.p
            variants={sectionFade}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto relative z-10"
          >
            Join thousands of creators using AI to bring their ideas to life
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="px-10 py-4 bg-white text-black font-bold rounded-full text-lg hover:bg-gray-100 transition-all shadow-xl shadow-white/10 relative z-10"
            onClick={() => navigate("/register")}
          >
            Generate for free
          </motion.button>
        </motion.div>
      </section>
    </div>
  );
};

export default LandingPage;
