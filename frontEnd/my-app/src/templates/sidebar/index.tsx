"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSidebar } from "@/context/sidebarContext"
import { RiUserSearchLine, RiUserSearchFill, RiLogoutCircleRFill} from "react-icons/ri"
import { AiOutlineLogout } from "react-icons/ai"
import { HiHome, HiOutlineHome } from "react-icons/hi"
import { HeaderSidebar, MenusSideBar, Collapsible } from "@/components"
import { useAuth } from "@/context/authContext"

type SidebarProps = { page: string }

const Sidebar = ({ page }: SidebarProps) => {
  const {username } = useAuth()
  const router = useRouter()
  const {open, setOpen} = useSidebar();
  const [activeMenu, setActiveMenu] = useState<string>(`${page}`)
  const menus = [
    {title: "Home", icon: <HiOutlineHome/>, activeIcon: <HiHome />, href: "/home"},
    { title: "Annotateurs", icon: <RiUserSearchLine />, activeIcon: <RiUserSearchFill />, href: "/home/user" },
    { title: "Datasets", icon: <RiUserSearchLine />, activeIcon: <RiUserSearchFill />, href: "/home/dataset" },
    {title: "Logout", icon: <AiOutlineLogout />, activeIcon: <RiLogoutCircleRFill />, gap: true, href: "/home/logout"},
  ]

  const handleMenuClick = (href: string) => {setActiveMenu(href); router.push(href)}
  
  return (
    <div className={`${open ? "w-72" : "w-20"} p-5 pt-8 h-screen bg-[#121A24] relative duration-300`}>
      <Collapsible open={open} setOpen={setOpen}/>
      <HeaderSidebar open={open} />
      <MenusSideBar open={open} activeMenu={activeMenu} menus={menus} handleMenuClick={handleMenuClick}/>
    </div>
  )
}

export default Sidebar