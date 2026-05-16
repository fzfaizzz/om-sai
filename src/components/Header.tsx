import React, { useState } from 'react';
import { Facebook, Instagram, Linkedin, MessageCircle, ShieldCheck, Sun, Menu, X, Home, Phone, Mail, Award, Users, Zap, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showAdminLink?: boolean;
  isAdminMode?: boolean;
  onLogout?: () => void;
  isSticky?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ showAdminLink = true, isAdminMode = false, onLogout, isSticky = true }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  return (
    <header className={`bg-white border-b border-gray-100 shadow-sm ${isSticky ? (isAdminMode ? 'sm:sticky relative top-0 z-50' : 'sticky top-0 z-50') : 'relative z-50'}`}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4 sm:py-6">
        {/* Desktop Layout */}
        <div className="hidden sm:flex justify-between items-center gap-6">
          {/* Left: License Info */}
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2 text-[13px] text-gray-700 font-medium whitespace-nowrap">
              <Sun className="w-4 h-4 text-[#e31e24] fill-[#e31e24]" />
              <span>Licence No. - MFS/LA/RF-327/RD-371/P-74</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-gray-700 font-medium whitespace-nowrap">
              <Sun className="w-4 h-4 text-[#e31e24] fill-[#e31e24]" />
              <span>ISO 9001:2015 Certified Company</span>
            </div>
          </div>

          <div className="flex flex-col items-center text-center px-4">
            <a href="/">
              <img
                src="https://omsaienterprisesmumbai.com/images/logo2.jpeg"
                alt="Om Sai Enterprises Logo"
                className="h-24 w-auto object-contain"
              />
            </a>
          </div>

          {/* Right: Social & Admin */}
          <div className="flex-1 flex flex-col items-end gap-3">
            <div className="flex items-center gap-3">
              <a href="https://www.facebook.com/people/Om-Sai-Enterprises/61561135771660/?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#3b5998] text-white rounded-full hover:opacity-90 transition-opacity">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-[#e4405f] text-white rounded-full hover:opacity-90 transition-opacity">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/company/omsai-enterprises-mumbai" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0077b5] text-white rounded-full hover:opacity-90 transition-opacity">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://wa.me/918655012354" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#25d366] text-white rounded-full hover:opacity-90 transition-opacity">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>

            {showAdminLink && !isAdminMode && (
              <Link to="/admin" className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#e31e24] transition-colors bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                Admin Access
              </Link>
            )}

            {isAdminMode && (
              <div className="flex items-center gap-3">
                 <a href="/Verify" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#e31e24] transition-colors bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  <Home className="w-3.5 h-3.5 " />
                  User Portal
                </a>                  <button
                  onClick={onLogout}
                  className="text-xs font-bold text-red-600 hover:underline"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="sm:hidden flex flex-col items-center relative">

          {/* Mobile Sidebar Menu (With Smooth Transition) */}
          <div className={`fixed inset-0 z-[100] sm:hidden transition-all duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
            
            {/* Menu Content */}
            <div className={`absolute top-0 left-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
              <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <span className="font-black text-[#e31e24] tracking-tight">MENU</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {!isAdminMode && (
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-2">Navigation</p>
                    <a href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <Home className="w-5 h-5 text-[#e31e24]" />
                      Home
                    </a>
                    <a href="/about.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <Users className="w-5 h-5 text-[#e31e24]" />
                      About Us
                    </a>
                    <a href="/Fire_Fighting_Systems.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <Zap className="w-5 h-5 text-[#e31e24]" />
                      Services
                    </a>
                    <a href="/Projects.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <ShieldCheck className="w-5 h-5 text-[#e31e24]" />
                      Project
                    </a>
                    <a href="/Download.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <Mail className="w-5 h-5 text-[#e31e24]" />
                      Download
                    </a>
                    <a href="/contact.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <Phone className="w-5 h-5 text-[#e31e24]" />
                      Contact
                    </a>
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all bg-red-50">
                      <Award className="w-5 h-5 text-[#e31e24]" />
                      E-Verify
                    </Link>
                    <a href="/Login.html" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                      <ShieldCheck className="w-5 h-5 text-[#e31e24]" />
                      Login
                    </a>
                    {showAdminLink && !isAdminMode && (
                      <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-gray-700 font-bold hover:bg-gray-50 rounded-xl transition-all">
                        <ShieldCheck className="w-5 h-5 text-[#e31e24]" />
                        Admin Access
                      </Link>
                    )}
                  </div>
                )}

                <div className="space-y-3 px-4">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Quick Contact</p>
                  <a href="https://wa.me/918655012354" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-[#e31e24] transition-colors">
                    <Phone className="w-4 h-4 text-gray-400" />
                    +91 865 501 2354
                  </a>
                  <div className="flex items-center gap-3 text-sm font-medium text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    omse@omsaienterprisesmumbai.com
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 bg-gray-50">
                <p className="text-[10px] text-gray-400 text-center italic">Professional Fire Safety Solutions</p>
              </div>
            </div>
          </div>
          {/* Top: License Info */}
          <div className="w-full flex flex-col items-center gap-1.5 border-b border-gray-50 pb-3">
            <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <Sun className="w-3 h-3 text-[#e31e24] fill-[#e31e24]" />
              <span>Licence No. - MFS/LA/RF-327/RD-371/P-74</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-gray-600 font-medium">
              <Sun className="w-3 h-3 text-[#e31e24] fill-[#e31e24]" />
              <span>ISO 9001:2015 Certified Company</span>
            </div>
          </div>

          {/* Middle: Logo */}
          <div className="flex flex-col items-center text-center gap-2">
            <a href="/">
              <img
                src="https://omsaienterprisesmumbai.com/images/logo2.jpeg"
                alt="Om Sai Enterprises Logo"
                className="h-32 w-auto object-contain"
              />
            </a>
          </div>

          {/* Bottom: Social & Admin */}
          <div className="flex flex-col items-center gap-3 w-full pt-2">
            <div className="flex items-center gap-4">
              <a href="https://www.facebook.com/people/Om-Sai-Enterprises/61561135771660/?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#3b5998] text-white rounded-full">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 bg-[#e4405f] text-white rounded-full">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://www.linkedin.com/company/omsai-enterprises-mumbai" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#0077b5] text-white rounded-full">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="https://wa.me/918655012354" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#25d366] text-white rounded-full">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>

            {showAdminLink && !isAdminMode && (
              <button 
                onClick={() => setIsMenuOpen(true)}
                className="flex flex-col items-center gap-1 group"
              >
                <div className="p-2 bg-red-50 text-[#e31e24] rounded-full hover:bg-red-100 transition-colors">
                  <Menu className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-gray-400 group-hover:text-[#e31e24] uppercase tracking-widest">Menu</span>
              </button>
            )}

            {isAdminMode && (
              <div className="flex items-center gap-4">
                <a href="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-[#e31e24] transition-colors bg-gray-50 px-3 py-1 rounded-full border border-gray-200">
                  <Home className="w-3.5 h-3.5" />
                  Home Portal
                </a>    
                <button onClick={onLogout} className="text-xs font-bold text-red-600">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Bar (Desktop) */}
      {!isAdminMode && (
        <nav className="hidden sm:block bg-[#fc0100]">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
            <ul className="flex items-center justify-center list-none m-0 p-0">
              <li>
                <a href="/" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="/about.html" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  About Us
                </a>
              </li>
              <li className="relative group">
                <button className="flex items-center gap-1 px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Services
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                </button>
                <div className="absolute left-0 top-full w-64 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[60] border-t-2 border-[#fc0100]">
                  <a href="/Fire_Fighting_Systems.html" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">Fire Fighting Systems</a>
                  <a href="/Fire_Detection_System.html" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">Fire Detection System</a>
                  <a href="/Passive_Protection_System.html" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">Passive Protection System</a>
                  <a href="/Aluminum_Fabrication.html" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100">Aluminum Fabrication</a>
                  <a href="/Solar_Systems.html" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">Solar Systems</a>
                </div>
              </li>
              <li>
                <a href="/Projects.html" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Project
                </a>
              </li>
              <li>
                <a href="/Download.html" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Download
                </a>
              </li>
              <li>
                <a href="/contact.html" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link to="/" className={`block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors ${!isAdminMode ? 'bg-[#08c9fa]' : ''}`}>
                  E-Verify
                </Link>
              </li>
              <li>
                <a href="/Login.html" className="block px-6 py-4 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#08c9fa] transition-colors">
                  Login
                </a>
              </li>
              <li className="px-4">
                <button className="text-white hover:text-[#08c9fa] transition-colors flex items-center">
                  | <Search className="w-4 h-4 mx-1" /> |
                </button>
              </li>
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
};

