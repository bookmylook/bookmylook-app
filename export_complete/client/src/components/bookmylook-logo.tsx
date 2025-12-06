import { motion } from "framer-motion";

export default function BookMyLookLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex items-center justify-center my-6"
    >
      <div className="relative">
        {/* Main logo container */}
        <div className="flex items-center space-x-3 bg-gradient-to-r from-rose-100 via-pink-50 to-purple-100 px-6 py-3 rounded-2xl shadow-lg border border-rose-200/50">
          
          {/* Left beauty icon */}
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex items-center space-x-1"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">✨</span>
            </div>
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs">🪒</span>
            </div>
          </motion.div>

          {/* Center text logo */}
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center"
          >
            <div className="text-2xl font-bold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent leading-none">
              BookMyLook
            </div>
            <div className="text-xs text-gray-600 font-medium tracking-wide italic">
              Your Style, Your Schedule
            </div>
          </motion.div>

          {/* Right beauty icon */}
          <motion.div
            initial={{ rotate: 10 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="flex items-center space-x-1"
          >
            <div className="w-6 h-6 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-xs">✂️</span>
            </div>
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-md">
              <span className="text-white text-sm font-bold">🧔</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative elements */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="absolute -top-2 -left-2 w-4 h-4 bg-rose-300 rounded-full opacity-60"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="absolute -bottom-2 -right-2 w-3 h-3 bg-purple-300 rounded-full opacity-60"
        />
        
        {/* Subtle glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-200/20 via-pink-200/20 to-purple-200/20 rounded-2xl blur-xl -z-10" />
      </div>
    </motion.div>
  );
}

// Alternative compact version for smaller spaces
export function BookMyLookLogoCompact() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex items-center space-x-2"
    >
      <div className="flex items-center space-x-1">
        <div className="w-6 h-6 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-xs">✨</span>
        </div>
        <div className="text-lg font-bold bg-gradient-to-r from-rose-600 to-purple-600 bg-clip-text text-transparent leading-none">
          BookMyLook
        </div>
        <div className="text-xs text-gray-600 font-medium tracking-wide italic">
          Your Style, Your Schedule
        </div>
        <div className="w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-sm">
          <span className="text-white text-xs">🧔</span>
        </div>
      </div>
    </motion.div>
  );
}