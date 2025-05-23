// Import Packages
"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/authContext"
// Import Libraries
import axios from "axios"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

// Import Components
import { MobileSize } from "@/components"

// Import Templates
import { Login } from "@/templates"


// Import Functions
import useHandleResize from "@/utils/handleResize"

const LoginPage = () => {
const { setToken , token, setRole, role, setUsername, username} = useAuth()
  // Router
  const router = useRouter()
  useEffect(() => {
    console.log("this is where the use effect check ")
    console.log(token)
      if (localStorage.getItem("token")) {
  router.push("/home");
}
    }, [router])


  
  // Util
  const isDesktop = useHandleResize()



  // State
  const [emailInput, setEmailInput] = useState<string>("")
  const [passInput, setPassInput] = useState<string>("")
  const [rememberMe, setRememberMe] = useState<boolean>(false)
  
  // Axios
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    try {
      const response = await axios.post(`http://127.0.0.1:8080/api/auth/login`, {
        login: emailInput,
        password: passInput
      })
      
      if(response.status === 200) {
        toast.success("Login Success! Redirecting...", { 
          style: { 
            fontSize: "13px", 
            backgroundColor: "#18212E", 
            color: "#F0F1F2", 
            border: "2px solid #F0F1F2"
          }
        });
        console.log(response)
        console.log(response.data.token)
        setToken(response.data.token)
        console.log(response)
        console.log(response.data.role)
        setRole(response.data.role)
        console.log(response)
        console.log(response.data.username)
        setUsername(response.data.username)
        if (response.data.role === "ROLE_ADMIN_ROLE") {
          setTimeout(() => {router.push("/home")}, 2000)
        }
        else {
          setTimeout(() => {router.push("/annotateur")}, 2000)
        }
        
      }
    } catch (error) {
      toast.error("Incorrect email or password...", { 
        style: { 
          fontSize: "13px", 
          backgroundColor: "#18212E", 
          color: "#F0F1F2", 
          border: "2px solid #F0F1F2"
        }
      });
    }
  }

  // Function
  const rememberLogin = (value: boolean) => setRememberMe(value)

  // Effect
 
  return (
    <>
      {isDesktop ? (
          <>
            <Login emailInput={emailInput} passInput={passInput} setEmailInput={setEmailInput} setPassInput={setPassInput} handleLogin={handleLogin} rememberLogin={rememberLogin} />
            <ToastContainer />
          </>
      ) : (
        <MobileSize />
      )}
    </>
  );
}

export default LoginPage
