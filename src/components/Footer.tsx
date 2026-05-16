import React from 'react';
import { Phone, Mail, MapPin, Facebook, Instagram, Linkedin, MessageCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1d4e9e] text-white pt-12 pb-6 px-4 mt-auto relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16 pb-10 border-b border-white/10">
        {/* Company Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {/* <div className="bg-white p-1.5 rounded-lg">
              <img 
                src="https://omsaienterprisesmumbai.com/images/logo2.jpeg" 
                alt="Logo" 
                className="h-8 w-auto"
              />
            </div> */}
            <h3 className="text-lg font-bold tracking-tight">OM SAI ENTERPRISES</h3>
          </div>
          <p className="text-sm text-blue-100/70 leading-relaxed">
            Leading experts in Fire Prevention & Fire Protection since 2001. Committed to safety and excellence in industrial solutions.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <a href="https://www.facebook.com/people/Om-Sai-Enterprises/61561135771660/?mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Facebook className="w-4 h-4" />
            </a>
            <a href="#" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Instagram className="w-4 h-4" />
            </a>
            <a href="https://www.linkedin.com/company/omsai-enterprises-mumbai" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Linkedin className="w-4 h-4" />
            </a>
            <a href="https://wa.me/918655012354" target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.067 2.877 1.215 3.076.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Quick Contacts */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-blue-200">Get In Touch</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3 group">
              <Phone className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-100">Call/WhatsApp Us</p>
                <a 
                  href="https://wa.me/918655012354" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-white hover:text-blue-200 transition-colors flex items-center gap-2"
                >
                  +91 865 501 2354
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3 group">
              <Mail className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-blue-100">Email Us</p>
                <a href="mailto:omse@omsaienterprisesmumbai.com" className="text-white hover:underline">omse@omsaienterprisesmumbai.com</a>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-widest text-blue-200">Our Office</h4>
          <div className="flex items-start gap-3 group">
            <MapPin className="w-5 h-5 text-blue-300 group-hover:text-white transition-colors shrink-0" />
            <p className="text-sm text-blue-50/90 leading-relaxed italic">
              # 001, Ground floor, Meadows Co-Op. HSG. Soc. Ltd., Near Orrange Hospital, Opp. Jogger Park, Deepak Hospital Lane,<br />
              Bhayander East – 401105, Thane
            </p>
          </div>
          <div className="pt-2">
             <button className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full border border-white/20 transition-all">
                View on Map
             </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-[11px] text-blue-200/60 font-medium tracking-wide uppercase">
          &copy; {new Date().getFullYear()} Om Sai Enterprises. All rights reserved.
        </p>
        <div className="flex items-center gap-6 text-[10px] font-bold text-blue-200/60 uppercase tracking-widest">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
