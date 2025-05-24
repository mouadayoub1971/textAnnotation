// Import Packages
"use client"
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import React from 'react';

// Import Libraries
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Import Icons
import { TbDatabase, TbUsers, TbNotes, TbChartBar } from 'react-icons/tb';
import { BsPersonCheck, BsClipboardData } from 'react-icons/bs';
import { HiOutlineDocumentText } from 'react-icons/hi2';

// Import Components
import { MobileSize } from '@/components';

// Import Templates
import { Sidebar } from '@/templates';

// Import Contexts
import { useSidebar } from '@/context/sidebarContext';
import { useAuth } from '@/context/authContext';

// Import Functions
import useHandleResize from '@/utils/handleResize';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

// API Configuration - Update these URLs to match your backend server
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

// Interfaces
interface StatisticsData {
  totalAnnotations: number;
  activeTasks: number;
  totalDatasets: number;
  totalAnnotateurs: number;
  completedDatasets: number;
  inProgressDatasets: number;
  unassignedDatasets: number;
  activeAnnotateurs: number;
  inactiveAnnotateurs: number;
  annotationStats: {
    completionRate: string;
    avgAnnotationsPerAnnotateur: string;
  };
  temporalStats: {
    recentAnnotations: number;
    recentActiveAnnotateurs: number;
    recentActivityRate: string;
  };
  datasetsProgress: {
    labels: string[];
    totalCouples: number[];
    annotatedCouples: number[];
    completionPercentages: number[];
  };
  currentUserName: string;
}

interface DatasetCouplesData {
  totalDatasets: number;
  datasetsWithCouples: Record<string, number>;
}

interface DatasetAnnotationCount {
  datasetId: number;
  datasetName: string;
  annotationsCount: number;
  totalCouples: number;
  completionPercentage: string;
}

interface CardProps {
  title: string;
  icon: JSX.Element;
  value: string;
  subtitle?: string;
  color: string;
}

// API Service Class
class StatisticsApiService {
  private static getAuthHeaders(token: string) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  static async getStatistics(token: string): Promise<StatisticsData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/api-statistics`, {
        headers: this.getAuthHeaders(token)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      throw new Error('Failed to fetch statistics data');
    }
  }

  static async getDatasetsCouplesCount(token: string): Promise<DatasetCouplesData> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/datasets/couples-count`, {
        headers: this.getAuthHeaders(token)
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching datasets couples count:', error);
      throw new Error('Failed to fetch datasets couples count');
    }
  }

  static async getDatasetAnnotationsCount(token: string, datasetId: number): Promise<DatasetAnnotationCount> {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/dataset/${datasetId}/annotations/count`, {
        headers: this.getAuthHeaders(token)
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching annotations count for dataset ${datasetId}:`, error);
      throw new Error(`Failed to fetch annotations count for dataset ${datasetId}`);
    }
  }
}

const StatCard: React.FC<CardProps> = ({ title, icon, value, subtitle, color }) => (
  <div className="bg-[#121A24] p-6 rounded-2xl flex items-center gap-4 hover:bg-[#1A2532] transition-colors duration-300">
    <div className={`p-4 rounded-xl ${color}`}>
      {React.cloneElement(icon, { size: 24, className: "text-white" })}
    </div>
    <div className="flex flex-col">
      <span className="text-gray-400 text-sm font-medium">{title}</span>
      <span className="text-white text-2xl font-bold">{value}</span>
      {subtitle && <span className="text-gray-500 text-xs">{subtitle}</span>}
    </div>
  </div>
);

// Statistics Dashboard Content Component
const StatisticsDashboard: React.FC<{ 
  open: boolean; 
  statisticsData: StatisticsData | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
}> = ({ open, statisticsData, loading, error, onRefresh }) => {
  
  if (loading) {
    return (
      <div className={`p-8 bg-[#18212E] h-screen ${open ? "w-[85vw]" : "w-[96vw]"} flex flex-col gap-5 justify-center items-center duration-500 origin-left`}>
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 text-lg">Loading statistics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 bg-[#18212E] h-screen ${open ? "w-[85vw]" : "w-[96vw]"} flex flex-col gap-5 justify-center items-center duration-500 origin-left`}>
        <div className="text-red-400 text-center">
          <h2 className="text-2xl font-bold mb-4">Error Loading Statistics</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={onRefresh}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!statisticsData) {
    return (
      <div className={`p-8 bg-[#18212E] h-screen ${open ? "w-[85vw]" : "w-[96vw]"} flex flex-col gap-5 justify-center items-center duration-500 origin-left`}>
        <p className="text-gray-400 text-lg">No statistics data available</p>
      </div>
    );
  }

  const data = statisticsData;

  // Chart configurations
  const datasetProgressChartData = {
    labels: data.datasetsProgress.labels,
    datasets: [
      {
        label: 'Total Couples',
        data: data.datasetsProgress.totalCouples,
        backgroundColor: 'rgba(59, 130, 246, 0.3)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
      },
      {
        label: 'Annotated Couples',
        data: data.datasetsProgress.annotatedCouples,
        backgroundColor: 'rgba(16, 185, 129, 0.3)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }
    ]
  };

  const datasetStatusChartData = {
    labels: ['Completed', 'In Progress', 'Unassigned'],
    datasets: [{
      data: [data.completedDatasets, data.inProgressDatasets, data.unassignedDatasets],
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(16, 185, 129, 1)',
        'rgba(245, 158, 11, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  };

  const completionRateChartData = {
    labels: data.datasetsProgress.labels,
    datasets: [{
      label: 'Completion Rate (%)',
      data: data.datasetsProgress.completionPercentages,
      fill: false,
      borderColor: 'rgba(147, 51, 234, 1)',
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      tension: 0.4,
      pointBackgroundColor: 'rgba(147, 51, 234, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 6
    }]
  };

  const annotateurStatusChartData = {
    labels: ['Active', 'Inactive'],
    datasets: [{
      data: [data.activeAnnotateurs, data.inactiveAnnotateurs],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(156, 163, 175, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(156, 163, 175, 1)'
      ],
      borderWidth: 2
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(156, 163, 175, 0.1)'
        }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: '#ffffff',
          font: {
            size: 12
          },
          padding: 20
        }
      }
    }
  };

  return (
    <div className={`p-8 bg-[#18212E] h-screen ${open ? "w-[85vw]" : "w-[96vw]"} flex flex-col gap-5 justify-center items-center duration-500 origin-left overflow-y-auto `}>
      {/* Header */}
      <div className="w-full mb-4 flex justify-between items-center mt-12">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Statistics Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, {data.currentUserName}! Here's your annotation platform overview.
          </p>
        </div>
        <button 
          onClick={onRefresh}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Main Statistics Cards */}
      <div className="flex gap-4 w-full justify-center px-3 mb-4 mt-6">
        <StatCard
          title="Total Annotations"
          icon={<TbNotes />}
          value={data.totalAnnotations.toLocaleString()}
          subtitle={`${data.annotationStats.completionRate}% completion rate`}
          color="bg-blue-500"
        />
        <StatCard
          title="Active Tasks"
          icon={<TbChartBar />}
          value={data.activeTasks.toString()}
          subtitle="Currently running"
          color="bg-green-500"
        />
        <StatCard
          title="Total Datasets"
          icon={<TbDatabase />}
          value={data.totalDatasets.toString()}
          subtitle={`${data.completedDatasets} completed`}
          color="bg-purple-500"
        />
        <StatCard
          title="Annotators"
          icon={<TbUsers />}
          value={data.totalAnnotateurs.toString()}
          subtitle={`${data.activeAnnotateurs} active`}
          color="bg-orange-500"
        />
      </div>

      {/* Secondary Statistics */}
      <div className="flex gap-4 w-full justify-center px-3 mb-4">
        <StatCard
          title="Recent Annotations"
          icon={<BsClipboardData />}
          value={data.temporalStats.recentAnnotations.toString()}
          subtitle="Last period"
          color="bg-cyan-500"
        />
        <StatCard
          title="Avg per Annotator"
          icon={<BsPersonCheck />}
          value={parseFloat(data.annotationStats.avgAnnotationsPerAnnotateur).toFixed(0)}
          subtitle="annotations each"
          color="bg-indigo-500"
        />
        <StatCard
          title="Activity Rate"
          icon={<HiOutlineDocumentText />}
          value={`${data.temporalStats.recentActivityRate}%`}
          subtitle="recent activity"
          color="bg-pink-500"
        />
      </div>

      {/* Charts Grid */}
      <div className="flex gap-4 w-full justify-center px-3 mb-4">
        {/* Dataset Progress Chart */}
        <div className={`bg-[#121A24] p-6 rounded-2xl ${open ? "w-[40vw]" : "w-[45vw]"} h-[400px] duration-500 origin-left`}>
          <h3 className="text-xl font-semibold text-white mb-4">Dataset Progress</h3>
          <div className="h-80">
            <Bar data={datasetProgressChartData} options={chartOptions} />
          </div>
        </div>

        {/* Dataset Status Distribution */}
        <div className={`bg-[#121A24] p-6 rounded-2xl ${open ? "w-[40vw]" : "w-[45vw]"} h-[400px] duration-500 origin-left`}>
          <h3 className="text-xl font-semibold text-white mb-4">Dataset Status</h3>
          <div className="h-80">
            <Doughnut data={datasetStatusChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>

      {/* Bottom Charts */}
      <div className="flex gap-4 w-full justify-center px-3">
        {/* Completion Rate Trend */}
        <div className={`bg-[#121A24] p-6 rounded-2xl ${open ? "w-[40vw]" : "w-[45vw]"} h-[400px] duration-500 origin-left`}>
          <h3 className="text-xl font-semibold text-white mb-4">Completion Rate by Dataset</h3>
          <div className="h-80">
            <Line data={completionRateChartData} options={chartOptions} />
          </div>
        </div>

        {/* Annotator Status */}
        <div className={`bg-[#121A24] p-6 rounded-2xl ${open ? "w-[40vw]" : "w-[45vw]"} h-[400px] duration-500 origin-left`}>
          <h3 className="text-xl font-semibold text-white mb-4">Annotator Status</h3>
          <div className="h-80">
            <Doughnut data={annotateurStatusChartData} options={doughnutOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Page Component
const StatisticsPage = () => {
  // Router
  const router = useRouter();
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/");
    }
  }, [router]);

  // Util
  const isDesktop = useHandleResize();

  // Context
  const { open } = useSidebar();
  const { token, username } = useAuth();

  // State
  const [statisticsData, setStatisticsData] = useState<StatisticsData | null>(null);
  const [datasetsCouplesData, setDatasetsCouplesData] = useState<DatasetCouplesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Statistics Data
  const fetchStatistics = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);
      
      // Fetch main statistics
      const statisticsResponse = await StatisticsApiService.getStatistics(token);
      setStatisticsData(statisticsResponse);
      
      // Optionally fetch additional datasets couples data
      // const couplesResponse = await StatisticsApiService.getDatasetsCouplesCount(token);
      // setDatasetsCouplesData(couplesResponse);
      
    } catch (err: any) {
      console.error('Error fetching statistics:', err);
      setError(err.message || 'Failed to fetch statistics');
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch specific dataset annotation count (example usage)
  const fetchDatasetAnnotationCount = useCallback(async (datasetId: number) => {
    if (!token) return;

    try {
      const response = await StatisticsApiService.getDatasetAnnotationsCount(token, datasetId);
      console.log(`Dataset ${datasetId} annotation count:`, response);
      // Handle the response as needed
    } catch (err: any) {
      console.error(`Error fetching dataset ${datasetId} annotation count:`, err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchStatistics();
    }
  }, [token, fetchStatistics]);

  // Refresh function
  const handleRefresh = useCallback(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  console.log("API Base URL:", API_BASE_URL);
  console.log("Token:", token);
  console.log("Username:", username);
  console.log("Statistics Data:", statisticsData);

  return (
    <>
      {isDesktop ? (
        <div className="flex fixed ">
          <Sidebar page="/statistics" />
          <StatisticsDashboard 
            open={open} 
            statisticsData={statisticsData}
            loading={loading}
            error={error}
            onRefresh={handleRefresh}
          />
        </div>
      ) : (
        <MobileSize />
      )}
    </>
  );
};

export default StatisticsPage;