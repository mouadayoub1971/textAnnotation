import { GiPadlockOpen } from "react-icons/gi"
import { MdDeleteForever } from "react-icons/md"
import { FaToggleOn, FaToggleOff } from "react-icons/fa"

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

interface Tache {
  id: number;
  dateLimite: string;
}

interface Annotation {
  id: number;
  annotateur: number;
  coupleText: any;
  chosenClass: string;
}

interface Role {
  id: number;
  role: string;
}

type UserTableProps = {
  users: User[]
  changeStatusUser: (id: number) => void
  toggleUserStatus: (id: number) => void
  deleteUser: (id: number) => void
}

const UserTable = ({ users, changeStatusUser, toggleUserStatus, deleteUser }: UserTableProps) => {
  return (
    <tbody>
      {users && users.map((user, index) => (
        <tr className={`${index % 2 === 0 ? "bg-[#18212E]" : "bg-none"}  text-center text-[#F0F1F2]`} key={user.id}>
          <td className="py-4">{user.id}</td>
          <td className="py-4">{user.prenom}</td>
          <td className="py-4">{user.nom}</td>
          <td className="py-4">{user.login}</td>
          <td className="py-4">
            <div className="flex justify-center items-center">
              <div className="border-2 py-2 rounded-full flex ps-4 items-center gap-2 w-[120px] border-gray-600">
                <div className={`${
                  user.role?.role === "ADMIN_ROLE" ? "bg-[#E5C680]" : 
                  user.role?.role === "USER_ROLE" ? "bg-[#C4BEbE]" : 
                  "bg-[#B3A389]"
                } rounded-full w-3 h-3`} />
                <div className="text-sm">
                  {user.role?.role === "ADMIN_ROLE" ? "Admin" : 
                   user.role?.role === "USER_ROLE" ? "User" : 
                   user.role?.role === "ANNOTATOR_ROLE" ? "Annotator" : "N/A"}
                </div>
              </div>
            </div>
          </td>
          <td className="py-4">
            <div className="flex justify-center items-center">
              <span className={`px-3 py-1 rounded-full text-sm ${
                user.deleted ? "bg-red-600 text-white" : "bg-green-600 text-white"
              }`}>
                {user.deleted ? "Inactive" : "Active"}
              </span>
            </div>
          </td>
          <td className="py-4">
            <div className="text-center">
              {user.taches ? user.taches.length : 0}
            </div>
          </td>
          <td className="py-4">
            <div className="text-center">
              {user.annotations ? user.annotations.length : 0}
            </div>
          </td>
          <td className="py-4">
            <div className="flex justify-center items-center gap-2">
              {/* Change Role Button */}
              <div 
                className="w-12 h-9 bg-[#216BFE] text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300"
                onClick={() => changeStatusUser(user.id)}
                title="Change Role"
              >
                <GiPadlockOpen />
              </div>
              
              {/* Toggle Status Button */}
              <div 
                className={`w-12 h-9 ${user.deleted ? "bg-[#22C55E]" : "bg-[#FEB421]"} text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300`}
                onClick={() => toggleUserStatus(user.id)}
                title={user.deleted ? "Activate User" : "Deactivate User"}
              >
                {user.deleted ? <FaToggleOff /> : <FaToggleOn />}
              </div>
              
              {/* Delete Button */}
              <div 
                className="w-12 h-9 bg-[#FF5771] text-white flex justify-center items-center rounded-md hover:brightness-125 cursor-pointer duration-300"
                onClick={() => deleteUser(user.id)}
                title="Delete User"
              >
                <MdDeleteForever />
              </div>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}

export default UserTable