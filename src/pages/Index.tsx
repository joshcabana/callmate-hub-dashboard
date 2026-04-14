import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, Variants } from "framer-motion";
import { PhoneCall, Zap, ShieldCheck, BarChart3, ChevronRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";

const navVariants: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } },
};

const heroVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.2 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Index() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">

      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute top-[40%] -right-[20%] w-[50%] h-[50%] rounded-full bg-accent/10 blur-[120px]" />
      </div>

      {/* Navigation */}
      <motion.nav
        variants={navVariants}
        initial="hidden"
        animate="visible"
        className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <PhoneCall className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">CallMate AI</span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#demo" className="hover:text-foreground transition-colors">Demo</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </motion.nav>

      <main className="relative z-10 w-full">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-6 max-w-7xl mx-auto text-center flex flex-col items-center">
          <motion.div
            variants={heroVariants}
            initial="hidden"
            animate="visible"
            className="max-w-4xl flex flex-col items-center gap-6"
          >
            <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium uppercase tracking-wider mb-2">
              <Zap className="h-3.5 w-3.5" /> Next-Gen Autonomous Agents
            </motion.div>
            <motion.h1 variants={itemVariants} className="font-display text-5xl md:text-7xl font-bold tracking-tight leading-tight text-foreground">
              Automate your call center with <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">hyper-realistic AI.</span>
            </motion.h1>
            <motion.p variants={itemVariants} className="text-lg md:text-xl text-muted-foreground max-w-2xl mt-2 mb-4 leading-relaxed">
              Zero extraction errors. Instant latency. Handle inbound and outbound sales, support, and dispatch with autonomous agents that actually sound human and learn from every interaction.
            </motion.p>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
              <Button asChild size="lg" className="h-12 px-8 text-base bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-full sm:w-auto">
                <Link to="/login">Start building for free <ChevronRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8 text-base bg-secondary border-border hover:bg-secondary/80 text-foreground rounded-full w-full sm:w-auto" onClick={() => setIsPlaying(!isPlaying)}>
                <Play className="mr-2 h-4 w-4 text-primary" /> Hear a Live Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Interactive Interface Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8, ease: "easeOut" }}
            className="w-full max-w-5xl mt-20 relative"
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur-xl opacity-50" />
            <div className="relative rounded-2xl border border-border bg-card/80 backdrop-blur-xl shadow-2xl overflow-hidden aspect-video flex items-center justify-center">
              <div className="absolute top-0 w-full h-10 border-b border-border bg-secondary/50 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/50" />
                <div className="w-3 h-3 rounded-full bg-warning/50" />
                <div className="w-3 h-3 rounded-full bg-success/50" />
              </div>
              
              <div className="flex flex-col items-center gap-4 mt-10">
                <div className="relative w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border border-primary/30">
                  <div className="absolute inset-0 rounded-full border border-primary/40 animate-ping" />
                  <PhoneCall className="h-10 w-10 text-primary animate-pulse" />
                </div>
                <div className="text-xl font-display font-medium text-foreground">CallMate Support Agent</div>
                <div className="flex gap-1.5 items-center">
                  <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                  <span className="text-sm text-success font-medium">Live connection...</span>
                </div>
                
                {/* Fake audio waveform */}
                <div className="flex gap-1 items-center justify-center mt-4 h-8">
                  {[4, 8, 5, 12, 16, 7, 10, 5, 3].map((height, i) => (
                    <motion.div 
                      key={i} 
                      className="w-1.5 bg-primary/80 rounded-full"
                      animate={{ height: isPlaying ? [height*2, height*4, height*2] : height*2 }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.1 }}
                      style={{ height: `${height*2}px` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Features / Value Props */}
        <section id="features" className="py-24 bg-card border-y border-border relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">Enterprise-Grade Architecture</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Designed for scale. Deployed in seconds. Seamlessly integrated with your existing data environment.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "100% Guaranteed Extraction",
                  description: "Unlike traditional LLMs, our highly tuned extraction engine ensures precise variable mapping (names, budgets, intent) into structured JSON with zero hallucinations.",
                  icon: BarChart3,
                },
                {
                  title: "Ultra-Low Latency Conversions",
                  description: "Powered by edge-deployed voice synthesis pipelines. With sub-400ms turnaround times, customers never experience the dreaded 'AI pause'.",
                  icon: Zap,
                },
                {
                  title: "Bank-Grade Security",
                  description: "End-to-end Row Level Security via Supabase. Calls are processed statelessly, and sensitive transcripts are stored securely in isolated tenant environments.",
                  icon: ShieldCheck,
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="p-6 rounded-2xl border border-border bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative text-center">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-primary/10 to-transparent" />
          </div>
          <div className="max-w-3xl mx-auto px-6 relative z-10 flex flex-col items-center">
            <h2 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-6">Ready to scale your voice operations?</h2>
            <p className="text-xl text-muted-foreground mb-8">Deploy a production-ready AI agent in under 5 minutes. No credit card required.</p>
            <Button asChild size="lg" className="h-14 px-10 text-lg bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-[0_0_40px_rgba(14,165,233,0.3)]">
              <Link to="/login">Launch Dashboard</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-12 bg-card/50 backdrop-blur-sm relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <PhoneCall className="h-5 w-5" />
            <span className="font-display font-semibold">CallMate AI</span>
          </div>
          <div className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} ThinkToShare Pty Ltd. All rights reserved.
          </div>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
