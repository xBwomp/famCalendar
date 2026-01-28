import React, { useEffect, useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeBackground: React.FC = () => {
  const { theme } = useTheme();
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Standard subtle gradient animation for default theme
  const DefaultBackground = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-400/20 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[100px]" />
    </motion.div>
  );

  // Falling snow for Christmas
  const ChristmasBackground = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white rounded-full opacity-70"
          initial={{
            x: Math.random() * dimensions.width,
            y: -20,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: dimensions.height + 20,
            x: Math.random() * dimensions.width + (Math.random() - 0.5) * 100, // drift
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
          style={{
            width: Math.random() * 6 + 4 + 'px',
            height: Math.random() * 6 + 4 + 'px',
          }}
        />
      ))}
    </motion.div>
  );

  // Floating ghosts/particles for Halloween
  const HalloweenBackground = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Fog effect */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-gray-900/20 to-transparent blur-xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 5, repeat: Infinity }}
      />
      
      {[...Array(15)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-orange-500/10 blur-md"
          initial={{
            x: Math.random() * dimensions.width,
            y: dimensions.height + 20,
          }}
          animate={{
            y: -50,
            x: Math.random() * dimensions.width + (Math.random() - 0.5) * 200,
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 15,
            repeat: Infinity,
            delay: Math.random() * 15,
            ease: "easeInOut",
          }}
          style={{
            width: Math.random() * 30 + 20 + 'px',
            height: Math.random() * 30 + 20 + 'px',
          }}
        />
      ))}
    </motion.div>
  );

    // Confetti for New Years
    const NewYearsBackground = () => (
      <motion.div
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {[...Array(40)].map((_, i) => (
            <motion.div
            key={i}
            className="absolute rounded-sm"
            style={{
                backgroundColor: ['#FFD700', '#C0C0C0', '#FF69B4', '#00BFFF'][Math.floor(Math.random() * 4)],
                width: '8px',
                height: '8px',
            }}
            initial={{
                x: Math.random() * dimensions.width,
                y: -20,
                rotate: 0,
            }}
            animate={{
                y: dimensions.height + 20,
                rotate: 360,
                x: (i % 2 === 0 ? 1 : -1) * Math.random() * 50 + Math.random() * dimensions.width,
            }}
            transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear",
            }}
            />
        ))}
      </motion.div>
    );

  // Autumn leaves for Thanksgiving
  const ThanksgivingBackground = () => (
    <motion.div
      className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            color: ['#8B4513', '#D2691E', '#CD853F', '#DEB887'][Math.floor(Math.random() * 4)],
          }}
          initial={{
            x: Math.random() * dimensions.width,
            y: -20,
            rotate: 0,
          }}
          animate={{
            y: dimensions.height + 20,
            x: (i % 2 === 0 ? 100 : -100) + Math.random() * dimensions.width,
            rotate: 360,
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 10,
            ease: "linear",
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L15 8L21 9L17 14L18 20L12 17L6 20L7 14L3 9L9 8L12 2Z" />
          </svg>
        </motion.div>
      ))}
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
        {theme.name === 'Christmas' && <ChristmasBackground key="christmas" />}
        {theme.name === 'Halloween' && <HalloweenBackground key="halloween" />}
        {theme.name === 'NewYears' && <NewYearsBackground key="newyears" />}
        {theme.name === 'Thanksgiving' && <ThanksgivingBackground key="thanksgiving" />}
        {theme.name === 'Default' && <DefaultBackground key="default" />}
    </AnimatePresence>
  );
};

export default ThemeBackground;
