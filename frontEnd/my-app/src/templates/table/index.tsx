import { useSidebar } from "@/context/sidebarContext"
import { HeaderTable, ColumnTable, UserTable } from "@/components"
import { FaPlus, FaSearch } from "react-icons/fa"

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

type TableProps = {
  columns: Array<string>
  totalData: number,
  changeStatusUser: (id: number) => void
  toggleUserStatus: (id: number) => void
  deleteUser: (id: number) => void
  addUser: () => void
  users: User[]
  search: string
  setSearch: (search: string) => void
}

const Table = ({
  columns, 
  users, 
  totalData,
  changeStatusUser, 
  toggleUserStatus,
  deleteUser,
  addUser,
  search,
  setSearch
}: TableProps) => {

  const { open } = useSidebar()

  return (
    <div className={`flex bg-[#18212E] ${open ? "w-[85vw]" : "w-[96vw]"} h-screen justify-center py-6 duration-300`}>
      <div className={`flex flex-col items-center p-7 text-2xl font-semibold ${open ? "w-[75vw]" : "w-[89vw]"} bg-[#121A24] rounded-lg duration-300 shadow-custom gap-y-5`}>
        
        {/* Header with search and add button */}
        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-[#F0F1F2]">User Management</h1>
            <span className="text-sm text-gray-400">({totalData} users)</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#18212E] border border-gray-600 rounded-lg text-[#F0F1F2] focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
            
            {/* Add User Button */}
            <button
              onClick={addUser}
              className="flex items-center gap-2 px-4 py-2 bg-[#216BFE] text-white rounded-lg hover:brightness-125 duration-300"
            >
              <FaPlus />
              Add User
            </button>
          </div>
        </div>

        <div className="w-full my-3 overflow-y-auto px-2" id="scrollbar">
          <table className="border-collapse border-spacing-x-6 w-full text-sm">
            <ColumnTable columns={columns} />
            <UserTable 
              users={users} 
              changeStatusUser={changeStatusUser} 
              toggleUserStatus={toggleUserStatus}
              deleteUser={deleteUser} 
            />
          </table>
        </div>
      </div>
    </div>
  )
}

export default Table