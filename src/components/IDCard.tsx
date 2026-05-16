import { Certificate } from '../types';
import { Award, Building2, Calendar, AlertCircle, User, FileDown, Info } from 'lucide-react';
import { motion } from 'motion/react';

interface IDCardProps {
  certificate: Certificate;
}

export function IDCard({ certificate }: IDCardProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr || !dateStr.includes('-')) return dateStr;
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const isExpired = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    return expiry < today;
  };

  const expired = isExpired(certificate.expiryDate);

  const getExpiryDisplay = (cert: Certificate) => {
    if (cert.formType === 'Form B' && cert.expiryDate) {
      const year = cert.expiryDate.split('-')[0];
      if (cert.expiryDate.endsWith('-06-30')) {
        return `Jan - Jun ${year}`;
      } else {
        return `Jul - Dec ${year}`;
      }
    }
    return formatDate(cert.expiryDate);
  };

  const getExpiryLabel = (cert: Certificate) => {
    if (cert.formType === 'Form B') return 'Validity Period';
    return 'Expiry date';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl 2xl:max-w-4xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden font-sans border border-gray-100 transition-all duration-300"
    >
      {/* Header Banner */}
      <div className={`${expired ? 'bg-red-600' : 'bg-[#00c853]'} py-4 md:py-5 px-6 text-center text-white font-bold leading-tight text-xs sm:text-sm md:text-base`}>
        <span>Certificate is validated and issued by Om sai enterprises as per records.</span>
      </div>

      <div className="p-4 sm:p-6 md:p-8 2xl:p-10 space-y-4 md:space-y-6">
        {/* Main Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-[#f8fafc] rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 md:w-5 md:h-5 text-red-500 shrink-0" />
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-gray-400 tracking-widest uppercase truncate">Company Name</p>
            </div>
            <p className="text-sm sm:text-base md:text-lg 2xl:text-xl font-black text-gray-900 leading-tight">
              {certificate.companyName || certificate.name}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <User className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-500 shrink-0" />
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase truncate">Project Name</p>
            </div>
            <p className="text-xs sm:text-sm md:text-base 2xl:text-lg font-semibold text-gray-900 truncate">{certificate.name}</p>
          </div>
        </div>

        {/* Secondary Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-red-500 shrink-0" />
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase truncate">Certificate no.</p>
            </div>
            <p className="text-xs sm:text-sm md:text-base 2xl:text-lg font-black text-gray-900 truncate">{certificate.certificateId}</p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-500 shrink-0" />
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase truncate">Issue date</p>
            </div>
            <p className="text-xs sm:text-sm md:text-base 2xl:text-lg font-black text-gray-900 truncate">
              {formatDate(certificate.issueDate)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-4 md:p-6 border border-gray-100 shadow-sm flex flex-col justify-center min-w-0 col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-1.5 md:mb-2">
              <AlertCircle className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-500 shrink-0" />
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-gray-400 tracking-widest uppercase truncate">{getExpiryLabel(certificate)}</p>
            </div>
            <p className="text-xs sm:text-sm md:text-base 2xl:text-lg font-black text-gray-900 truncate">
              {getExpiryDisplay(certificate)}
            </p>
          </div>
        </div>

        {/* Form A Specific Note */}
        {certificate.formType === 'Form A' && (
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100 flex gap-2">
            <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-blue-700 leading-relaxed font-bold">
              Note: Please apply for Form B once Form A is expire
            </p>
          </div>
        )}

        {/* Note Disclaimer Section */}
        <div className="bg-yellow-50/50 rounded-xl p-3 border border-yellow-100/50 flex gap-2">
          <AlertCircle className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-500 leading-relaxed font-medium italic">
            Note: without a valid digital signature on issued certificate is not acceptable/responsible by Om Sai Enterprises.
          </p>
        </div>

        {/* PDF Download Section */}
        {certificate.pdfPath && (
          <div className="pt-2 md:pt-4">
            <a
              href={`/${certificate.pdfPath}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 md:py-4 bg-red-50 hover:bg-red-100 text-[#e31e24] font-bold rounded-xl border border-red-200 transition-all text-xs md:text-sm"
            >
              <FileDown className="w-4 h-4 md:w-5 md:h-5" />
              Download Official Document (PDF)
            </a>
          </div>
        )}

        {/* Footer Area */}
        <div className="pt-4 border-t border-dashed border-gray-200 text-center">
          <p className="text-[8px] font-bold text-gray-300 tracking-[0.2em] uppercase">
            Official Verification Portal
          </p>
        </div>
      </div>
    </motion.div>
  );
}
