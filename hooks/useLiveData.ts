'use client';

import { useState, useEffect } from 'react';
import { seriesData, getCurrentIndex, type SeriesData } from '@/data/series';

export function useLiveData() {
  const [currentData, setCurrentData] = useState<SeriesData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Initialize with current data based on elapsed time
    const initialIndex = Math.max(100, getCurrentIndex()); // Start with at least 100 points for the chart
    setCurrentIndex(initialIndex);
    setCurrentData(seriesData.slice(0, initialIndex));

    // Update every second to simulate real-time
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = Math.min(prevIndex + 1, seriesData.length - 1);
        setCurrentData(seriesData.slice(Math.max(0, nextIndex - 200), nextIndex + 1)); // Keep last 200 points
        return nextIndex;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return currentData;
}

