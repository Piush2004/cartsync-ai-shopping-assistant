"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Ruler, Sparkles, ShoppingBag, ShieldCheck, Lock, Cpu, CheckCircle2, ArrowRight, Play, Star, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { staggerContainer, staggerItem, fadeInUp } from "@/lib/motion";
import { TextReveal } from "@/components/effects/TextReveal";
import { useState } from "react";

// Keep some minimal effects
import { MagneticButton } from "@/components/effects/MagneticButton";

const MotionImage = motion.create(Image);

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);

  return (
    <div className="relative min-h-screen bg-bg-primary text-text-primary overflow-x-hidden selection:bg-accent-blue/20 selection:text-text-primary">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 max-w-7xl mx-auto bg-bg-primary/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2 group cursor-pointer">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            whileHover={{ scale: 1.2, rotate: 0, transition: { duration: 0.2 } }}
          >
            <Sparkles className="w-6 h-6 text-accent-blue group-hover:text-accent-purple transition-colors" />
          </motion.div>
          <span className="font-bold text-xl tracking-tight text-text-primary">CartSync</span>
        </div>
        <div className="hidden md:flex items-center gap-8 font-medium text-sm text-text-secondary">
          <Link href="#how-it-works" className="hover:text-text-primary transition-colors">How it Works</Link>
          <Link href="#features" className="hover:text-text-primary transition-colors">Features</Link>
          <Link href="#compare" className="hover:text-text-primary transition-colors">Compare</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-text-secondary hover:text-text-primary transition-colors hidden sm:block">
            Sign in
          </Link>
          <Link href="/register">
            <MagneticButton>
              <Button variant="primary" size="sm" className="shadow-sm">Get Started</Button>
            </MagneticButton>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 md:pt-48 md:pb-32 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeInUp} className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent-blue/20 bg-accent-blue/5 text-accent-blue text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>The New Standard for Online Shopping</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] text-text-primary mb-6">
              Find Your Perfect <br />
              <span className="text-accent-blue">Fit with AI.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-text-secondary max-w-xl leading-relaxed mb-10">
              CartSync maps your unique body measurements to brand-specific size charts, eliminating the guesswork from online fashion.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button variant="primary" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 shadow-glow-blue group">
                  Start Measuring
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="w-full sm:w-auto text-lg px-8 py-6 group bg-bg-card">
                <Play className="mr-2 w-5 h-5 text-accent-purple" />
                Watch Demo
              </Button>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="w-full"
          >
            <div className="relative w-full h-[500px] bg-bg-card rounded-[2rem] border border-border shadow-2xl overflow-hidden flex flex-col">
              {/* Fake window controls */}
              <div className="h-10 border-b border-border bg-bg-secondary flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-emerald-400" />
              </div>
              {/* Content */}
              <div className="p-6 flex-1 flex flex-col gap-4 relative overflow-hidden bg-bg-primary">
                {/* Animated Measurement Card */}
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="absolute top-6 right-6 w-48 p-4 rounded-xl bg-bg-card border border-border shadow-lg z-10"
                >
                  <div className="text-xs text-text-secondary mb-1">Chest</div>
                  <div className="text-xl font-bold">42.5"</div>
                  <div className="w-full h-1 bg-bg-secondary mt-2 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} transition={{ delay: 1, duration: 1 }} className="h-full bg-accent-blue" />
                  </div>
                </motion.div>

                {/* AI Stylist Chat */}
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute bottom-6 left-6 w-64 p-4 rounded-xl bg-bg-card border border-border shadow-lg z-20"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent-purple/10 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-accent-purple" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-text-primary">AI Stylist</div>
                      <div className="text-xs text-text-secondary mt-1">Based on your measurements, a Medium in this jacket will be tight in the shoulders. Size up to Large for a perfect fit.</div>
                    </div>
                  </div>
                </motion.div>

                {/* Product Card */}
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 1.2, duration: 0.5 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 rounded-2xl bg-bg-card border border-border shadow-xl overflow-hidden z-10"
                >
                  <div className="h-48 bg-bg-secondary relative">
                    <Image src="/images/landing/step_4.jpg" alt="Product" fill className="object-cover" />
                    <div className="absolute top-2 right-2 px-2 py-1 bg-accent-emerald text-white text-xs font-bold rounded-md shadow-sm">
                      98% Fit
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-sm font-bold text-text-primary">Essential Jacket</div>
                    <div className="text-xs text-text-secondary mt-1">Recommended: Large</div>
                  </div>
                </motion.div>
                
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 bg-[url('/images/noise.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-transparent to-accent-purple/5 pointer-events-none" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-12 border-y border-border bg-bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Lock, title: "Secure", desc: "Enterprise-grade security" },
              { icon: ShieldCheck, title: "Privacy-first", desc: "Your data is yours" },
              { icon: Cpu, title: "Explainable AI", desc: "Transparent reasoning" },
              { icon: CheckCircle2, title: "Accurate", desc: "98% recommendation accuracy" },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center text-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary">{feature.title}</h4>
                  <p className="text-sm text-text-secondary mt-1">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-32 px-4 bg-bg-primary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-text-primary">How It Works</h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">Four simple steps to revolutionize how you shop for clothes online.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-[120px] left-1/2 -translate-x-1/2 w-[75%] h-0.5 bg-gradient-to-r from-accent-blue/20 via-accent-purple/50 to-accent-blue/20 -z-10" />

            {[
              { step: 1, title: "Upload Photo", image: "/images/landing/step_1.jpg", desc: "Take a simple front and side profile picture." },
              { step: 2, title: "AI Extracts", image: "/images/landing/step_2.jpg", desc: "Our engine maps your exact body measurements." },
              { step: 3, title: "AI Stylist", image: "/images/landing/step_3.jpg", desc: "Chat with your stylist to define your preferences." },
              { step: 4, title: "Perfect Fit", image: "/images/landing/step_4.jpg", desc: "Get high-confidence size recommendations instantly." },
            ].map((item, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex flex-col items-center text-center relative"
              >
                <div className="w-10 h-10 rounded-full bg-accent-blue text-white font-bold flex items-center justify-center mb-6 shadow-lg shadow-accent-blue/30 z-10">
                  {item.step}
                </div>
                <div className="w-full aspect-[4/5] rounded-2xl overflow-hidden mb-6 border border-border shadow-md bg-bg-card relative">
                  <Image src={item.image} alt={item.title} fill className="object-cover" />
                </div>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-text-secondary text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Detail */}
      <section id="features" className="py-32 px-4 bg-bg-secondary overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col gap-32">
          
          {/* Feature 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-6 border border-accent-blue/20">
                <Ruler className="w-7 h-7 text-accent-blue" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">AI Measurement Engine</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Say goodbye to measuring tapes. Our advanced computer vision models automatically extract over 30 precise body measurements from just two photos, accurate to within a fraction of an inch.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 relative h-[400px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-border bg-bg-card"
            >
              <Image src="/images/landing/feature_1.jpg" alt="Measurement" fill className="object-cover" />
            </motion.div>
          </div>

          {/* Feature 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative h-[400px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-border bg-bg-card"
            >
              <Image src="/images/landing/feature_2.jpg" alt="Intelligence" fill className="object-cover" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="w-14 h-14 rounded-2xl bg-accent-purple/10 flex items-center justify-center mb-6 border border-accent-purple/20">
                <Sparkles className="w-7 h-7 text-accent-purple" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Product Intelligence</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                We don't just guess your size. We cross-reference your exact measurements against proprietary brand size charts and material stretch factors to give you a definitive Fit Score for every garment.
              </p>
            </motion.div>
          </div>

          {/* Feature 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div 
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="w-14 h-14 rounded-2xl bg-accent-emerald/10 flex items-center justify-center mb-6 border border-accent-emerald/20">
                <Cpu className="w-7 h-7 text-accent-emerald" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Personal Knowledge Graph</h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                Every interaction makes CartSync smarter. We build an interconnected graph of your preferences, past purchases, and fit feedback to continuously refine your personal style algorithm.
              </p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 md:order-2 relative h-[400px] w-full rounded-[2rem] overflow-hidden shadow-xl border border-border bg-bg-card"
            >
              <Image src="/images/landing/feature_3.jpg" alt="Knowledge Graph" fill className="object-cover" />
            </motion.div>
          </div>

        </div>
      </section>

      {/* Comparison */}
      <section id="compare" className="py-32 px-4 bg-bg-primary">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">The Old Way vs. CartSync</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 rounded-[2rem] bg-bg-secondary border border-border flex flex-col gap-6">
              <h3 className="text-2xl font-bold text-text-muted mb-4">Traditional Shopping</h3>
              {[
                "Guessing between M and L",
                "Buying multiple sizes to return one",
                "Generic size charts that don't make sense",
                "Ignoring material stretch",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 opacity-50 text-text-primary font-medium text-lg">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center flex-shrink-0">✕</div>
                  {text}
                </div>
              ))}
            </div>

            <div className="p-8 rounded-[2rem] bg-bg-card shadow-xl shadow-accent-blue/5 border border-accent-blue/20 flex flex-col gap-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl -z-10" />
              <h3 className="text-2xl font-bold text-accent-blue mb-4">CartSync Experience</h3>
              {[
                "98% accurate size prediction",
                "Zero return anxiety",
                "Personalized fit reasoning (e.g. 'Tight in shoulders')",
                "Material intelligence built-in",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 text-text-primary font-medium text-lg">
                  <div className="w-8 h-8 rounded-full bg-accent-emerald/20 text-accent-emerald flex items-center justify-center flex-shrink-0">✓</div>
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-32 px-4 bg-bg-secondary">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Loved by Shoppers</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: "Sarah K.", role: "Fashion Enthusiast", text: "CartSync completely changed how I shop online. I used to return 50% of what I bought. Now? Everything fits perfectly.", avatar: "/images/landing/avatar_1.jpg" },
              { name: "James T.", role: "Early Adopter", text: "The AI explanation of WHY a medium would be too tight in my shoulders gave me the confidence to size up. It was spot on.", avatar: "/images/landing/avatar_2.jpg" },
              { name: "Elena R.", role: "Designer", text: "Finally, a tech product that understands that fashion isn't just numbers. The UI is gorgeous and the AI feels magical.", avatar: "/images/landing/avatar_3.jpg" }
            ].map((testimonial, i) => (
              <div key={i} className="p-8 rounded-[2rem] bg-bg-card border border-border flex flex-col">
                <div className="flex gap-1 mb-6">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-5 h-5 fill-accent-amber text-accent-amber" />)}
                </div>
                <p className="text-lg text-text-primary mb-8 flex-1">"{testimonial.text}"</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden relative">
                    <Image src={testimonial.avatar} alt={testimonial.name} fill className="object-cover" />
                  </div>
                  <div>
                    <h4 className="font-bold">{testimonial.name}</h4>
                    <p className="text-sm text-text-secondary">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-4 bg-bg-primary">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">Frequently Asked Questions</h2>
          </div>
          <div className="flex flex-col gap-4">
            {[
              { q: "How accurate is CartSync?", a: "Our AI engine achieves 98% accuracy when recommending sizes, factoring in your exact measurements and the specific brand's cutting patterns." },
              { q: "How is my data protected?", a: "We use enterprise-grade encryption. Your photos are processed instantly to extract measurements and are never stored on our servers." },
              { q: "Can I use any brand?", a: "We currently support over 50 top fashion brands, with new catalogs being added weekly based on user demand." }
            ].map((faq, i) => (
              <details key={i} className="group border border-border rounded-2xl bg-bg-card overflow-hidden">
                <summary className="flex justify-between items-center font-bold cursor-pointer list-none p-6 text-lg hover:text-accent-blue transition-colors">
                  {faq.q}
                  <span className="transition group-open:rotate-180">
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </summary>
                <div className="text-text-secondary p-6 pt-0 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-32 px-4 text-center border-t border-border bg-bg-secondary overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/5 via-transparent to-accent-purple/5" />
        
        <motion.div 
          initial="hidden" 
          whileInView="visible" 
          viewport={{ once: true }}
          variants={fadeInUp}
          className="max-w-3xl mx-auto relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-8">
            <TextReveal text="Ready to stop guessing your size?" />
          </h2>
          <p className="text-xl text-text-secondary mb-12 max-w-xl mx-auto">Join thousands of shoppers who have found their perfect fit. Takes less than 2 minutes.</p>
          <Link href="/register">
            <MagneticButton>
              <Button variant="primary" size="lg" className="px-12 py-6 text-xl relative group shadow-xl shadow-accent-blue/20">
                Start Your AI Fit Journey
                <ArrowRight className="ml-2 w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </MagneticButton>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="pt-16 pb-8 px-6 bg-bg-card border-t border-border text-text-secondary text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Sparkles className="w-5 h-5 text-accent-blue" />
            <span className="font-bold text-base text-text-primary tracking-tight">CartSync</span>
            <span className="ml-2 opacity-60">© 2026 CartSync Inc.</span>
          </div>
          
          <div className="flex gap-8 font-medium">
            {["Privacy", "Terms", "Twitter", "Contact"].map((link) => (
              <a key={link} href="#" className="hover:text-text-primary transition-colors">
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
