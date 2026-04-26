import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint = 900) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= breakpoint : false,
  )

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= breakpoint)
    }

    handleResize() // Set initially

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [breakpoint])

  return isMobile
}
