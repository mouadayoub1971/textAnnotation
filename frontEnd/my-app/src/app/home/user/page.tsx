"use client"

// Import Packages
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Import Libraries
import axios from 'axios';
import Swal from 'sweetalert2';

// Import Components
import { MobileSize } from '@/components';

// Import Templates
import { Sidebar, Table } from '@/templates';

// Import Functions
import useHandleResize from '@/utils/handleResize';

// Import Context
import { useAuth } from '@/context/authContext';

// Interfaces
interface User {
  id: number;
  prenom: string;
  nom: string;
  login: string;
  password?: string;
  deleted?: boolean;
  role?: Role;
  taches?: Tache[];
  annotations?: Annotation[];
}

export interface Tache {
  id: number;
  dateLimite: string;
}

export interface Annotation {
  id: number;
  annotateur: number;
  coupleText: any;
  chosenClass: string;
}

export interface Role {
  id: number;
  role: string;
}

const UserSection = () => {
  // Router
  const router = useRouter();

  // Context
  const { token } = useAuth();

  // Util
  const isDesktop = useHandleResize();

  // State
  const [users, setUsers] = useState<User[]>([]);
  const [totalUser, setTotalUser] = useState<number>(0);
  const [search, setSearch] = useState<string>("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

  // Columns for the table
  const columns = ["ID", "Prénom", "Nom", "Login", "Rôle", "Status", "Tâches", "Annotations", "Actions"];

  // Axios
  const getUsers = useCallback(async () => {
    try {
      const response = await axios.get(`http://localhost:8080/api/admin/annotateurs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      console.log('Users response:', response);
      
      if (response.data && Array.isArray(response.data)) {
        setUsers(response.data);
        setTotalUser(response.data.length);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Swal.fire({
        title: "Error!",
        text: "Failed to fetch users data",
        icon: "error",
        background: "#18212E",
      });
    }
  }, [token]);

  const toggleUserStatus = async (id: number) => {
    const user = users.find(user => user.id === id);
    if (!user) {
      Swal.fire({
        title: "User Not Found!",
        text: "The selected user could not be found",
        icon: "error",
        background: "#18212E",
      });
      return;
    }

    const newStatus = !user.deleted;
    const actionText = newStatus ? 'deactivate' : 'activate';

    Swal.fire({
      title: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} User`,
      text: `Are you sure you want to ${actionText} ${user.prenom} ${user.nom}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: `Yes, ${actionText}`,
      background: "#18212E",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.post(`http://localhost:8080/api/admin/annotateurs`,
            {
              id: user.id,
              nom: user.nom,
              prenom: user.prenom,
              login: user.login,
              password: user.password,
              role: user.role,
              deleted: newStatus,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.status === 200) {
            getUsers();
            Swal.fire({
              title: "Updated!",
              text: `${user.prenom} ${user.nom} has been ${actionText}d successfully.`,
              icon: "success",
              background: "#18212E",
            });
          }
        } catch (error) {
          console.log("Error updating user status:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to update user status",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  const changeStatusUser = async (id: number) => {
    const user = users.find(user => user.id === id);
    if (!user) {
      Swal.fire({
        title: "User Not Found!",
        text: "The selected user could not be found",
        icon: "error",
        background: "#18212E",
      });
      return;
    }

    Swal.fire({
      title: "Update User Role",
      html: `
          <div class="flex flex-col gap-4 mt-4 w-full">
            <div class="select-wrapper">
              <select id="roleSelect" class="swal2-input border border-gray-400 rounded-lg text-gray-400 bg-[#18212E] w-full cursor-pointer">
                <option value="" disabled ${!user.role?.id ? 'selected' : ''}>Select user role</option>
                <option value="1" ${user.role?.id === 1 ? 'selected' : ''}>Admin Role</option>
                <option value="2" ${user.role?.id === 2 ? 'selected' : ''}>User Role</option>
                <option value="3" ${user.role?.id === 3 ? 'selected' : ''}>Annotator Role</option>
              </select>
            </div>
          </div>
        `,
      background: "#18212E",
      showCancelButton: true,
      confirmButtonText: "Update",
      cancelButtonColor: "#D33",
      confirmButtonColor: "#3085D6"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const element = document.getElementById("roleSelect") as HTMLSelectElement;

        try {
          const response = await axios.put(`http://localhost:8080/api/admin/user/${id}/role`,
            {
              role_id: Number(element?.value),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.status === 200) {
            getUsers();
            Swal.fire({
              title: "Updated!",
              text: "The user role has been updated successfully.",
              icon: "success",
              background: "#18212E",
            });
          } else {
            Swal.fire({
              title: "No Change!",
              text: "No changes were made to the user role.",
              icon: "error",
              background: "#18212E",
            });
          }
        } catch (error) {
          console.log("Error updating role:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to update user role",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  const deleteUser = (id: number) => {
    const user = users.find(user => user.id === id);
    if (!user) return;

    Swal.fire({
      title: "Delete User",
      text: `Are you sure you want to delete ${user.prenom} ${user.nom}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete user",
      width: "600px",
      background: "#18212E",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`http://localhost:8080/api/admin/user/${id}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.status === 200) {
            getUsers();
            Swal.fire({
              title: "Deleted!",
              text: "The user has been successfully deleted.",
              icon: "success",
              background: "#18212E",
            });
          } else {
            Swal.fire({
              title: "Failed",
              text: "The user was not deleted. Please try again!",
              icon: "error",
              background: "#18212E",
            });
          }
        } catch (error) {
          console.log("Error deleting user:", error);
          Swal.fire({
            title: "Error!",
            text: "An internal error occurred during your request",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  const addUser = () => {
    Swal.fire({
      title: "Add New User",
      html: `
        <div class="flex flex-col gap-4 mt-4 w-full">
          <input id="prenom" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Prénom" />
          <input id="nom" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Nom" />
          <input id="login" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Login" />
          <input id="password" type="password" class="swal2-input border border-gray-400 rounded-lg text-white bg-[#18212E] w-full" placeholder="Password" />
        </div>
      `,
      background: "#18212E",
      showCancelButton: true,
      confirmButtonText: "Add User",
      cancelButtonColor: "#D33",
      confirmButtonColor: "#3085D6",
      width: "600px"
    }).then(async (result) => {
      if (result.isConfirmed) {
        const prenom = (document.getElementById("prenom") as HTMLInputElement)?.value;
        const nom = (document.getElementById("nom") as HTMLInputElement)?.value;
        const login = (document.getElementById("login") as HTMLInputElement)?.value;
        const password = (document.getElementById("password") as HTMLInputElement)?.value;

        if (!prenom || !nom || !login || !password) {
          Swal.fire({
            title: "Missing Fields!",
            text: "Please fill in all required fields.",
            icon: "error",
            background: "#18212E",
          });
          return;
        }

        try {
          const response = await axios.post(`http://localhost:8080/api/admin/annotateurs`,
            {
              prenom,
              nom,
              login,
              password,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );

          if (response.status === 200) {
            getUsers();
            Swal.fire({
              title: "Added!",
              text: "The user has been added successfully.",
              icon: "success",
              background: "#18212E",
            });
          }
        } catch (error) {
          console.log("Error adding user:", error);
          Swal.fire({
            title: "Error!",
            text: "Failed to add user",
            icon: "error",
            background: "#18212E",
          });
        }
      }
    });
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      router.push("/");
    }
    console.log("Before getting all annotateurs");
    console.log("Token:", token);
    getUsers();
  }, [router, getUsers, token]);

  useEffect(() => {
    if (search === "") {
      setFilteredUsers(users);
    } else {
      const searching = users.filter(user => 
        user.prenom.toLowerCase().includes(search.toLowerCase()) ||
        user.nom.toLowerCase().includes(search.toLowerCase()) ||
        user.login.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredUsers(searching);
    }
  }, [search, users]);

  return (
    <>
      {isDesktop ? (
        <div className="flex fixed">
          <Sidebar page="/home/user" />
          <Table
            columns={columns}
            users={filteredUsers}
            totalData={totalUser}
            changeStatusUser={changeStatusUser}
            toggleUserStatus={toggleUserStatus}
            deleteUser={deleteUser}
            addUser={addUser}
            search={search}
            setSearch={setSearch}
          />
        </div>
      ) : (
        <MobileSize />
      )}
    </>
  );
};

export default UserSection;