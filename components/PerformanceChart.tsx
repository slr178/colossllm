'use client';

import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
  TooltipItem,
} from 'chart.js';
import { models } from '@/data/models';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface PerformanceData {
  timestamp: number;
  ai1: number;
  ai2: number;
  ai3: number;
  ai4: number;
  ai5: number;
  ai6: number;
}

interface PerformanceChartProps {
  data: PerformanceData[];
  initialBalances?: number[];
}

export default function PerformanceChart({ data, initialBalances = [1900, 1900, 1900, 1900, 1900, 1900] }: PerformanceChartProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);
  const logoImages = useRef<{ [key: string]: HTMLImageElement }>({});

  // Preload logo images
  useEffect(() => {
    models.forEach((model) => {
      const img = new Image();
      img.src = model.logo;
      logoImages.current[model.id] = img;
    });
  }, []);

  // Show absolute portfolio values
  const chartData = {
    labels: data.map(d => new Date(d.timestamp).toLocaleTimeString()),
    datasets: models.map((model, idx) => {
      return {
        label: model.name,
        data: data.map(d => {
          const value = d[`ai${idx + 1}` as keyof PerformanceData];
          return value; // Show actual portfolio value
        }),
        borderColor: model.color,
        backgroundColor: model.color + '20',
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        pointHoverRadius: 5,
      };
    }),
  };

  // Custom plugin to draw logos at end of lines
  const logoPlugin = {
    id: 'logoPlugin',
    afterDraw: (chart: ChartJS) => {
      const ctx = chart.ctx;
      const datasets = chart.data.datasets;
      
      datasets.forEach((dataset, idx) => {
        const meta = chart.getDatasetMeta(idx);
        const lastPoint = meta.data[meta.data.length - 1];
        
        if (lastPoint && data.length > 0) {
          const model = models[idx];
          const img = logoImages.current[model.id];
          
          // Draw a circle background
          ctx.save();
          ctx.beginPath();
          ctx.arc(lastPoint.x, lastPoint.y, 12, 0, 2 * Math.PI);
          ctx.fillStyle = model.color + '20';
          ctx.fill();
          ctx.strokeStyle = model.color;
          ctx.lineWidth = 2;
          ctx.stroke();
          
          // Draw the logo
          if (img && img.complete) {
            ctx.drawImage(img, lastPoint.x - 8, lastPoint.y - 8, 16, 16);
          }
          ctx.restore();
        }
      });
    },
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'PORTFOLIO VALUE ($)',
        color: '#999',
        font: {
          size: 11,
          family: 'monospace',
          weight: 'normal',
        },
        padding: {
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: '#333',
        borderWidth: 1,
        titleFont: {
          size: 11,
          family: 'monospace',
        },
        bodyFont: {
          size: 11,
          family: 'monospace',
        },
        padding: 10,
        displayColors: true,
        callbacks: {
          label: (context: TooltipItem<'line'>) => {
            const currentValue = context.parsed.y;
            const idx = context.datasetIndex;
            const initial = initialBalances[idx] || 1900;
            const pnl = currentValue - initial;
            const pnlPercent = (pnl / initial) * 100;
            const sign = pnl >= 0 ? '+' : '';
            return `${context.dataset.label}: $${currentValue.toFixed(2)} (${sign}${pnlPercent.toFixed(2)}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: '#666',
          font: {
            size: 10,
            family: 'monospace',
          },
          maxTicksLimit: 10,
          maxRotation: 0,
        },
      },
      y: {
        display: true,
        position: 'right',
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
          lineWidth: 1,
          drawBorder: false,
        },
        ticks: {
          color: '#999',
          font: {
            size: 10,
            family: 'monospace',
          },
          callback: (value) => `$${value}`,
        },
        beginAtZero: false,
        suggestedMin: 1850,
        suggestedMax: 2050,
      },
    },
  };

  // Update chart smoothly
  useEffect(() => {
    if (chartRef.current && data.length > 1) {
      chartRef.current.update('none');
    }
  }, [data]);

  return (
    <div className="h-full w-full relative bg-black rounded-lg">
      <Line ref={chartRef} data={chartData} options={options} plugins={[logoPlugin]} />
      
      {/* AI Avatars with current values */}
      <div className="absolute bottom-6 left-6 right-6 flex justify-between">
        {models.map((model, idx) => {
          const currentValue = data.length > 0 ? data[data.length - 1][`ai${idx + 1}` as keyof PerformanceData] : initialBalances[idx];
          const initial = initialBalances[idx] || 1900;
          const pnl = currentValue - initial;
          const pnlPercent = initial > 0 ? (pnl / initial) * 100 : 0;
          
          return (
            <div key={model.id} className="flex items-center gap-2">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center border-2"
                style={{ borderColor: model.color, backgroundColor: model.color + '20' }}
              >
                <img src={model.logo} alt={model.name} className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="font-mono font-bold" style={{ color: model.color }}>
                  ${currentValue.toFixed(2)}
                </div>
                <div className={`font-mono text-[10px] ${pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {pnl >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
