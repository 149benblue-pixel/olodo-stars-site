import React, { useState, useEffect } from 'react';
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from 'date-fns';

interface CountdownTimerProps {
  targetDate: Date;
  className?: string;
  variant?: 'large' | 'compact';
}

export const CountdownTimer = ({ targetDate, className = '', variant = 'compact' }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, min: number, sec: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      if (targetDate > now) {
        setTimeLeft({
          days: differenceInDays(targetDate, now),
          hours: differenceInHours(targetDate, now) % 24,
          min: differenceInMinutes(targetDate, now) % 60,
          sec: differenceInSeconds(targetDate, now) % 60
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  if (variant === 'large') {
    return (
      <div className={`flex gap-4 sm:gap-6 ${className}`}>
        <div className="text-center">
          <div className="text-3xl font-black text-white font-mono">{String(timeLeft.days).padStart(2, '0')}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Days</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-white font-mono">{String(timeLeft.hours).padStart(2, '0')}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Hrs</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-black text-white font-mono">{String(timeLeft.min).padStart(2, '0')}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Min</div>
        </div>
        <div className="text-center border-l border-white/10 pl-4 sm:pl-6">
          <div className="text-3xl font-black text-red-600 font-mono">{String(timeLeft.sec).padStart(2, '0')}</div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-red-900/40">Sec</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 text-[10px] font-black font-mono ${className}`}>
      <div className="flex flex-col items-center">
        <span className="text-gray-900">{String(timeLeft.days).padStart(2, '0')}d</span>
      </div>
      <span className="text-gray-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-gray-900">{String(timeLeft.hours).padStart(2, '0')}h</span>
      </div>
      <span className="text-gray-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-gray-900">{String(timeLeft.min).padStart(2, '0')}m</span>
      </div>
      <span className="text-gray-300">:</span>
      <div className="flex flex-col items-center">
        <span className="text-red-600">{String(timeLeft.sec).padStart(2, '0')}s</span>
      </div>
    </div>
  );
};
