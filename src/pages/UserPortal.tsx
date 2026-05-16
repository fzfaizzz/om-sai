import React, { useState } from 'react';
import { Search, ShieldCheck, Users, MapPin, Phone, Mail, Zap, Award } from 'lucide-react';
import { Certificate } from '../types';
import { IDCard } from '../components/IDCard';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';

export function UserPortal() {
  const [certId, setCertId] = useState('');
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setError('');
    
    if (!certId.trim()) {
      setError('Please enter a valid Certificate ID.');
      setCertificate(null);
      return;
    }

    const processCertificate = (data: any) => {
      // Check if data is null, an error, or or missing the required certificate fingerprint
      if (data && data.certificateId) {
        if (data.status === 'Inactive') {
          setCertificate(null);
          setError('This certificate is NOT issued by Om Sai Enterprises. Please contact Om Sai Enterprises admin team.');
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const expiry = new Date(data.expiryDate);
          
          if (today > expiry) {
            setCertificate(null);
            setError('This certificate has expired and not valid. Please contact Om Sai Enterprises admin team.');
          } else {
            setCertificate(data);
            setError('');
          }
        }
      } else {
        // Here we handle cases where data might be an error object {"error": ...} or null
        setCertificate(null);
        setError('This certificate is NOT issued by Om Sai Enterprises. Please contact Om Sai Enterprises admin team.');
      }
    };

    try {
      // Use a cleaner relative path for the API
      const res = await fetch(`api/check.php?id=${certId.trim().toUpperCase()}`);
      
      if (!res.ok) {
        let errorMessage = 'Network response was not ok';
        try {
          const errorData = await res.json();
          if (errorData && errorData.error) errorMessage = errorData.error;
        } catch (e) {
          // If not JSON, use the status text
          errorMessage = `Server Error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      if (!data) throw new Error('Not found');
      processCertificate(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error('Verification Error:', errorMessage);

      if (errorMessage === 'Not found') {
        processCertificate(null);
      } else {
        // Provide more detailed feedback to the user
        setError(`${errorMessage}. Please try again later or check your connection.`);
        setCertificate(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header isSticky={false} />

      <main className="flex-1 flex flex-col items-center justify-center relative py-12 sm:py-20">
        {/* Background Pattern */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-red-100/50 blur-3xl"></div>
          <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-3xl"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
        </div>

        <div className="w-full max-w-4xl 2xl:max-w-5xl text-center space-y-4 sm:space-y-6 mb-8 sm:mb-12 px-4 sm:px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight lg:text-6xl mb-3 sm:mb-4">
              Certificate <span className="text-[#e31e24]">Verification</span>
            </h2>
            <p className="text-sm sm:text-base md:text-lg 2xl:text-xl text-gray-600 max-w-2xl 2xl:max-w-3xl mx-auto px-2">
              Instantly access and verify your official Om Sai Enterprises digital certificate here
            </p>
          </motion.div>

          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            onSubmit={handleSearch} 
            className="relative w-full max-w-xl 2xl:max-w-2xl mx-auto mt-6 sm:mt-10"
          >
            <div className="relative flex items-center shadow-xl rounded-full bg-white ring-1 ring-gray-200 focus-within:ring-2 focus-within:ring-[#e31e24] transition-all">
              <Search className="absolute left-4 sm:left-5 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
              <input
                type="text"
                value={certId}
                onChange={(e) => setCertId(e.target.value.toUpperCase())}
                placeholder="Enter CERT REF NO (e.g. OMSE/FA/1001/2026)"
                className="w-full pl-12 sm:pl-14 pr-[100px] sm:pr-[140px] py-3.5 sm:py-5 bg-transparent border-none rounded-full focus:outline-none focus:ring-0 text-sm sm:text-base md:text-lg transition-all uppercase placeholder:normal-case placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="absolute right-1.5 sm:right-2 top-1.5 sm:top-2 bottom-1.5 sm:bottom-2 px-5 sm:px-8 bg-[#e31e24] hover:bg-red-700 text-white font-semibold rounded-full transition-all shadow-md hover:shadow-lg active:scale-95 text-sm sm:text-base flex items-center justify-center"
              >
                Verify
              </button>
            </div>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 mt-4 text-sm font-medium bg-red-50 py-2 px-4 rounded-full inline-block"
              >
                {error}
              </motion.p>
            )}
          </motion.form>
        </div>

        <AnimatePresence mode="wait">
          {!certificate && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="w-full max-w-[1400px] px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 2xl:gap-12 relative z-10 pb-12 sm:pb-16 mt-2 sm:mt-8"
            >
              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-red-50 text-[#e31e24] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5">
                  <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Secure Verification</h3>
                <p className="text-gray-600 text-xs sm:text-sm">All certificates are securely verified against our central database.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-blue-50 text-[#1d4e9e] rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Instant Access</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Get your digital certificate instantly without any waiting period.</p>
              </div>
              <div className="bg-white/80 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-sm border border-gray-100 text-center hover:shadow-md transition-shadow sm:col-span-2 md:col-span-1">
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-5">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 mb-1.5 sm:mb-2">Official Record</h3>
                <p className="text-gray-600 text-xs sm:text-sm">Download your official company certificate from here.</p>
              </div>
            </motion.div>
          )}

          {certificate && (
            <motion.div
              key="idcard"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="w-full flex flex-col items-center gap-8 relative z-10 pb-16"
            >
              <IDCard certificate={certificate} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
