'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { 
  ArrowRight, 
  CheckCircle, 
  MessageSquare, 
  Users, 
  Zap, 
  Star,
  Play,
  Menu,
  X
} from 'lucide-react'

export default function Home() {
  const { data: session } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        scrollY > 50 ? 'bg-white/95 backdrop-blur-sm shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-gray-900">
                PixelPin
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">
                Testimonials
              </a>
              {session ? (
                <Link 
                  href="/dashboard"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Dashboard
                </Link>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    href="/signin"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link 
                    href="/signup"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started Free
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden bg-white border-t border-gray-200">
              <div className="px-2 pt-2 pb-3 space-y-1">
                <a href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Features
                </a>
                <a href="#pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Pricing
                </a>
                <a href="#testimonials" className="block px-3 py-2 text-gray-600 hover:text-gray-900">
                  Testimonials
                </a>
                {session ? (
                  <Link 
                    href="/dashboard"
                    className="block px-3 py-2 text-blue-600 font-medium"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link 
                      href="/signin"
                      className="block px-3 py-2 text-gray-600 hover:text-gray-900"
                    >
                      Sign In
                    </Link>
                    <Link 
                      href="/signup"
                      className="block px-3 py-2 text-blue-600 font-medium"
                    >
                      Get Started Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              Visual feedback made
              <span className="text-blue-600 block">simple and fast</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Streamline your design review process with PixelPin. Add comments, annotations, 
              and collaborate in real-time on images, PDFs, and websites.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Link 
                href="/signup"
                className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-lg font-medium"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <Play className="h-5 w-5" />
                Watch Demo
              </button>
            </div>
            
            {/* Hero Image Placeholder */}
            <div className="relative max-w-5xl mx-auto">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-2xl">
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <div className="flex-1 bg-gray-100 rounded px-3 py-1 text-sm text-gray-500">
                      pixelpin.com/project/design-review
                    </div>
                  </div>
                  <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                      <p className="text-gray-600">Interactive annotation interface</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-600 mb-8">Trusted by teams at</p>
          <div className="flex justify-center items-center space-x-8 opacity-60">
            {['Company A', 'Company B', 'Company C', 'Company D', 'Company E'].map((company, index) => (
              <div key={index} className="text-gray-400 font-semibold text-lg">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need for visual feedback
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful features designed to make design reviews faster, clearer, and more collaborative.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Visual Annotations
              </h3>
              <p className="text-gray-600">
                Add comments, draw shapes, and highlight areas directly on your designs with precision.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Real-time Collaboration
              </h3>
              <p className="text-gray-600">
                See who&apos;s online, collaborate live, and get instant notifications when feedback is added.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Lightning Fast
              </h3>
              <p className="text-gray-600">
                Upload images, PDFs, or add website URLs and start collecting feedback in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, transparent pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start free and upgrade when you need more power
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-gray-900 mb-2">$0</div>
                <p className="text-gray-600">Forever free</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>1 project</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>10 annotations per project</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Basic collaboration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Email support</span>
                </li>
              </ul>
              <Link 
                href="/signup"
                className="w-full bg-gray-100 text-gray-900 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors text-center block font-medium"
              >
                Get Started Free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-blue-600 rounded-2xl p-8 shadow-lg text-white relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold mb-2">$29</div>
                <p className="text-blue-100">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-200" />
                  <span>Unlimited projects</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-200" />
                  <span>Unlimited annotations</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-200" />
                  <span>Real-time collaboration</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-200" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-200" />
                  <span>Advanced integrations</span>
                </li>
              </ul>
              <Link 
                href="/signup"
                className="w-full bg-white text-blue-600 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors text-center block font-medium"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by design teams worldwide
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;PixelPin has revolutionized our design review process. What used to take hours now takes minutes.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Sarah Johnson</p>
                  <p className="text-sm text-gray-600">Design Lead at TechCorp</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;The real-time collaboration features are incredible. Our remote team feels more connected than ever.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Mike Chen</p>
                  <p className="text-sm text-gray-600">Product Manager at StartupXYZ</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="flex items-center mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-600 mb-4">
                &quot;Simple, fast, and powerful. PixelPin is exactly what we needed for our design workflow.&quot;
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                <div>
                  <p className="font-medium text-gray-900">Emily Rodriguez</p>
                  <p className="text-sm text-gray-600">Creative Director at Agency Pro</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-blue-600 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to streamline your design reviews?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using PixelPin to collaborate better and ship faster.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signup"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-gray-50 transition-colors font-medium text-lg"
            >
              Start Free Trial
            </Link>
            <Link 
              href="/pricing"
              className="border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:text-blue-600 transition-colors font-medium text-lg"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">PixelPin</h3>
              <p className="text-gray-400">
                The fastest visual feedback tool for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><Link href="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PixelPin. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
