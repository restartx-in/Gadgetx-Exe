import { useState } from 'react'
import useLogin from '@/hooks/api/auth/useLogin'
import { useSignup } from '@/hooks/api/auth/useSignup'
import { useNavigate } from 'react-router-dom'
import { FiKey, FiUserPlus } from 'react-icons/fi'
import './style.scss'

const AccountingIllustration = () => (
  <svg
    width="100%"
    height="260"
    viewBox="0 0 200 250"
    preserveAspectRatio="xMidYMid meet"
    className="illustration-svg">
    <defs>
      <linearGradient id="grad-bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="var(--navy)" />
        <stop offset="100%" stopColor="var(--color-neutral-0)" />
      </linearGradient>
    </defs>
    <rect
      x="30"
      y="20"
      width="140"
      height="230"
      rx="20"
      fill="var(--color-neutral-0)"
      stroke="var(--color-neutral-300)"
      strokeWidth="2"
    />
    <rect x="40" y="30" width="120" height="170" rx="10" fill="url(#grad-bg)" />
    <path
      d="M 50 140 C 70 110, 80 160, 100 120 S 130 80, 150 100"
      stroke="var(--color-primary-500)"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="150" cy="100" r="4" fill="var(--color-primary-600)" />
    <rect x="50" y="190" width="20" height="10" rx="5" fill="var(--navy)" />
    <rect x="87.5" y="190" width="25" height="15" rx="5" fill="var(--navy)" />
    <rect x="125" y="190" width="20" height="10" rx="5" fill="var(--navy)" />
  </svg>
)

const Login = () => {
  const navigate = useNavigate()
  const [isSignup, setIsSignup] = useState(false)
  const [validationError, setValidationError] = useState(null)
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',       
    type: 'gadget', 
    plan: 'premium'
  })

  const { login, isLoading: isLoginLoading, error: loginError } = useLogin()
  const { mutate: signup, isPending: isSignupLoading, error: signupError } = useSignup()

  const handleInputChange = (e) => {
    setValidationError(null) // Clear errors when user types
    setFormData({ ...formData, [e.target.id]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setValidationError(null)

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        setValidationError("Passwords do not match.")
        return
      }

     
      const { confirmPassword, ...payload } = formData

      signup(payload, {
        onSuccess: () => {
          setIsSignup(false)
          // Clear sensitive fields
          setFormData(prev => ({ ...prev, password: '', confirmPassword: '' })) 
        },
      })
    } else {
      const result = await login(formData.username, formData.password)
      if (result.success) {
        navigate('/')
      }
    }
  }

  const toggleMode = () => {
    setIsSignup(!isSignup)
    setValidationError(null)
  }

  const isLoading = isLoginLoading || isSignupLoading
  // Show Validation Error OR API Error
  const error = validationError || (isSignup ? (signupError?.response?.data?.message || signupError?.message) : loginError)

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        <div className="login-form-container">
          <div className="form-header">
            {isSignup ? <FiUserPlus size={24} /> : <FiKey size={24} />}
            <h1 className="fs20 fw600">GadgetX</h1>
          </div>
          
          <h2 className="fs28 fw700">{isSignup ? 'Create Account' : 'Welcome Back'}</h2>
          {/* <p className="fs14 color-text-subtle mb24">
            {isSignup 
              ? 'Register your company to get started.' 
              : 'Please sign in to continue.'}
          </p> */}

          <form onSubmit={handleSubmit} className="login-form">
            {error && <p className="error-message fs14 mb20" style={{color: 'red'}}>{error}</p>}

            {/* Signup Specific Field: Company Name */}
            {isSignup && (
              <div className="input-group fs16 fw400">
                {/* <label htmlFor="name">Company Name</label> */}
                <input
                placeholder='Company Name'
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            {/* Common Fields */}
            <div className="input-group fs16 fw400">
              {/* <label htmlFor="username">Username</label> */}
              <input
                type="text"
                id="username"
                placeholder='Username'
                value={formData.username}
                onChange={handleInputChange}
                autoComplete="username"
                required
              />
            </div>

            <div className="input-group fs16 fw400">
              {/* <label htmlFor="password">Password</label> */}
              <input
                type="password"
                id="password"
                placeholder='password'
                value={formData.password}
                onChange={handleInputChange}
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
                minLength={6}
              />
            </div>

            {/* Confirm Password - Only for Signup */}
            {isSignup && (
              <div className="input-group fs16 fw400">
                {/* <label htmlFor="confirmPassword">Confirm Password</label> */}
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder='Confirm Password'
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  autoComplete="new-password"
                  required
                  minLength={6}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="login-button fs16 fw600"
              style={{ marginTop: '10px' }}>
              {isLoading 
                ? 'Processing...' 
                : (isSignup ? 'Register Company' : 'Sign In')}
            </button>
            
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <span className="fs14 color-text-subtle">
                {isSignup ? "Already have an account? " : "Don't have an account? "}
              </span>
              <button 
                type="button" 
                onClick={toggleMode}
                className="fs14 fw600"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--color-primary-600)', 
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                {isSignup ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>

        <div className="login-image-panel">
          <AccountingIllustration />
        </div>
      </div>
    </div>
  )
}

export default Login