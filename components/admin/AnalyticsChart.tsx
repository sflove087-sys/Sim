import React, { useEffect, useRef } from 'react';
import { AdminChartData } from '../../types';
import { toBengaliNumber } from '../../utils/formatters';

// Ensure Chart.js is available globally from the CDN
declare const Chart: any;

interface AnalyticsChartProps {
    data: AdminChartData | null;
    isLoading: boolean;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ data, isLoading }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<any>(null);

    useEffect(() => {
        if (!chartRef.current || !data) return;

        // Destroy previous chart instance before creating a new one
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }

        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;

        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [
                    {
                        label: 'নতুন ব্যবহারকারী',
                        data: data.signupData,
                        borderColor: 'rgb(20, 184, 166)', // teal-500
                        backgroundColor: 'rgba(20, 184, 166, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: 'rgb(15, 118, 110)', // teal-600
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    },
                    {
                        label: 'সফল অর্ডার',
                        data: data.orderData,
                        borderColor: 'rgb(59, 130, 246)', // blue-500
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointBackgroundColor: 'rgb(37, 99, 235)', // blue-600
                        pointRadius: 4,
                        pointHoverRadius: 6,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            font: {
                                family: "'Noto Sans Bengali', sans-serif",
                                size: 14,
                            }
                        }
                    },
                    tooltip: {
                        titleFont: { family: "'Noto Sans Bengali', sans-serif" },
                        bodyFont: { family: "'Noto Sans Bengali', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += toBengaliNumber(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                // Only show integer ticks
                                if (Math.floor(value) === value) {
                                    return toBengaliNumber(value);
                                }
                            },
                            font: {
                                family: "'Noto Sans Bengali', sans-serif",
                            }
                        },
                        grid: {
                            color: 'rgba(200, 200, 200, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            font: {
                                family: "'Noto Sans Bengali', sans-serif",
                            }
                        },
                        grid: {
                            display: false,
                        }
                    }
                }
            }
        });

        // Cleanup function to destroy chart on component unmount
        return () => {
            if (chartInstance.current) {
                chartInstance.current.destroy();
            }
        };

    }, [data]);

    if (isLoading) {
        return (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg animate-pulse">
                <div className="h-8 w-48 bg-slate-200 dark:bg-slate-700 rounded-md mb-6"></div>
                <div className="h-64 bg-slate-200 dark:bg-slate-700 rounded-md"></div>
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-lg">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">বিগত ৭ দিনের কার্যক্রম</h2>
            <div className="relative h-72 md:h-80">
                <canvas ref={chartRef}></canvas>
            </div>
        </div>
    );
};

export default AnalyticsChart;