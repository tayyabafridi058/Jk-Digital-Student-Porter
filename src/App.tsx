/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'motion/react';
import { User, Mail, Phone, MapPin, BookOpen, CheckCircle2, Send, ChevronRight, GraduationCap, Calendar, CreditCard, Monitor, Building2, Sparkles, Loader2, X, AlertCircle } from 'lucide-react';
import { getCourseRecommendation } from './services/geminiService';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firebaseUtils';

// Error Boundary Component
function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  let errorMessage = "An unexpected error occurred.";
  try {
    const errorInfo = JSON.parse(error.message);
    if (errorInfo.error.includes("insufficient permissions")) {
      errorMessage = "You don't have permission to perform this action. Please check your security rules.";
    } else {
      errorMessage = errorInfo.error;
    }
  } catch (e) {
    errorMessage = error.message;
  }

  return (
    <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-center space-y-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
        <AlertCircle className="w-6 h-6 text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-red-900">Something went wrong</h3>
      <p className="text-red-700 text-sm">{errorMessage}</p>
      <button 
        onClick={reset}
        className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

// Form Validation Schema
const formSchema = z.object({
  fullName: z.string().min(3, 'Full name must be at least 3 characters'),
  fatherName: z.string().min(3, 'Father name must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\d{10,12}$/, 'Phone number must be 10-12 digits'),
  cnic: z.string().regex(/^\d{5}-\d{7}-\d{1}$/, 'CNIC must be in 00000-0000000-0 format'),
  city: z.string().min(2, 'City is required'),
  gender: z.enum(['Male', 'Female', 'Other']),
  education: z.string().min(2, 'Education is required'),
  course: z.string().min(2, 'Please select a course'),
  preference: z.enum(['Online', 'Onsite']),
  address: z.string().min(10, 'Full address is required'),
});

type FormData = z.infer<typeof formSchema>;

const COURSES = [
  'Shopify Dropshipping',
  'Digital Marketing',
  'Tiktok Monetization',
  'Web Development',
  'Youtube Monetization'
];

const CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Peshawar', 'Quetta'
];

export default function App() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [showRecommender, setShowRecommender] = useState(false);
  const [interests, setInterests] = useState('');
  const [recommendation, setRecommendation] = useState<{ recommendedCourse: string; reason: string } | null>(null);
  const [recommending, setRecommending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: 'Male',
      preference: 'Online'
    }
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    setError(null);
    
    try {
      // 1. Save to Firestore
      const path = 'enrollments';
      try {
        await addDoc(collection(db, path), {
          ...data,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, path);
      }

      // 2. Construct WhatsApp Message
      const message = `*New Enrollment Application - JK Digital*\n\n` +
        `*Full Name:* ${data.fullName}\n` +
        `*Father Name:* ${data.fatherName}\n` +
        `*Email:* ${data.email}\n` +
        `*Phone:* ${data.phone}\n` +
        `*CNIC:* ${data.cnic}\n` +
        `*City:* ${data.city}\n` +
        `*Gender:* ${data.gender}\n` +
        `*Education:* ${data.education}\n` +
        `*Course:* ${data.course}\n` +
        `*Class Preference:* ${data.preference}\n` +
        `*Address:* ${data.address}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || "923000000000").replace(/\+/g, '');
      const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

      // 3. Open WhatsApp and show success
      window.open(whatsappUrl, '_blank');
      setIsSubmitted(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center"
        >
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Submitted!</h2>
          <p className="text-slate-600 mb-8">
            Your registration details for JK Digital have been sent to our WhatsApp team. We will contact you soon for further details.
          </p>
          <button 
            onClick={() => setIsSubmitted(false)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Submit Another Application
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-indigo-700 text-white py-6 shadow-lg">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden">
              <img 
                src="https://jkdigi.com/wp-content/uploads/2024/02/cropped-JK-Digital-Logo-1.png" 
                alt="JK Digital Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // Fallback to icon if logo fails to load
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.parentElement?.insertAdjacentHTML('afterbegin', '<svg class="text-indigo-700 w-8 h-8" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>');
                }}
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">JK Digital</h1>
              <p className="text-indigo-100 text-sm">Digital Marketing Agency</p>
            </div>
          </div>
          <div className="text-center md:text-right">
            <p className="text-sm font-medium text-indigo-100">Admission Open 2026 Batch One</p>
            <p className="text-xs opacity-75">Master Digital Skills with Experts</p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          <div className="bg-indigo-600 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Registration Form
            </h2>
            <p className="text-indigo-100 text-sm mt-1">Please fill in all the details correctly to apply for Batch One.</p>
          </div>

          {error ? (
            <div className="p-10">
              <ErrorBoundary error={error} reset={() => setError(null)} />
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-10 space-y-8">
            {/* Personal Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('fullName')}
                      placeholder="Enter your full name"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.fullName ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Father's Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('fatherName')}
                      placeholder="Enter father's name"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.fatherName ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('email')}
                      type="email"
                      placeholder="example@email.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.email ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('phone')}
                      placeholder="03001234567"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.phone ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">CNIC Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('cnic')}
                      placeholder="00000-0000000-0"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.cnic ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.cnic && <p className="text-red-500 text-xs mt-1">{errors.cnic.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Gender</label>
                  <div className="flex gap-4 py-2">
                    {['Male', 'Female', 'Other'].map((g) => (
                      <label key={g} className="flex items-center gap-2 cursor-pointer">
                        <input 
                          type="radio" 
                          value={g} 
                          {...register('gender')}
                          className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-slate-600">{g}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Education Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                Education & Location
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select 
                      {...register('city')}
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.city ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none`}
                    >
                      <option value="">Select City</option>
                      {CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                  </div>
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Last Qualification</label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      {...register('education')}
                      placeholder="e.g. Matric, Intermediate, Bachelor"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.education ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                    />
                  </div>
                  {errors.education && <p className="text-red-500 text-xs mt-1">{errors.education.message}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full Address</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <textarea 
                    {...register('address')}
                    placeholder="Enter your complete residential address"
                    rows={3}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border ${errors.address ? 'border-red-500 bg-red-50' : 'border-slate-200'} focus:ring-2 focus:ring-indigo-500 outline-none transition-all`}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
              </div>
            </section>

            {/* Class Preference Section */}
            <section className="space-y-6">
              <h3 className="text-lg font-semibold text-slate-800 border-b pb-2 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-600" />
                Class Preference
              </h3>
              
              <div className="flex gap-8 py-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      value="Online" 
                      {...register('preference')}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Online Classes</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input 
                      type="radio" 
                      value="Onsite" 
                      {...register('preference')}
                      className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-500" />
                    <span className="text-sm font-medium text-slate-700">Onsite Classes</span>
                  </div>
                </label>
              </div>
              {errors.preference && <p className="text-red-500 text-xs mt-1">{errors.preference.message}</p>}
            </section>

            {/* Course Section */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-indigo-600" />
                  Course Selection
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowRecommender(true)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Help me choose
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Select Course</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {COURSES.map((course) => (
                    <label 
                      key={course}
                      className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        'border-slate-100 hover:border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      <input 
                        type="radio" 
                        value={course} 
                        {...register('course')}
                        className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="ml-3 text-sm text-slate-700">{course}</span>
                    </label>
                  ))}
                </div>
                {errors.course && <p className="text-red-500 text-xs mt-1">{errors.course.message}</p>}
              </div>
            </section>

            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Registration
                    <Send className="w-5 h-5" />
                  </>
                )}
              </button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Your data will be securely stored in our database and sent to our WhatsApp team.
              </p>
            </div>
          </form>
          )}
        </motion.div>

        {/* Course Details Section */}
        <section className="mt-16 space-y-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-slate-800">Our Professional Courses</h2>
            <p className="text-slate-600 mt-2">Master the most in-demand digital skills of 2026</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Shopify Dropshipping',
                description: 'Learn to build a high-converting e-commerce store and master the art of product sourcing and scaling.',
                icon: <CreditCard className="w-6 h-6 text-indigo-600" />,
                features: ['Store Setup', 'Product Research', 'Supplier Management']
              },
              {
                title: 'Digital Marketing',
                description: 'Comprehensive training on SEO, SEM, and social media strategies to grow any business online.',
                icon: <Monitor className="w-6 h-6 text-indigo-600" />,
                features: ['Social Media Ads', 'SEO Mastery', 'Content Strategy']
              },
              {
                title: 'Tiktok Monetization',
                description: 'Master the algorithm and learn how to monetize your content through creator funds and brand deals.',
                icon: <Sparkles className="w-6 h-6 text-indigo-600" />,
                features: ['Algorithm Hacks', 'Content Creation', 'Brand Outreach']
              },
              {
                title: 'Web Development',
                description: 'Build modern, responsive websites using the latest technologies like React, Tailwind, and Node.js.',
                icon: <BookOpen className="w-6 h-6 text-indigo-600" />,
                features: ['Frontend Dev', 'Backend Basics', 'Responsive Design']
              },
              {
                title: 'Youtube Monetization',
                description: 'Complete guide to starting, growing, and monetizing a successful YouTube channel from scratch.',
                icon: <Monitor className="w-6 h-6 text-indigo-600" />,
                features: ['Niche Selection', 'Video Editing', 'SEO for Video']
              }
            ].map((course) => (
              <motion.div 
                key={course.title}
                whileHover={{ y: -5 }}
                className="bg-white p-6 rounded-2xl shadow-md border border-slate-100"
              >
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  {course.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-2">{course.title}</h3>
                <p className="text-slate-600 text-sm mb-4 leading-relaxed">{course.description}</p>
                <ul className="space-y-2">
                  {course.features.map(feature => (
                    <li key={feature} className="flex items-center gap-2 text-xs font-medium text-slate-500">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer Info */}
        <footer className="mt-12 text-center text-slate-500 text-sm space-y-4">
          <div className="flex items-center justify-center gap-6">
            <a href="https://jkdigi.com/" className="hover:text-indigo-600 transition-colors">About JK Digital</a>
            <a href="https://jkdigi.com/" className="hover:text-indigo-600 transition-colors">Digital Marketing Services</a>
            <a 
              href={`https://wa.me/${(import.meta.env.VITE_WHATSAPP_NUMBER || "923000000000").replace(/\+/g, '')}?text=Hi, I have a question about JK Digital enrollment.`} 
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-600 transition-colors flex items-center gap-1"
            >
              Contact Us
              <Send className="w-3 h-3" />
            </a>
          </div>
          <p>© 2026 JK Digital Marketing Agency. All rights reserved.</p>
        </footer>
      </main>

      {/* AI Recommender Modal */}
      <AnimatePresence>
        {showRecommender && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
            >
              <div className="bg-indigo-600 p-6 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI Course Assistant</h3>
                    <p className="text-indigo-100 text-xs">Tell us your interests, we'll recommend a course</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowRecommender(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {!recommendation ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">What are you interested in? (e.g. business, design, coding)</label>
                      <textarea 
                        value={interests}
                        onChange={(e) => setInterests(e.target.value)}
                        placeholder="I want to start my own business and sell products online..."
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                      />
                    </div>
                    <button 
                      onClick={async () => {
                        if (!interests.trim()) return;
                        setRecommending(true);
                        const res = await getCourseRecommendation(interests);
                        setRecommendation(res);
                        setRecommending(false);
                      }}
                      disabled={recommending || !interests.trim()}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
                    >
                      {recommending ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          Get Recommendation
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                      <h4 className="text-indigo-900 font-bold text-lg mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-indigo-600" />
                        Recommended: {recommendation.recommendedCourse}
                      </h4>
                      <p className="text-indigo-800 text-sm leading-relaxed">
                        {recommendation.reason}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setValue('course', recommendation.recommendedCourse);
                          setShowRecommender(false);
                          setRecommendation(null);
                          setInterests('');
                        }}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all"
                      >
                        Apply this Course
                      </button>
                      <button 
                        onClick={() => {
                          setRecommendation(null);
                          setInterests('');
                        }}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                      >
                        Try Again
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
