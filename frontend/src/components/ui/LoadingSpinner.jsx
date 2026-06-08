import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({ text = "Memuat...", className = "" }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 ${className}`}>
      <Loader2 className="h-10 w-10 text-blue-600 animate-spin mb-4" />
      <p className="text-gray-500 font-medium animate-pulse">{text}</p>
    </div>
  );
};

export default LoadingSpinner;
