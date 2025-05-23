"use client"
import React, { createContext, useContext, useState, useEffect } from "react"

interface AuthContextProps {
    token: string | null,
    setToken: (token: string) => void,
    role: string | null,
    setRole: (role: string) => void,
    username: string | null,
    setUsername: (username: string) => void
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [token, setTokenState] = useState<string | null>(null)
    const [role, setRoleState] = useState<string | null>(null)
    const [username, setUsernameState] = useState<string | null>(null)

    const setToken = (token: string) => {
        localStorage.setItem("token", token);
        console.log("the item ist stored")
        setTokenState(token)
    }
    const setRole = (role: string) => {
        localStorage.setItem("role", role);
        console.log("the item ist stored")
        setRoleState(role)
    }
    const setUsername = (username: string) => {
        localStorage.setItem("username", username);
        console.log("the item ist stored")
        setUsernameState(username)
    }

    useEffect(() => {
        const storedToken = localStorage.getItem("token")
        if (storedToken) setTokenState(storedToken)
        const storedRole = localStorage.getItem("role")
        if (storedRole) setRoleState(storedRole)
        const storedUsername = localStorage.getItem("username")
        if(storedUsername) setUsername(storedUsername)
    }, [])
    
    return (
        <AuthContext.Provider value={{token, setToken, role, setRole, username, setUsername}}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error("useAuth must be used within an AuthProvider")
    return context
}