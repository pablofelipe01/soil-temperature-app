'use client'

import { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthContainer() {
  const [isLoginMode, setIsLoginMode] = useState(true)

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">
            🌡️ Soil Temperature Monitor
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de monitoreo para certificación de bonos de carbono
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLoginMode ? (
          <LoginForm onToggleMode={toggleMode} />
        ) : (
          <RegisterForm onToggleMode={toggleMode} />
        )}
      </div>
    </div>
  )
}