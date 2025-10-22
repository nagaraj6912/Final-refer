'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface FomoTimerProps {
  durationInHours: number;
}

export default function FomoTimer({ durationInHours }: FomoTimerProps) {
  const [timeLeft, setTimeLeft] = useState(durationInHours * 60 * 60);

  useEffect(() => {
    // Don't run countdown on the server
    if (typeof window === 'undefined') {
      return;
    }

    if (timeLeft <= 0) return;

    // Set up the interval
    const intervalId = setInterval(() => {
      setTimeLeft((prevTime) => prevTime - 1);
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [timeLeft]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <motion.div
      className="flex gap-2 items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <span className="countdown font-mono text-2xl bg-base-100 text-secondary-content p-2 rounded-lg">
        <span style={{ '--value': hours } as React.CSSProperties}></span>
      </span>
      :
      <span className="countdown font-mono text-2xl bg-base-100 text-secondary-content p-2 rounded-lg">
        <span style={{ '--value': minutes } as React.CSSProperties}></span>
      </span>
      :
      <span className="countdown font-mono text-2xl bg-base-100 text-secondary-content p-2 rounded-lg">
        <span style={{ '--value': seconds } as React.CSSProperties}></span>
      </span>
    </motion.div>
  );
}