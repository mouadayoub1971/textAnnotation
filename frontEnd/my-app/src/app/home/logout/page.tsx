"use client"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

const Logout = () => {
  const router = useRouter()

  useEffect(() => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    localStorage.removeItem("role")
    router.push("/")
  }, [router])
  
  return null
}

export default Logout