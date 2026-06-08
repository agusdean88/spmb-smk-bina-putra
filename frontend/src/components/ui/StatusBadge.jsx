import { CheckCircle, Clock, XCircle } from 'lucide-react';

const StatusBadge = ({ status, className = "" }) => {
  switch (status) {
    case 'LULUS':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Lulus
        </span>
      );
    case 'TIDAK_LULUS':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}>
          <XCircle className="w-3 h-3 mr-1" /> Tidak Lulus
        </span>
      );
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" /> Terverifikasi
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ${className}`}>
          <Clock className="w-3 h-3 mr-1" /> Pending
        </span>
      );
  }
};

export default StatusBadge;
