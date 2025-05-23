"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardList,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  LogOut,
  StickyNote,
  BarChart3,
  CheckSquare,
  ClipboardCheck
} from 'lucide-react';

// Mock API Configuration
const API_BASE_URL = 'http://localhost:8080';

// Interfaces
interface Task {
  id: number;
  title: string;
  description: string;
  dataset: {
    id: number;
    name: string;
  };
  couples: Array<{
    id: number;
    text1: string;
    text2: string;
  }>;
  createdAt: string;
}

interface TaskDetail {
  task: Task;
  currentCouple: {
    id: number;
    text1: string;
    text2: string;
  };
  currentIndex: number;
  totalCouples: number;
  selectedClassId: string | null;
  userName: string;
}

interface AnnotationClass {
  id: string;
  name: string;
  description: string;
}

interface Annotation {
  id: number;
  classSelection: string;
  createdAt: string;
  coupleText: {
    id: number;
    text1: string;
    text2: string;
  };
  task: {
    id: number;
    title: string;
  };
}

// Mock API Service
class UserTasksApiService {
  // Mock data
  static mockTasks: Task[] = [
    {
      id: 1,
      title: "Text Similarity Analysis",
      description: "Annotate text pairs for similarity detection",
      dataset: { id: 1, name: "News Articles Dataset" },
      couples: [
        { id: 1, text1: "The weather is nice today.", text2: "Today has beautiful weather." },
        { id: 2, text1: "I love programming.", text2: "Coding is my passion." },
        { id: 3, text1: "The cat is sleeping.", text2: "A dog is running in the park." }
      ],
      createdAt: "2024-01-15T10:00:00Z"
    },
    {
      id: 2,
      title: "Sentiment Classification",
      description: "Classify sentiment in social media posts",
      dataset: { id: 2, name: "Twitter Posts Dataset" },
      couples: [
        { id: 4, text1: "This movie is amazing!", text2: "Great film, loved it!" },
        { id: 5, text1: "Terrible service today.", text2: "Very disappointed with the quality." }
      ],
      createdAt: "2024-01-16T14:30:00Z"
    }
  ];

static mockProgress: Record<number, number> = { 1: 1, 2: 0 };

  static mockClasses: AnnotationClass[] = [
    { id: "similar", name: "Similar", description: "Texts have similar meaning" },
    { id: "different", name: "Different", description: "Texts have different meanings" },
    { id: "neutral", name: "Neutral", description: "Unclear or neutral relationship" }
  ];

  static mockAnnotations: Annotation[] = [
    {
      id: 1,
      classSelection: "similar",
      createdAt: "2024-01-15T11:00:00Z",
      coupleText: { id: 1, text1: "The weather is nice today.", text2: "Today has beautiful weather." },
      task: { id: 1, title: "Text Similarity Analysis" }
    }
  ];

  static async getUserTasks(): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          tasks: this.mockTasks,
          taskProgressMap: this.mockProgress,
          userName: "John Doe"
        });
      }, 1000);
    });
  }

  static async getTaskDetail(taskId: number, index?: number): Promise<TaskDetail> {
    return new Promise(resolve => {
      setTimeout(() => {
        const task = this.mockTasks.find(t => t.id === taskId);
        const currentIndex = index ?? this.mockProgress[taskId] ?? 0;
        const currentCouple = task?.couples[currentIndex];
        
        resolve({
          task: task!,
          currentCouple: currentCouple!,
          currentIndex,
          totalCouples: task?.couples.length ?? 0,
          selectedClassId: null,
          userName: "John Doe"
        });
      }, 500);
    });
  }

  static async submitAnnotation(taskId: number, coupleId: number, classSelection: string, currentIndex: number): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        // Update progress
        this.mockProgress[taskId] = currentIndex + 1;
        
        // Add to annotations
        const task = this.mockTasks.find(t => t.id === taskId);
        const couple = task?.couples.find(c => c.id === coupleId);
        
        if (task && couple) {
          this.mockAnnotations.push({
            id: this.mockAnnotations.length + 1,
            classSelection,
            createdAt: new Date().toISOString(),
            coupleText: couple,
            task: { id: task.id, title: task.title }
          });
        }

        const nextIndex = currentIndex + 1;
        const completed = task && nextIndex >= task.couples.length;

        resolve({
          message: "Annotation saved successfully",
          nextIndex,
          completed,
          completionMessage: completed ? "Congratulations! You have completed all annotations for this task." : undefined
        });
      }, 500);
    });
  }

  static async getUserHistory(): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          annotations: this.mockAnnotations,
          userName: "John Doe"
        });
      }, 500);
    });
  }

  static async getAnnotationClasses(): Promise<any> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve({
          classes: this.mockClasses,
          taskId: 1,
          datasetId: 1
        });
      }, 300);
    });
  }
}

// Header Component
const Header = ({ userName, onLogout }: { userName: string; onLogout: () => void }) => (
  <div className="bg-[#121A24] px-8 py-4 flex justify-between items-center border-b border-gray-700">
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
        <StickyNote className="text-white" size={20} />
      </div>
      <div>
        <h1 className="text-white text-xl font-medium">AnnotationHub</h1>
        <p className="text-gray-400 text-sm">Welcome back, {userName}</p>
      </div>
    </div>
    <button
      onClick={onLogout}
      className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors"
    >
      <LogOut size={18} />
      Logout
    </button>
  </div>
);

// Navigation Tabs
const NavigationTabs = ({ 
  activeTab, 
  onTabChange 
}: { 
  activeTab: string; 
  onTabChange: (tab: string) => void;
}) => {
  const tabs = [
    { id: 'tasks', label: 'My Tasks', icon: <ClipboardList /> },
    { id: 'annotate', label: 'Annotate', icon: <FileText /> },
    { id: 'history', label: 'History', icon: <Clock /> }
  ];

  return (
    <div className="bg-[#121A24] px-8 py-4 border-b border-gray-700">
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id 
                ? 'bg-[#1A2532] text-white' 
                : 'text-gray-400 hover:text-white hover:bg-[#1A2532]'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Task Card Component
const TaskCard = ({ 
  task, 
  progress, 
  onStartAnnotation 
}: { 
  task: Task; 
  progress: number; 
  onStartAnnotation: (taskId: number) => void;
}) => {
  const totalCouples = task.couples?.length || 0;
  const completionPercentage = totalCouples > 0 ? (progress / totalCouples) * 100 : 0;

  return (
    <div className="bg-[#121A24] p-6 rounded-2xl hover:bg-[#1A2532] transition-colors duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-white mb-2">{task.title}</h3>
          <p className="text-gray-400 text-sm mb-2">{task.description}</p>
          <p className="text-gray-500 text-xs">Dataset: {task.dataset?.name}</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-blue-400">{Math.round(completionPercentage)}%</span>
          <p className="text-gray-500 text-xs">Complete</p>
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-400 mb-1">
          <span>Progress</span>
          <span>{progress} / {totalCouples}</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      <button
        onClick={() => onStartAnnotation(task.id)}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors"
      >
        {progress === 0 ? 'Start Task' : 'Continue Task'}
      </button>
    </div>
  );
};

// Stats Card Component
const StatCard = ({ 
  title, 
  icon, 
  value, 
  subtitle, 
  color 
}: { 
  title: string; 
  icon: JSX.Element; 
  value: string; 
  subtitle?: string; 
  color: string;
}) => (
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

// Tasks Tab Component
const TasksTab = ({ 
  userTasksData, 
  loading, 
  onStartAnnotation 
}: { 
  userTasksData: any; 
  loading: boolean; 
  onStartAnnotation: (taskId: number) => void;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center py-20">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        <p className="text-gray-400 text-lg">Loading your tasks...</p>
      </div>
    );
  }

  if (!userTasksData) return null;

  const { tasks, taskProgressMap } = userTasksData;

  // Calculate statistics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task: Task) => {
    const progress = taskProgressMap[task.id] || 0;
    const totalCouples = task.couples?.length || 0;
    return progress >= totalCouples;
  }).length;
  const inProgressTasks = tasks.filter((task: Task) => {
    const progress = taskProgressMap[task.id] || 0;
    return progress > 0 && progress < (task.couples?.length || 0);
  }).length;
  const totalAnnotations = Object.values(taskProgressMap).reduce((sum: number, progress: any) => sum + progress, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Tasks"
          icon={<BarChart3 />}
          value={totalTasks.toString()}
          subtitle="assigned to you"
          color="bg-blue-500"
        />
        <StatCard
          title="Completed"
          icon={<CheckSquare />}
          value={completedTasks.toString()}
          subtitle="tasks finished"
          color="bg-green-500"
        />
        <StatCard
          title="In Progress"
          icon={<ClipboardCheck />}
          value={inProgressTasks.toString()}
          subtitle="tasks ongoing"
          color="bg-yellow-500"
        />
        <StatCard
          title="Total Annotations"
          icon={<StickyNote />}
          value={totalAnnotations.toString()}
          subtitle="couples annotated"
          color="bg-purple-500"
        />
      </div>

      {/* Tasks Grid */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">Your Tasks</h2>
        {tasks.length === 0 ? (
          <div className="bg-[#121A24] p-8 rounded-2xl text-center">
            <StickyNote className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No Tasks Assigned</h3>
            <p className="text-gray-500">You don't have any annotation tasks assigned yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task: Task) => (
              <TaskCard
                key={task.id}
                task={task}
                progress={taskProgressMap[task.id] || 0}
                onStartAnnotation={onStartAnnotation}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Annotation Tab Component
const AnnotationTab = ({ 
  selectedTaskId, 
  taskDetail, 
  annotationClasses,
  loading, 
  onSubmitAnnotation,
  onNavigate 
}: { 
  selectedTaskId: number | null;
  taskDetail: TaskDetail | null;
  annotationClasses: AnnotationClass[];
  loading: boolean;
  onSubmitAnnotation: (classSelection: string, notes: string) => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}) => {
  const [selectedClass, setSelectedClass] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    setSelectedClass('');
    setNotes('');
  }, [taskDetail?.currentIndex]);

  if (!selectedTaskId) {
    return (
      <div className="bg-[#121A24] p-8 rounded-2xl text-center">
        <FileText className="mx-auto text-gray-500 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Task Selected</h3>
        <p className="text-gray-500">Please select a task from the Tasks tab to start annotating.</p>
      </div>
    );
  }

  if (loading || !taskDetail) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="text-gray-400">Loading task details...</p>
      </div>
    );
  }

  const { task, currentCouple, currentIndex, totalCouples } = taskDetail;
  const progressPercentage = ((currentIndex + 1) / totalCouples) * 100;

  const handleSubmit = () => {
    if (selectedClass) {
      onSubmitAnnotation(selectedClass, notes);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Task Header */}
      <div className="bg-[#121A24] p-6 rounded-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-semibold text-white mb-2">{task.title}</h2>
            <p className="text-gray-400 mb-2">{task.description}</p>
            <p className="text-gray-500 text-sm">Dataset: {task.dataset.name}</p>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-blue-400">
              {currentIndex + 1} / {totalCouples}
            </span>
            <p className="text-gray-500 text-sm">Current Progress</p>
          </div>
        </div>
        
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Text Pair */}
      <div className="bg-[#121A24] p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">Text Pair to Annotate</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#1A2532] p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Text 1</h4>
            <p className="text-gray-300">{currentCouple.text1}</p>
          </div>
          <div className="bg-[#1A2532] p-4 rounded-lg">
            <h4 className="text-blue-400 font-medium mb-2">Text 2</h4>
            <p className="text-gray-300">{currentCouple.text2}</p>
          </div>
        </div>
      </div>

      {/* Annotation Form */}
      <div className="bg-[#121A24] p-6 rounded-2xl">
        <h3 className="text-xl font-semibold text-white mb-4">Select Classification</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          {annotationClasses.map(cls => (
            <button
              key={cls.id}
              onClick={() => setSelectedClass(cls.id)}
              className={`p-4 rounded-lg border-2 transition-colors ${
                selectedClass === cls.id
                  ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                  : 'border-gray-600 bg-[#1A2532] text-gray-300 hover:border-gray-500'
              }`}
            >
              <div className="font-medium mb-1">{cls.name}</div>
              <div className="text-sm opacity-75">{cls.description}</div>
            </button>
          ))}
        </div>

        <div className="mb-6">
          <label className="block text-white font-medium mb-2">Notes (Optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full p-3 bg-[#1A2532] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Add any additional notes about this annotation..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('prev')}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            <ChevronLeft />
            Previous
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={!selectedClass}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Submit Annotation
          </button>
          
          <button
            onClick={() => onNavigate('next')}
            disabled={currentIndex >= totalCouples - 1}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors"
          >
            Next
            <ChevronRight />
          </button>
        </div>
      </div>
    </div>
  );
};

// History Tab Component
const HistoryTab = ({ 
  historyData, 
  loading 
}: { 
  historyData: any; 
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col gap-5 justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
        <p className="text-gray-400">Loading annotation history...</p>
      </div>
    );
  }

  if (!historyData || !historyData.annotations.length) {
    return (
      <div className="bg-[#121A24] p-8 rounded-2xl text-center">
        <Clock className="mx-auto text-gray-500 mb-4" size={48} />
        <h3 className="text-xl font-semibold text-gray-400 mb-2">No Annotations Yet</h3>
        <p className="text-gray-500">Your annotation history will appear here once you start annotating.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-[#121A24] p-6 rounded-2xl">
        <h2 className="text-2xl font-semibold text-white mb-2">Annotation History</h2>
        <p className="text-gray-400">Total annotations: {historyData.annotations.length}</p>
      </div>

      <div className="space-y-4">
        {historyData.annotations.map((annotation: Annotation) => (
          <div key={annotation.id} className="bg-[#121A24] p-6 rounded-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white">{annotation.task.title}</h3>
                <p className="text-blue-400 font-medium">Classification: {annotation.classSelection}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(annotation.createdAt).toLocaleDateString()} at {new Date(annotation.createdAt).toLocaleTimeString()}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1A2532] p-4 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Text 1</h4>
                <p className="text-gray-300 text-sm">{annotation.coupleText.text1}</p>
              </div>
              <div className="bg-[#1A2532] p-4 rounded-lg">
                <h4 className="text-blue-400 font-medium mb-2">Text 2</h4>
                <p className="text-gray-300 text-sm">{annotation.coupleText.text2}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main App Component
const UserTasksApp = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [userName] = useState('John Doe');
  
  // Tasks data
  const [userTasksData, setUserTasksData] = useState<any>(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  
  // Annotation data
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [taskDetail, setTaskDetail] = useState<TaskDetail | null>(null);
  const [annotationClasses, setAnnotationClasses] = useState<AnnotationClass[]>([]);
  const [annotationLoading, setAnnotationLoading] = useState(false);
  
  // History data
  const [historyData, setHistoryData] = useState<any>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch user tasks
  const fetchUserTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      const response = await UserTasksApiService.getUserTasks();
      setUserTasksData(response);
    } catch (error) {
      console.error('Error fetching user tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  // Fetch task detail
  const fetchTaskDetail = useCallback(async (taskId: number, index?: number) => {
    try {
      setAnnotationLoading(true);
      const [detailResponse, classesResponse] = await Promise.all([
        UserTasksApiService.getTaskDetail(taskId, index),
        UserTasksApiService.getAnnotationClasses()
      ]);
      setTaskDetail(detailResponse);
      setAnnotationClasses(classesResponse.classes);
    } catch (error) {
      console.error('Error fetching task detail:', error);
    } finally {
      setAnnotationLoading(false);
    }
  }, []);

  // Fetch user history
  const fetchUserHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const response = await UserTasksApiService.getUserHistory();
      setHistoryData(response);
    } catch (error) {
      console.error('Error fetching user history:', error);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUserTasks();
  }, [fetchUserTasks]);

  // Load history when tab is activated
  useEffect(() => {
    if (activeTab === 'history' && !historyData) {
      fetchUserHistory();
    }
  }, [activeTab, historyData, fetchUserHistory]);

  const handleStartAnnotation = (taskId: number) => {
    setSelectedTaskId(taskId);
    setActiveTab('annotate');
    fetchTaskDetail(taskId);
  };

  const handleSubmitAnnotation = async (classSelection: string, notes: string) => {
    if (!taskDetail) return;

    try {
      const response = await UserTasksApiService.submitAnnotation(
        taskDetail.task.id,
        taskDetail.currentCouple.id,
        classSelection,
        taskDetail.currentIndex
      );

      if (response.completed) {
        alert(response.completionMessage);
        // Refresh tasks data
        fetchUserTasks();
        // Go back to tasks tab
        setActiveTab('tasks');
      } else {
        // Load next couple
        fetchTaskDetail(taskDetail.task.id, response.nextIndex);
      }
    } catch (error) {
      console.error('Error submitting annotation:', error);
    }
  };

  const handleNavigate = (direction: 'prev' | 'next') => {
    if (!taskDetail) return;
    
    const newIndex = direction === 'prev' 
      ? Math.max(0, taskDetail.currentIndex - 1)
      : Math.min(taskDetail.totalCouples - 1, taskDetail.currentIndex + 1);
    
    fetchTaskDetail(taskDetail.task.id, newIndex);
  };

  const handleLogout = () => {
    // Simulate logout
    alert('Logged out successfully!');
  };

  return (
    <div className="min-h-screen bg-[#18212E]">
      <Header userName={userName} onLogout={handleLogout} />
      <NavigationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="p-8">
        {activeTab === 'tasks' && (
          <TasksTab 
            userTasksData={userTasksData}
            loading={tasksLoading}
            onStartAnnotation={handleStartAnnotation}
          />
        )}
        
        {activeTab === 'annotate' && (
          <AnnotationTab
            selectedTaskId={selectedTaskId}
            taskDetail={taskDetail}
            annotationClasses={annotationClasses}
            
loading={annotationLoading}
            onSubmitAnnotation={handleSubmitAnnotation}
            onNavigate={handleNavigate}
          />
        )}
        
        {activeTab === 'history' && (
          <HistoryTab 
            historyData={historyData}
            loading={historyLoading}
          />
        )}
      </div>
    </div>
  );
};

export default UserTasksApp;