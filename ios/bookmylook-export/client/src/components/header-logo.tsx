import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, User, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";

interface UserBookingData {
  clientName: string;
  clientPhone: string;
  lastBookingLocation?: string;
  totalBookings: number;
}

export default function HeaderLogo() {
  const [location] = useLocation();
  const [hasBookingData, setHasBookingData] = useState(false);

  // Fetch user booking data from localStorage
  const { data: userBookingData } = useQuery<UserBookingData | null>({
    queryKey: ['/user-booking-data'],
    queryFn: () => {
      const storedData = localStorage.getItem('userBookingData');
      return storedData ? JSON.parse(storedData) : null;
    },
    refetchInterval: 5000, // Check every 5 seconds for updates
  });

  useEffect(() => {
    setHasBookingData(!!userBookingData);
  }, [userBookingData]);
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center"
    >
      {/* Main text */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="flex flex-col"
      >
        {/* Always show BookMyLook branding */}
        <div className="text-xl font-black bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-none">
          BookMyLook
        </div>
        <div className="text-xs text-gray-600 font-medium tracking-wide italic">
          Your Style, Your Schedule
        </div>
        
        {/* Navigation Buttons - Only show on non-home pages */}
        {location !== '/' && (
          <div className="flex items-center space-x-4 mt-1">
            {/* Back Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.6 
              }}
              whileHover={{ 
                scale: 1.15,
                rotate: [0, -3, 3, 0],
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.history.back()}
              className="w-7 h-7 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="logo-back-button"
              title="Go back"
            >
              <ArrowLeft className="h-4 w-4 text-white" />
            </motion.button>
            
            {/* Forward Button */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ 
                type: "spring", 
                stiffness: 260, 
                damping: 20,
                delay: 0.7 
              }}
              whileHover={{ 
                scale: 1.15,
                rotate: [0, 3, -3, 0],
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                // Only move forward if there's forward history
                if (window.history.length > 1) {
                  window.history.forward();
                }
              }}
              className="w-7 h-7 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200"
              data-testid="logo-forward-button"
              title="Go forward"
            >
              <ArrowRight className="h-4 w-4 text-white" />
            </motion.button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}