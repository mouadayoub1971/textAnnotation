"use client"

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Swal from 'sweetalert2';
import { FaPlus, FaSearch, FaEye, FaUsers, FaTrash, FaUpload, FaCalendarAlt } from 'react-icons/fa';

// Import Components (add these imports)
import { MobileSize } from '@/components';

// Import Templates (add these imports)
import { Sidebar } from '@/templates';

// Import Functions (add this import)
import useHandleResize from '@/utils/handleResize';

// Import Context
import { useAuth } from '@/context/authContext';

// Interfaces
interface Dataset {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  totalCoupleTexts: number;
  tasks?: Task[];
  classes?: string[];
}

interface Task {
  id: number;
  dateLimite: string;
  annotateur?: Annotateur;
}

interface Annotateur {
  id: number;
  prenom: string;
  nom: string;
  login: string;
  deleted: boolean;
}

interface CoupleText {
  id: number;
  text_1: string;
  text_2: string;
  originalId: string;
}

const DatasetManagement = () => {
  const router = useRouter();
  const { token } = useAuth();
  
  // Add this line for responsive design
  const isDesktop = useHandleResize();

  // State
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [totalDatasets, setTotalDatasets] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [filteredDatasets, setFilteredDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [userName, setUserName] = useState<string>("");

  // API Base URL
  const API_BASE = 'http://localhost:8080/api/admin';

  // Fetch all datasets
  const getDatasets = useCallback(async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/datasets`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data) {
        const { datasets, total, userName } = response.data;
        setDatasets(datasets || []);
        setTotalDatasets(total || 0);
        setUserName(userName || "");
      }
    } catch (error) {
      console.error('Error fetching datasets:', error);
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch datasets",
        icon: "error",
        background: "#18212E",
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Create new dataset
  const createDataset = () => {
    Swal.fire({
      title: "Create New Dataset",
      html: `
        <div class="flex flex-col gap-4 mt-4 w-full">
          <input id="datasetName" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Dataset Name" />
          <textarea id="datasetDescription" class="swal2-textarea border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Dataset Description" rows="3"></textarea>
          <input id="datasetFile" type="file" accept=".xlsx,.xls" class="swal2-file border border-gray-400 rounded-lg text-white bg-[#18212E] w-full p-2" />
          <input id="datasetClasses" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Classes (separated by semicolons, e.g., positive;negative;neutral)" />
        </div>
      `,
      background: "#18212E",
      showCancelButton: true,
      confirmButtonText: "Create Dataset",
      cancelButtonColor: "#D33",
      confirmButtonColor: "#3085D6",
      width: "700px"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const name = (document.getElementById("datasetName") as HTMLInputElement)?.value;
        const description = (document.getElementById("datasetDescription") as HTMLTextAreaElement)?.value;
        const fileInput = document.getElementById("datasetFile") as HTMLInputElement;
        const classes = (document.getElementById("datasetClasses") as HTMLInputElement)?.value;
        const file = fileInput?.files?.[0];

        if (!name || !description || !file || !classes) {
          Swal.fire({
            title: "Missing Fields!",
            text: "Please fill in all required fields and select a file.",
            icon: "error",
            background: "#18212E",
          });
          return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('file', file);
        formData.append('classesRaw', classes);

        try {
          const response = await axios.post(`${API_BASE}/datasets`, formData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          });

          if (response.status === 200) {
            getDatasets();
            Swal.fire({
              title: "Success!",
              text: "Dataset created successfully.",
              icon: "success",
              background: "#18212E",
            });
          }
        } catch (error) {
          console.error("Error creating dataset:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to create dataset",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  // View dataset details
  const viewDatasetDetails = async (datasetId: number) => {
    try {
      const response = await axios.get(`${API_BASE}/datasets/details/${datasetId}`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page: 0, size: 10 }
      });

      const { dataset, coupleTexts, pagination } = response.data;

      const coupleTextsHtml = coupleTexts.map((couple: CoupleText, index: number) => `
        <div class="border-b border-gray-600 pb-2 mb-2">
          <div class="text-sm text-gray-400">Couple ${index + 1} (ID: ${couple.originalId})</div>
          <div class="text-white mt-1"><strong>Text 1:</strong> ${couple.text_1.substring(0, 100)}${couple.text_1.length > 100 ? '...' : ''}</div>
          <div class="text-white mt-1"><strong>Text 2:</strong> ${couple.text_2.substring(0, 100)}${couple.text_2.length > 100 ? '...' : ''}</div>
        </div>
      `).join('');

      Swal.fire({
        title: `Dataset: ${dataset.name}`,
        html: `
          <div class="text-left">
            <div class="mb-4">
              <strong class="text-blue-400">Description:</strong>
              <p class="text-gray-300 mt-1">${dataset.description}</p>
            </div>
            <div class="mb-4">
              <strong class="text-blue-400">Classes:</strong>
              <p class="text-gray-300 mt-1">${dataset.classes ? dataset.classes.join(', ') : 'N/A'}</p>
            </div>
            <div class="mb-4">
              <strong class="text-blue-400">Sample Couple Texts (Page ${pagination.currentPage + 1} of ${pagination.totalPages}):</strong>
              <div class="mt-2 max-h-60 overflow-y-auto border border-gray-600 rounded p-2">
                ${coupleTextsHtml}
              </div>
            </div>
          </div>
        `,
        background: "#18212E",
        confirmButtonColor: "#3085D6",
        width: "800px"
      });
    } catch (error) {
      console.error("Error fetching dataset details:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch dataset details",
        icon: "error",
        background: "#18212E",
      });
    }
  };

  // Assign annotators to dataset
  const assignAnnotators = async (datasetId: number) => {
    try {
      // First, get assignment data
      const response = await axios.get(`${API_BASE}/datasets/${datasetId}/assign_annotator`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { dataset, annotateurs, assignedAnnotateurIds, deadlineDate } = response.data;

      const annotateurOptions = annotateurs
        .filter((annotateur: Annotateur) => !annotateur.deleted)
        .map((annotateur: Annotateur) => `
          <div class="flex items-center mb-2">
            <input type="checkbox" id="annotateur_${annotateur.id}" value="${annotateur.id}" 
                   ${assignedAnnotateurIds.includes(annotateur.id) ? 'checked' : ''} 
                   class="mr-2">
            <label for="annotateur_${annotateur.id}" class="text-white">
              ${annotateur.prenom} ${annotateur.nom} (${annotateur.login})
            </label>
          </div>
        `).join('');

      const currentDeadline = deadlineDate ? new Date(deadlineDate).toISOString().slice(0, 16) : '';

      Swal.fire({
        title: `Assign Annotators to: ${dataset.name}`,
        html: `
          <div class="text-left">
            <div class="mb-4">
              <label class="block text-blue-400 mb-2">Select Annotators (minimum 3):</label>
              <div class="max-h-40 overflow-y-auto border border-gray-600 rounded p-2">
                ${annotateurOptions}
              </div>
            </div>
            <div class="mb-4">
              <label class="block text-blue-400 mb-2">Deadline:</label>
              <input type="datetime-local" id="deadlineInput" value="${currentDeadline}" 
                     class="w-full p-2 border border-gray-400 rounded-lg bg-[#18212E] text-white">
            </div>
          </div>
        `,
        background: "#18212E",
        showCancelButton: true,
        confirmButtonText: "Assign Tasks",
        cancelButtonColor: "#D33",
        confirmButtonColor: "#3085D6",
        width: "600px"
      }).then(async (result) => {
        if (result.isConfirmed) {
          const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
          const selectedIds = Array.from(checkboxes).map(cb => parseInt((cb as HTMLInputElement).value));
          const deadlineInput = document.getElementById("deadlineInput") as HTMLInputElement;
          const deadline = new Date(deadlineInput.value).getTime();

          if (selectedIds.length < 3) {
            Swal.fire({
              title: "Insufficient Annotators!",
              text: "Please select at least 3 annotators.",
              icon: "error",
              background: "#18212E",
            });
            return;
          }

          if (!deadline) {
            Swal.fire({
              title: "Missing Deadline!",
              text: "Please set a deadline.",
              icon: "error",
              background: "#18212E",
            });
            return;
          }

          try {
            await axios.post(`${API_BASE}/tasks/datasets/${datasetId}/assign`, {
              annotatorIds: selectedIds,
              deadline: deadline
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            getDatasets();
            Swal.fire({
              title: "Success!",
              text: "Tasks assigned successfully.",
              icon: "success",
              background: "#18212E",
            });
          } catch (error) {
            console.error("Error assigning tasks:", error);
            Swal.fire({
              title: "Error!",
              text: "Failed to assign tasks",
              icon: "error",
              background: "#18212E",
            });
          }
        }
      });
    } catch (error) {
      console.error("Error fetching assignment data:", error);
      Swal.fire({
        title: "Error!",
        text: "Failed to load assignment data",
        icon: "error",
        background: "#18212E",
      });
    }
  };

  // Delete dataset
  const deleteDataset = (datasetId: number) => {
    const dataset = datasets.find(d => d.id === datasetId);
    if (!dataset) return;

    Swal.fire({
      title: "Delete Dataset",
      text: `Are you sure you want to delete "${dataset.name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      background: "#18212E",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_BASE}/datasets/${datasetId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          getDatasets();
          Swal.fire({
            title: "Deleted!",
            text: "Dataset has been deleted successfully.",
            icon: "success",
            background: "#18212E",
          });
        } catch (error) {
          console.error("Error deleting dataset:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to delete dataset",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  // Effects
  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }
    getDatasets();
  }, [token, getDatasets, router]);

  useEffect(() => {
    if (search === "") {
      setFilteredDatasets(datasets);
    } else {
      const filtered = datasets.filter(dataset => 
        dataset.name.toLowerCase().includes(search.toLowerCase()) ||
        dataset.description.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredDatasets(filtered);
    }
  }, [search, datasets]);

  // Dataset Management Content Component
  const DatasetContent = () => (
    <div className="flex bg-[#18212E] w-full h-screen justify-center py-6">
      <div className="flex flex-col items-center p-7 text-2xl font-semibold w-full max-w-7xl bg-[#121A24] rounded-lg shadow-custom gap-y-5">
        
        {/* Header */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#F0F1F2]">Dataset Management</h1>
            <span className="text-sm text-gray-400">({totalDatasets} datasets)</span>
            {userName && <span className="text-sm text-blue-400">Welcome, {userName}</span>}
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search datasets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#18212E] border border-gray-600 rounded-lg text-[#F0F1F2] focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Create Dataset Button */}
            <button
              onClick={createDataset}
              className="flex items-center gap-2 px-4 py-2 bg-[#216BFE] text-white rounded-lg hover:brightness-125 duration-300"
            >
              <FaPlus />
              <FaUpload />
              Create Dataset
            </button>
          </div>
        </div>

        {/* Datasets Table */}
        <div className="w-full my-3 overflow-y-auto px-2" style={{maxHeight: '70vh'}}>
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-[#F0F1F2]">Loading datasets...</div>
            </div>
          ) : (
            <table className="border-collapse border-spacing-x-6 w-full text-sm">
              <thead>
                <tr className="bg-[#18212E] text-[#F0F1F2]">
                  <th className="py-4 px-4 text-left">ID</th>
                  <th className="py-4 px-4 text-left">Name</th>
                  <th className="py-4 px-4 text-left">Description</th>
                  <th className="py-4 px-4 text-center">Total Texts</th>
                  <th className="py-4 px-4 text-center">Assigned Tasks</th>
                  <th className="py-4 px-4 text-center">Created</th>
                  <th className="py-4 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDatasets.map((dataset, index) => (
                  <tr 
                    key={dataset.id} 
                    className={`${index % 2 === 0 ? "bg-[#18212E]" : "bg-none"} text-[#F0F1F2] hover:bg-[#1a2332] transition-colors`}
                  >
                    <td className="py-4 px-4">{dataset.id}</td>
                    <td className="py-4 px-4 font-medium">{dataset.name}</td>
                    <td className="py-4 px-4 max-w-xs truncate" title={dataset.description}>
                      {dataset.description}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs">
                        {dataset.totalCoupleTexts || 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs">
                        {dataset.tasks ? dataset.tasks.length : 0}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center text-sm text-gray-400">
                      {dataset.createdAt ? new Date(dataset.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex justify-center items-center gap-2">
                        {/* View Details */}
                        <button
                          onClick={() => viewDatasetDetails(dataset.id)}
                          className="w-10 h-8 bg-[#216BFE] text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300"
                          title="View Details"
                        >
                          <FaEye />
                        </button>
                        
                        {/* Assign Annotators */}
                        <button
                          onClick={() => assignAnnotators(dataset.id)}
                          className="w-10 h-8 bg-[#22C55E] text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300"
                          title="Assign Annotators"
                        >
                          <FaUsers />
                        </button>
                        
                        {/* Delete Dataset */}
                        <button
                          onClick={() => deleteDataset(dataset.id)}
                          className="w-10 h-8 bg-[#FF5771] text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300"
                          title="Delete Dataset"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && filteredDatasets.length === 0 && (
            <div className="flex justify-center items-center py-20">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-4">📊</div>
                <div className="text-lg">No datasets found</div>
                <div className="text-sm">Create your first dataset to get started</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Main Return - following the same pattern as UserSection
  return (
    <>
      {isDesktop ? (
        <div className="flex flex-1">
          <Sidebar page="/home/datasets" />
          <DatasetContent />
        </div>
      ) : (
        <MobileSize />
      )}
    </>
  );
};

export default DatasetManagement;