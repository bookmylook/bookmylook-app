import { motion } from "framer-motion";
import { Calendar, Briefcase, Sparkles, Crown } from "lucide-react";
import { useLocation } from "wouter";

export default function ActionButtons() {
  const [, setLocation] = useLocation();
  
  const currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric' 
  });

  return (
    <div className="bg-gradient-to-r from-rose-50/90 via-white/95 to-purple-50/90 backdrop-blur-sm border-b border-rose-100/50 py-6 sticky top-20 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Book Now Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ 
              scale: 1.05, 
              y: -3,
              boxShadow: "0 20px 40px rgba(244, 63, 94, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => setLocation('/booking')}
            className="group relative flex items-center space-x-3 bg-gradient-to-r from-rose-600 via-pink-600 to-rose-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-rose-500/40 transition-all duration-500 font-bold text-base sm:text-lg min-w-[240px] justify-center border-2 border-rose-400/30"
            style={{
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="button-book-now"
          >
            {/* Animated Calendar Icon with Glow */}
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ 
                rotate: [0, -15, 15, -8, 8, 0],
                scale: [1, 1.2, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center relative"
            >
              <Calendar className="w-6 h-6 drop-shadow-lg" />
              {/* Icon Glow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-white/30 blur-sm"
              />
            </motion.div>
            
            <span className="tracking-wide">Book Now</span>
            
            {/* Multiple Sparkle Effects */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1.5,
                ease: "easeOut"
              }}
              className="absolute -top-2 -right-2 w-4 h-4"
            >
              <Sparkles className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 2.5,
                ease: "easeOut"
              }}
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full shadow-lg"
            />
            
            {/* Button Glow Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-rose-400 to-pink-400 blur-xl"
            />
          </motion.button>

          {/* Bold and Popping Divider */}
          <div className="hidden sm:flex items-center space-x-3">
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-12 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-purple-400 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xl px-4 py-2 rounded-full shadow-lg border-2 border-white/20">
                OR
              </div>
              {/* Glow effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-rose-400 to-purple-400 rounded-full blur-md"
              />
            </motion.div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-12 h-0.5 bg-gradient-to-l from-transparent via-purple-400 to-rose-400 rounded-full"
            />
          </div>
          <div className="sm:hidden flex items-center space-x-2">
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-8 h-0.5 bg-gradient-to-r from-transparent via-rose-400 to-purple-400 rounded-full"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.5, delay: 0.7 }}
              className="relative"
            >
              <div className="bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-lg px-3 py-1.5 rounded-full shadow-lg border-2 border-white/20">
                OR
              </div>
              {/* Mobile glow effect */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-rose-400 to-purple-400 rounded-full blur-md"
              />
            </motion.div>
            <motion.div 
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="w-8 h-0.5 bg-gradient-to-l from-transparent via-purple-400 to-rose-400 rounded-full"
            />
          </div>

          {/* Become Service Provider Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            whileHover={{ 
              scale: 1.05, 
              y: -3,
              boxShadow: "0 20px 40px rgba(147, 51, 234, 0.4)"
            }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => setLocation('/become-provider')}
            className="group relative flex items-center space-x-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white px-8 py-4 rounded-2xl shadow-2xl hover:shadow-purple-500/40 transition-all duration-500 font-bold text-base sm:text-lg min-w-[240px] justify-center border-2 border-purple-400/30"
            style={{
              WebkitAppearance: 'none',
              WebkitTapHighlightColor: 'transparent'
            }}
            data-testid="button-become-provider"
          >
            {/* Animated Crown Icon with Glow */}
            <motion.div
              initial={{ rotate: 0, scale: 1 }}
              animate={{ 
                rotate: [0, 8, -8, 5, -5, 0],
                scale: [1, 1.2, 1, 1.1, 1]
              }}
              transition={{ 
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeInOut"
              }}
              className="flex items-center justify-center relative"
            >
              <Crown className="w-6 h-6 drop-shadow-lg" />
              {/* Icon Glow */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.6, 0] }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 rounded-full bg-yellow-300/40 blur-sm"
              />
            </motion.div>
            
            <span className="tracking-wide">Become Service Provider</span>
            
            {/* Premium Badge Effect */}
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -45 }}
              animate={{ 
                opacity: [0, 1, 0], 
                scale: [0, 1.3, 0],
                rotate: [-45, 0, 45]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3,
                ease: "easeOut"
              }}
              className="absolute -top-2 -right-2 w-4 h-4"
            >
              <Crown className="w-4 h-4 text-yellow-300 drop-shadow-lg" />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 2.8,
                ease: "easeOut"
              }}
              className="absolute -bottom-1 -left-1 w-3 h-3 bg-yellow-300 rounded-full shadow-lg"
            />
            
            {/* Enhanced Shine Effect */}
            <motion.div
              initial={{ opacity: 0, x: -30, skewX: -15 }}
              animate={{ 
                opacity: [0, 0.8, 0], 
                x: [-30, 30, 60],
                skewX: [-15, 0, 15]
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                repeatDelay: 4,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-2xl"
            />
            
            {/* Button Glow Effect */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-400 to-indigo-400 blur-xl"
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}