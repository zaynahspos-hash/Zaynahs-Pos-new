import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Hexagon, Check, ArrowRight, Shield, Zap, Globe, LayoutDashboard, BarChart3, Layers, Menu, X, Mail, Phone, MapPin, FileText, Briefcase, MessageSquare, History, Puzzle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { APP_CONFIG } from '../config';

// Modal Content Definitions (unchanged)
const MODAL_CONTENT: Record<string, { title: string; icon: React.ElementType; content: React.ReactNode }> = {
  'about': {
    title: 'About Us',
    icon: Hexagon,
    content: (
      <div className="space-y-4 text-slate-600 leading-relaxed">
        <p><strong>{APP_CONFIG.name}</strong> is a forward-thinking software solutions provider dedicated to empowering small and medium-sized businesses. Founded with a mission to simplify retail operations, we combine cutting-edge technology with user-centric design.</p>
        <p>Our platform handles everything from inventory management to advanced analytics, allowing store owners to focus on what matters most—growth and customer satisfaction.</p>
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mt-4">
          <h4 className="font-semibold text-slate-800 mb-2">Our Mission</h4>
          <p className="text-sm">To democratize enterprise-grade retail technology for everyone, everywhere.</p>
        </div>
      </div>
    )
  },
  'careers': {
    title: 'Join Our Team',
    icon: Briefcase,
    content: (
      <div className="space-y-4 text-slate-600">
        <p>We are always on the lookout for passionate individuals who want to make a difference.</p>
        <div className="space-y-3 mt-4">
          <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <h5 className="font-bold text-slate-800">Senior React Engineer</h5>
            <p className="text-xs text-slate-500">Remote • Full Time</p>
          </div>
          <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <h5 className="font-bold text-slate-800">Backend Node.js Developer</h5>
            <p className="text-xs text-slate-500">Lahore/Hybrid • Full Time</p>
          </div>
          <div className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <h5 className="font-bold text-slate-800">Product Designer (UI/UX)</h5>
            <p className="text-xs text-slate-500">Remote • Contract</p>
          </div>
        </div>
        <p className="text-sm mt-4">Send your CV and portfolio to <span className="text-emerald-600 font-medium">careers@zaynahspos.com</span></p>
      </div>
    )
  },
  'blog': {
    title: 'Latest Updates',
    icon: MessageSquare,
    content: (
      <div className="space-y-4 text-slate-600">
        <div className="pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">New Feature</span>
          <h4 className="font-bold text-slate-800 text-lg">Introducing AI-Powered Inventory Forecasting</h4>
          <p className="text-sm mt-1">Learn how our new AI model helps you prevent stockouts and reduce waste.</p>
          <span className="text-xs text-slate-400 mt-2 block">Oct 24, 2023 • 5 min read</span>
        </div>
        <div className="pb-4 border-b border-slate-100">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wide">Case Study</span>
          <h4 className="font-bold text-slate-800 text-lg">How 'Cafe Delight' Doubled Revenue in 3 Months</h4>
          <p className="text-sm mt-1">A deep dive into how streamlined operations led to massive growth.</p>
          <span className="text-xs text-slate-400 mt-2 block">Sep 12, 2023 • 8 min read</span>
        </div>
        <button className="w-full py-2 text-center text-sm font-bold text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors">
          View All Posts
        </button>
      </div>
    )
  },
  'contact': {
    title: 'Contact Us',
    icon: Mail,
    content: (
      <div className="space-y-4 text-slate-600">
        <p>Have questions? We'd love to hear from you.</p>
        <div className="grid gap-4">
           <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Phone size={18}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Call / WhatsApp</p>
                 <p className="font-medium text-slate-900">{APP_CONFIG.whatsapp}</p>
              </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><Mail size={18}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Email Support</p>
                 <p className="font-medium text-slate-900">{APP_CONFIG.email}</p>
              </div>
           </div>
           <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <div className="bg-emerald-100 p-2 rounded-full text-emerald-600"><MapPin size={18}/></div>
              <div>
                 <p className="text-xs text-slate-500 uppercase font-bold">Visit HQ</p>
                 <p className="font-medium text-slate-900">{APP_CONFIG.address}</p>
              </div>
           </div>
        </div>
      </div>
    )
  },
  'changelog': {
    title: 'Changelog',
    icon: History,
    content: (
      <div className="space-y-4 text-slate-600">
        <div className="relative pl-4 border-l-2 border-slate-200 space-y-4">
          <div className="relative">
             <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white"></div>
             <h5 className="font-bold text-slate-800">v{APP_CONFIG.version} (Current)</h5>
             <ul className="text-sm list-disc pl-4 mt-1 space-y-1">
               <li>Added Offline Mode support (PWA)</li>
               <li>New Global Search functionality</li>
               <li>Enhanced mobile responsiveness</li>
             </ul>
          </div>
          <div className="relative">
             <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-slate-300 border-2 border-white"></div>
             <h5 className="font-bold text-slate-800">v1.1.0</h5>
             <ul className="text-sm list-disc pl-4 mt-1 space-y-1">
               <li>Launched Super Admin Dashboard</li>
               <li>Integrated Email Notifications</li>
               <li>Payment Approval Workflow</li>
             </ul>
          </div>
        </div>
      </div>
    )
  },
  'integrations': {
    title: 'Integrations',
    icon: Puzzle,
    content: (
      <div className="text-center space-y-4">
        <p className="text-slate-600 text-sm">Seamlessly connect with the tools you already use.</p>
        <div className="grid grid-cols-3 gap-4">
           {['Stripe', 'PayPal', 'Slack', 'Shopify', 'WooCommerce', 'QuickBooks'].map(tool => (
             <div key={tool} className="flex flex-col items-center justify-center p-3 border border-slate-100 rounded-xl bg-slate-50">
                <div className="w-8 h-8 bg-white rounded-full shadow-sm mb-2"></div>
                <span className="text-xs font-medium text-slate-700">{tool}</span>
             </div>
           ))}
        </div>
        <button className="text-emerald-600 text-sm font-bold hover:underline">View API Documentation</button>
      </div>
    )
  },
  'privacy': {
    title: 'Privacy Policy',
    icon: Shield,
    content: (
      <div className="space-y-3 text-sm text-slate-600 max-h-[300px] overflow-y-auto pr-2">
        <p><strong>Last updated: October 2024</strong></p>
        <p>At {APP_CONFIG.name}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or use our POS application.</p>
        <h5 className="font-bold text-slate-800">1. Information We Collect</h5>
        <p>We collect personal information that you voluntarily provide to us when you register on the Application, express an interest in obtaining information about us or our products and Services.</p>
        <h5 className="font-bold text-slate-800">2. Use of Information</h5>
        <p>We use the information we collect or receive to facilitate account creation and logon process, send you administrative information, and fulfill and manage your orders.</p>
        <h5 className="font-bold text-slate-800">3. Data Security</h5>
        <p>We use administrative, technical, and physical security measures to help protect your personal information.</p>
      </div>
    )
  },
  'terms': {
    title: 'Terms of Service',
    icon: FileText,
    content: (
      <div className="space-y-3 text-sm text-slate-600 max-h-[300px] overflow-y-auto pr-2">
        <p><strong>Agreement to Terms</strong></p>
        <p>These Terms of Use constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you") and {APP_CONFIG.name} ("Company", "we", "us", or "our").</p>
        <h5 className="font-bold text-slate-800">1. User Representations</h5>
        <p>By using the Application, you represent and warrant that: (1) all registration information you submit will be true, accurate, current, and complete; (2) you will maintain the accuracy of such information.</p>
        <h5 className="font-bold text-slate-800">2. Subscriptions</h5>
        <p>You agree to pay all fees and charges to your account in accordance with the fees, charges, and billing terms in effect at the time a fee or charge is due and payable.</p>
      </div>
    )
  }
};

export const LandingPage: React.FC = () => {
  const { isAuthenticated, currentTenant } = useStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const openModal = (e: React.MouseEvent, modalId: string) => {
    e.preventDefault();
    setActiveModal(modalId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900">
      {/* Amazing Header with Glassmorphism */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center gap-2">
              {isAuthenticated && currentTenant?.logoUrl ? (
                 <img src={currentTenant.logoUrl} alt="Logo" className="h-12 w-auto max-w-[200px] object-contain" />
              ) : (
                <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-100 overflow-hidden shrink-0 transform hover:scale-105 transition-transform duration-300">
                  <img src={APP_CONFIG.assets.favicon} alt="Logo" className="w-full h-full object-contain" />
                </div>
              )}
              <span className="font-extrabold text-2xl tracking-tight text-slate-900 truncate max-w-[150px] sm:max-w-xs">
                {isAuthenticated && currentTenant ? currentTenant.name : APP_CONFIG.name}
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex gap-8 items-center">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer relative group">Features</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer relative group">Pricing</a>
              <a href="#" onClick={(e) => openModal(e, 'about')} className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors cursor-pointer relative group">About</a>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              {isAuthenticated ? (
                <Link 
                  to="/app" 
                  className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-emerald-500/20 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:-translate-y-0.5"
                >
                  Dashboard <ArrowRight size={16} className="ml-2" />
                </Link>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-emerald-600 transition-colors hidden sm:block">Log in</Link>
                  <Link 
                    to="/signup" 
                    className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent rounded-xl shadow-lg shadow-slate-900/10 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition-all hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        <div className={`md:hidden bg-white/95 backdrop-blur-xl border-b border-slate-100 absolute top-full left-0 w-full z-40 transition-all duration-300 ease-in-out origin-top ${isMobileMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 h-0 overflow-hidden'}`}>
            <div className="px-4 py-6 space-y-4 flex flex-col items-center">
              <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-lg font-medium text-slate-800 hover:text-emerald-600 py-2 w-full text-center">Features</a>
              <a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="text-lg font-medium text-slate-800 hover:text-emerald-600 py-2 w-full text-center">Pricing</a>
              <a href="#" onClick={(e) => openModal(e, 'about')} className="text-lg font-medium text-slate-800 hover:text-emerald-600 py-2 w-full text-center">About</a>
              
              <div className="w-full h-px bg-slate-100 my-2"></div>

              {isAuthenticated ? (
                <Link 
                  to="/app"
                  className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl shadow-lg text-lg font-bold text-white bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Go to Dashboard
                </Link>
              ) : (
                <div className="flex flex-col gap-3 w-full">
                  <Link 
                    to="/login"
                    className="w-full inline-flex items-center justify-center px-4 py-3 border border-slate-200 rounded-xl text-lg font-bold text-slate-700 bg-white hover:bg-slate-50"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Log in
                  </Link>
                  <Link 
                    to="/signup"
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl shadow-lg text-lg font-bold text-white bg-slate-900 hover:bg-slate-800"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden px-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium text-emerald-600 bg-emerald-50 mb-8 border border-emerald-100 animate-fade-in-up">
            <span className="flex h-2 w-2 rounded-full bg-emerald-600 mr-2 animate-pulse"></span>
            v{APP_CONFIG.version} is now live
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 max-w-4xl mx-auto leading-tight animate-fade-in-up delay-100">
            Manage your entire business <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">in one unified platform.</span>
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200">
            {APP_CONFIG.name} provides the infrastructure you need to scale. From multi-tenant management to advanced analytics, we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up delay-300">
             <Link 
              to={isAuthenticated ? "/app" : "/signup"}
              className="inline-flex items-center justify-center px-8 py-4 border border-transparent rounded-2xl shadow-xl shadow-emerald-500/30 text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all hover:-translate-y-1"
            >
              {isAuthenticated ? "Enter Dashboard" : "Start Free Trial"}
            </Link>
             {!isAuthenticated && (
               <Link 
                to="/login" 
                className="inline-flex items-center justify-center px-8 py-4 border border-slate-200 rounded-2xl shadow-sm text-base font-bold text-slate-700 bg-white hover:bg-slate-50 transition-all hover:-translate-y-1"
              >
                Live Demo
              </Link>
             )}
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative rounded-2xl border border-slate-200 bg-slate-100/50 p-2 shadow-2xl mx-auto max-w-5xl animate-fade-in-up delay-500">
            <div className="rounded-xl overflow-hidden bg-white border border-slate-200">
               {/* Mock UI header */}
               <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-3 gap-2">
                 <div className="w-3 h-3 rounded-full bg-red-400"></div>
                 <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                 <div className="w-3 h-3 rounded-full bg-green-400"></div>
               </div>
               {/* Use an image or a simplified version of the actual dashboard */}
               <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90 pointer-events-none select-none">
                  {/* Fake stats */}
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <div className="h-2 w-20 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 w-16 bg-emerald-100 rounded"></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100">
                    <div className="h-2 w-20 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 w-16 bg-emerald-100 rounded"></div>
                  </div>
                  <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 hidden md:block">
                    <div className="h-2 w-20 bg-slate-200 rounded mb-4"></div>
                    <div className="h-8 w-16 bg-blue-100 rounded"></div>
                  </div>
                  {/* Fake Chart */}
                  <div className="col-span-1 md:col-span-3 bg-white h-48 rounded-lg border border-slate-100 flex items-end justify-between p-4 gap-2">
                     {[40, 60, 45, 70, 50, 80, 65, 90, 75, 55].map((h, i) => (
                       <div key={i} className="bg-emerald-500/20 w-full rounded-t" style={{height: `${h}%`}}></div>
                     ))}
                  </div>
               </div>
            </div>
            {/* Decoration */}
            <div className="absolute -top-10 -right-10 w-48 h-48 sm:w-72 sm:h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute -bottom-10 -left-10 w-48 h-48 sm:w-72 sm:h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-emerald-600 tracking-wide uppercase">Features</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Everything you need to run your SaaS</p>
            <p className="mt-4 text-xl text-slate-500">
              Stop stitching together disparate tools. {APP_CONFIG.name} provides a cohesive ecosystem for your business operations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={LayoutDashboard} 
              title="Unified Dashboard" 
              description="Real-time overview of your business performance with customizable widgets and data visualization."
            />
            <FeatureCard 
              icon={Shield} 
              title="Multi-Tenant Security" 
              description="Enterprise-grade data isolation ensures your customers' data remains secure and private."
            />
            <FeatureCard 
              icon={Zap} 
              title="Instant Deployment" 
              description="Get up and running in minutes, not months. Automated provisioning handles the heavy lifting."
            />
            <FeatureCard 
              icon={BarChart3} 
              title="Advanced Analytics" 
              description="Deep dive into user behavior, revenue trends, and churn metrics to make data-driven decisions."
            />
            <FeatureCard 
              icon={Globe} 
              title="Global Infrastructure" 
              description="Deploy close to your users with our edge-optimized network spanning 25+ regions."
            />
             <FeatureCard 
              icon={Layers} 
              title="API First Design" 
              description="Built for developers. Extensible REST and GraphQL APIs to integrate with your existing workflow."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section (Id added for nav anchor) */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-base font-semibold text-emerald-600 tracking-wide uppercase">Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Simple, Transparent Plans</p>
            <p className="mt-4 text-xl text-slate-500">
              Choose a plan that scales with your business. No hidden fees.
            </p>
          </div>
          {/* Simple pricing grid demo */}
          <div className="grid md:grid-cols-3 gap-8">
             {[
               { name: 'Monthly', price: '2,199', features: ['2 Users', '150 Products', 'Standard Support'] },
               { name: 'Quarterly', price: '5,499', features: ['5 Users', '300 Products', 'Priority Support'], popular: true },
               { name: 'Yearly', price: '17,599', features: ['10 Users', '1000 Products', 'Dedicated Manager'] },
             ].map((plan, i) => (
                <div key={i} className={`p-8 rounded-2xl border ${plan.popular ? 'border-emerald-600 ring-4 ring-emerald-50 relative' : 'border-slate-200'} flex flex-col bg-white hover:shadow-xl transition-shadow duration-300`}>
                   {plan.popular && (
                      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">Most Popular</div>
                   )}
                   <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                   <div className="my-4 flex items-baseline">
                      <span className="text-4xl font-extrabold tracking-tight">Rs {plan.price}</span>
                   </div>
                   <ul className="space-y-4 mb-8 flex-1">
                      {plan.features.map(f => (
                        <li key={f} className="flex items-center text-sm text-slate-600">
                           <Check size={18} className="text-emerald-500 mr-3 flex-shrink-0"/> {f}
                        </li>
                      ))}
                   </ul>
                   <Link 
                     to={isAuthenticated ? "/app/subscription" : "/signup"}
                     className={`w-full py-4 rounded-xl font-bold text-center transition-all duration-300 ${plan.popular ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/25' : 'bg-slate-50 text-slate-900 hover:bg-slate-100'}`}
                   >
                     {isAuthenticated ? 'Subscribe' : 'Start Trial'}
                   </Link>
                </div>
             ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="footer" className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-12 text-left">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 text-white mb-6">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-md overflow-hidden shrink-0">
                <img src={APP_CONFIG.assets.favicon} className="w-full h-full object-contain" alt="Logo" />
              </div>
              <span className="font-bold text-xl tracking-tight">{APP_CONFIG.name}</span>
            </div>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              The operating system for modern SaaS businesses. Scale faster with less overhead.
            </p>
            <div className="space-y-3">
                <button onClick={(e) => openModal(e, 'contact')} className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-full text-left">
                    <MapPin size={16} className="text-emerald-600" /> {APP_CONFIG.address}
                </button>
                <button onClick={(e) => openModal(e, 'contact')} className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-full text-left">
                    <Phone size={16} className="text-emerald-600" /> {APP_CONFIG.whatsapp}
                </button>
                <button onClick={(e) => openModal(e, 'contact')} className="flex items-center gap-3 text-sm text-slate-400 hover:text-white transition-colors cursor-pointer w-full text-left">
                    <Mail size={16} className="text-emerald-600" /> {APP_CONFIG.email}
                </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-6">Product</h3>
            <ul className="space-y-4 text-sm">
              <li><a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-emerald-400 transition-colors cursor-pointer block">Features</a></li>
              <li><button onClick={(e) => openModal(e, 'integrations')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Integrations</button></li>
              <li><a href="#pricing" onClick={(e) => scrollToSection(e, 'pricing')} className="hover:text-emerald-400 transition-colors cursor-pointer block">Pricing</a></li>
              <li><button onClick={(e) => openModal(e, 'changelog')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Changelog</button></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-6">Company</h3>
            <ul className="space-y-4 text-sm">
              <li><button onClick={(e) => openModal(e, 'about')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">About Us</button></li>
              <li><button onClick={(e) => openModal(e, 'careers')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Careers</button></li>
              <li><button onClick={(e) => openModal(e, 'blog')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Blog</button></li>
              <li><button onClick={(e) => openModal(e, 'contact')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Contact</button></li>
            </ul>
          </div>

           <div>
            <h3 className="text-sm font-bold text-white tracking-wider uppercase mb-6">Legal</h3>
            <ul className="space-y-4 text-sm">
              <li><button onClick={(e) => openModal(e, 'privacy')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Privacy Policy</button></li>
              <li><button onClick={(e) => openModal(e, 'terms')} className="hover:text-emerald-400 transition-colors cursor-pointer block text-left">Terms of Service</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-900 text-sm text-slate-500 text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; {new Date().getFullYear()} {APP_CONFIG.name} Inc. Developed by {APP_CONFIG.developer}.</p>
          <div className="flex gap-6">
             {/* Social placeholders if needed */}
          </div>
        </div>
      </footer>

      {/* Global Lightweight Popup Modal */}
      {activeModal && MODAL_CONTENT[activeModal] && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setActiveModal(null)}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                            {React.createElement(MODAL_CONTENT[activeModal].icon, { size: 20 })}
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">{MODAL_CONTENT[activeModal].title}</h3>
                    </div>
                    <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full p-1 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[70vh]">
                    {MODAL_CONTENT[activeModal].content}
                </div>
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button onClick={() => setActiveModal(null)} className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const FeatureCard: React.FC<{ icon: React.ElementType, title: string, description: string }> = ({ icon: Icon, title, description }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
    <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center mb-4 text-emerald-600">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
  </div>
);