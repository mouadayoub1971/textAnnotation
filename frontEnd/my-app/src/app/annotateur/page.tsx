"use client"
import React, { useState, useEffect } from 'react';
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/authContext"
import { 
  User, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Clock, 
  BookOpen,
  LogOut,
  Home,
  History,
  Check
} from 'lucide-react';

const AnnotationTasksPage = () => {
  const router = useRouter();
  const { token, username } = useAuth();
  console.log(token)
  
  // State management
  const [tasks, setTasks] = useState([]);
  const [taskProgressMap, setTaskProgressMap] = useState({});
  const [selectedTask, setSelectedTask] = useState(null);
  const [currentCouple, setCurrentCouple] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalCouples, setTotalCouples] = useState(0);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [annotationClasses, setAnnotationClasses] = useState([]);
  const [annotations, setAnnotations] = useState([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  // API base URL - adjust as needed
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  // Common headers for API requests
  const getHeaders = () => ({
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  });

  // Fetch user tasks
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/user/tasks`, {
        headers: getHeaders()
      });
      
      if (response.status === 401) {
        router.push('/home/logout');
        return;
      }
      
      const data = await response.json();
      setTasks(data.tasks || []);
      setTaskProgressMap(data.taskProgressMap || {});
    } catch (err) {
      setError('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  // Fetch task details - Fixed to properly handle index parameter
  const fetchTaskDetail = async (taskId, index = null) => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      // Build URL with proper index handling
      let url = `${API_BASE}/api/user/tasks/${taskId}`;
      
      // Always include index parameter - use 0 as default if not provided
      // This matches your backend expectation
      if (index !== null && index !== undefined) {
        url += `?index=${index}`;
      } else {
        // When opening a task for the first time, let backend determine the index
        // based on saved progress, but we can also explicitly pass 0
        // Based on your curl example, you're passing index=13, so the parameter is expected
        const savedProgress = taskProgressMap[taskId] || 0;
        url += `?index=${savedProgress}`;
      }
        
      console.log('Fetching task detail from:', url); // Debug log
        
      const response = await fetch(url, {
        headers: getHeaders()
      });
      
      if (response.status === 401) {
        router.push('/home/logout');
        return;
      }
      
      if (response.status === 403) {
        setError('Not authorized to view this task');
        return;
      }
      
      if (!response.ok) {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          setError(errorData.message || errorData.error || `Failed to fetch task details (${response.status})`);
        } catch {
          setError(`Failed to fetch task details (${response.status})`);
        }
        return;
      }
      
      const data = await response.json();
      setSelectedTask(data.task);
      setCurrentCouple(data.currentCouple);
      setCurrentIndex(data.currentIndex);
      setTotalCouples(data.totalCouples);
      setSelectedClassId(data.selectedClassId || '');
      
      // Fetch annotation classes for this task
      await fetchAnnotationClasses(taskId);
    } catch (err) {
      console.error('Error fetching task details:', err);
      setError('Failed to fetch task details');
    } finally {
      setLoading(false);
    }
  };

  // Fetch annotation classes
  const fetchAnnotationClasses = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/api/user/tasks/${taskId}/classes`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnnotationClasses(data.classes || []);
      }
    } catch (err) {
      console.error('Failed to fetch annotation classes:', err);
    }
  };

  // Submit annotation
  const submitAnnotation = async () => {
    if (!selectedClassId || !currentCouple) {
      setError('Please select a classification');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/user/tasks/${selectedTask.id}/annotate`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          coupleId: currentCouple.id,
          classSelection: selectedClassId,
          notes: notes,
          currentIndex: currentIndex
        })
      });
      
      if (response.status === 401) {
        router.push('/home/logout');
        return;
      }
      
      const data = await response.json();
      setSuccess(data.message);
      
      // Refresh history if we're on the history tab to show updated data
      if (activeTab === 'history') {
        fetchHistory();
      }
      
      if (data.completed) {
        setSuccess(data.completionMessage);
        setTimeout(() => {
          setSelectedTask(null);
          fetchTasks(); // Refresh tasks list
          // Also refresh history to show the newly completed annotations
          fetchHistory();
        }, 2000);
      } else {
        // Move to next couple using the returned nextIndex
        await fetchTaskDetail(selectedTask.id, data.nextIndex);
        setNotes('');
        setSelectedClassId(''); // Clear selection for next annotation
      }
    } catch (err) {
      setError('Failed to submit annotation');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user history - Fixed to handle the API response properly
  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/api/user/history`, {
        headers: getHeaders()
      });
      
      if (response.status === 401) {
        router.push('/home/logout');
        return;
      }
      
      const data = await response.json();
      console.log('Raw API response:', data); // Debug log
      
      let processedAnnotations = [];
      
      if (data.annotations && Array.isArray(data.annotations)) {
        // The API returns a mixed array where:
        // - First element might be a full annotation object
        // - Rest are annotation IDs (numbers)
        // We need to extract all full annotation objects
        
        data.annotations.forEach(item => {
          if (typeof item === 'object' && item !== null) {
            // This is a full annotation object
            if (item.id && item.coupleText && item.chosenClass) {
              processedAnnotations.push({
                id: item.id,
                coupleText: item.coupleText,
                chosenClass: item.chosenClass,
                notes: item.notes || ''
              });
            }
            
            // Check if this object has nested annotations (like in annotateur.annotations)
            if (item.annotateur && item.annotateur.annotations) {
              item.annotateur.annotations.forEach(nestedItem => {
                if (typeof nestedItem === 'object' && nestedItem !== null && 
                    nestedItem.id && nestedItem.coupleText && nestedItem.chosenClass) {
                  processedAnnotations.push({
                    id: nestedItem.id,
                    coupleText: nestedItem.coupleText,
                    chosenClass: nestedItem.chosenClass,
                    notes: nestedItem.notes || ''
                  });
                }
              });
            }
          }
        });
        
        // Remove duplicates based on ID
        const uniqueAnnotations = processedAnnotations.filter((annotation, index, self) => 
          index === self.findIndex(a => a.id === annotation.id)
        );
        
        // Sort by ID in descending order (most recent first)
        uniqueAnnotations.sort((a, b) => b.id - a.id);
        
        console.log('Processed annotations:', uniqueAnnotations); // Debug log
        setAnnotations(uniqueAnnotations);
      } else {
        setAnnotations([]);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setError('Failed to fetch history');
    } finally {
      setLoading(false);
    }
  };

  // Navigate between couples - Fixed to properly pass index
  const navigateCouple = (direction) => {
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < totalCouples) {
      fetchTaskDetail(selectedTask.id, newIndex);
    }
  };

  // Helper function to determine if task is completed
  const isTaskCompleted = (task, progress) => {
    // A task is completed if the progress (number of annotations) equals the total couples
    // We need to get the total couples count from the task detail
    // For now, we'll use a heuristic: if progress >= 3 and no more couples to annotate
    return progress >= (task.totalCouples || 3); // Assuming totalCouples is available
  };

  // Helper function to get task status
  const getTaskStatus = (task, progress) => {
    if (isTaskCompleted(task, progress)) {
      return { text: 'Completed', color: 'bg-green-100 text-green-800', icon: Check };
    }
    return { text: 'In Progress', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
  };

  // Check if task can be continued (has more couples to annotate)
  const canContinueTask = async (taskId) => {
    try {
      const response = await fetch(`${API_BASE}/api/user/tasks/${taskId}?index=0`, {
        headers: getHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const progress = taskProgressMap[taskId] || 0;
        return progress < data.totalCouples;
      }
    } catch (err) {
      console.error('Error checking task continuation:', err);
    }
    return true; // Default to true to allow attempting
  };

  // Load initial data
  useEffect(() => {
    if (token) {
      fetchTasks();
    }
  }, [token]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-8 w-96">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Please log in to access your tasks.</p>
            <button 
              onClick={() => router.push('/login')} 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Annotation Tasks
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">
                  {username}
                </span>
              </div>
              <button
                onClick={() => router.push('/home/logout')}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800">{success}</p>
          </div>
        )}

        {/* Task Detail View */}
        {selectedTask ? (
          <div className="space-y-6">
            {/* Task Header */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setSelectedTask(null)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Back to Tasks</span>
              </button>
              <div className="text-sm text-gray-600">
                {currentIndex + 1} of {totalCouples} couples
              </div>
            </div>

            {/* Check if task is completed */}
            {currentIndex >= totalCouples ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-800 mb-2">Task Completed!</h3>
                <p className="text-green-700">You have successfully completed all annotations for this task.</p>
                <button
                  onClick={() => {
                    setSelectedTask(null);
                    fetchTasks();
                  }}
                  className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Back to Tasks
                </button>
              </div>
            ) : (
              <>
                {/* Task Info */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-black" >Task #{selectedTask.id}</h2>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {Math.round(((currentIndex + 1) / totalCouples) * 100)}% Complete
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${((currentIndex + 1) / totalCouples) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Due: {selectedTask.dateLimite ? new Date(selectedTask.dateLimite).toLocaleDateString() : 'No deadline'}
                  </div>
                </div>

                {/* Current Couple */}
                {currentCouple && (
                  <div className="bg-white rounded-lg shadow p-6 space-y-6">
                    <h3 className="text-lg font-semibold text-black">Text Pair to Annotate</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text 1
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md border">
                          <p className="text-sm text-black">{currentCouple.text_1}</p>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Text 2
                        </label>
                        <div className="p-3 bg-gray-50 rounded-md border">
                          <p className="text-sm text-black">{currentCouple.text_2}</p>
                        </div>
                      </div>
                    </div>

                    {/* Classification Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Select Classification
                      </label>
                      <div className="space-y-3">
                        {annotationClasses.map((cls) => (
                          <div key={cls.id} className="flex items-start space-x-3">
                            <input
                              type="radio"
                              id={`class-${cls.id}`}
                              name="classification"
                              value={cls.id.toString()}
                              checked={selectedClassId === cls.id.toString()}
                              onChange={(e) => setSelectedClassId(e.target.value)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-1"
                            />
                            <label htmlFor={`class-${cls.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium text-gray-900">{cls.textClass}</div>
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                        Notes (Optional)
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Add any additional notes about this annotation..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                        rows={3}
                      />
                    </div>

                    {/* Navigation and Submit */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <button
                        onClick={() => navigateCouple('prev')}
                        disabled={currentIndex === 0}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span>Previous</span>
                      </button>

                      <button
                        onClick={submitAnnotation}
                        disabled={!selectedClassId || loading}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        <span>{currentIndex === totalCouples - 1 ? 'Complete Task' : 'Submit & Next'}</span>
                      </button>

                      <button
                        onClick={() => navigateCouple('next')}
                        disabled={currentIndex >= totalCouples - 1}
                        className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span>Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Tasks List and History */
          <div>
            {/* Tab Navigation */}
            <div className="flex space-x-1 mb-8">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                  activeTab === 'tasks' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>My Tasks</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium ${
                  activeTab === 'history' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <History className="h-4 w-4" />
                <span>History</span>
              </button>
            </div>

            {/* Tasks Tab */}
            {activeTab === 'tasks' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Your Tasks</h2>
                  <button 
                    onClick={fetchTasks} 
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading tasks...</p>
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No tasks assigned yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map((task) => {
                      const currentProgress = taskProgressMap[task.id] || 0;
                      const status = getTaskStatus(task, currentProgress);
                      const StatusIcon = status.icon;
                      
                      return (
                        <div key={task.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-semibold text-black">Task #{task.id}</h3>
                              <span className={`flex items-center px-2 py-1 text-xs rounded-full ${status.color}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.text}
                              </span>
                            </div>
                            
                            <div className="text-sm text-gray-600 mb-4">
                              <p><strong>Annotator:</strong> {task.annotateur?.nom} {task.annotateur?.prenom}</p>
                              <p><strong>Deadline:</strong> {task.dateLimite ? new Date(task.dateLimite).toLocaleDateString() : 'No deadline'}</p>
                              <p><strong>Progress:</strong> {currentProgress} annotations completed</p>
                            </div>

                            <button 
                              onClick={() => fetchTaskDetail(task.id)}
                              className={`w-full px-4 py-2 rounded-md text-white ${
                                status.text === 'Completed' 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-blue-600 hover:bg-blue-700'
                              }`}
                            >
                              {status.text === 'Completed' ? 'View Task' : 'Continue Task'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Annotation History</h2>
                  <button 
                    onClick={fetchHistory} 
                    disabled={loading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading history...</p>
                  </div>
                ) : annotations.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No annotations completed yet.</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow">
                    <div className="p-6">
                      <div className="mb-4">
                        <p className="text-sm text-gray-600">
                          Total annotations: <span className="font-semibold">{annotations.length}</span>
                        </p>
                      </div>
                      <div className="space-y-6">
                        {annotations.map((annotation, index) => (
                          <div key={annotation.id || index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                                  Annotation #{annotation.id}
                                </span>
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Class: {annotation.chosenClass}
                                </span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Text 1:</p>
                                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">
                                  {annotation.coupleText?.text_1 || 'N/A'}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">Text 2:</p>
                                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded border">
                                  {annotation.coupleText?.text_2 || 'N/A'}
                                </p>
                              </div>
                            </div>
                            
                            {annotation.notes && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-500 mb-1">Notes:</p>
                                <p className="text-sm text-gray-700 italic bg-yellow-50 p-2 rounded border">
                                  {annotation.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AnnotationTasksPage;