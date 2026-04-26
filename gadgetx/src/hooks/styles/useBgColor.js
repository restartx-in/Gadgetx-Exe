import { useLocation } from 'react-router-dom'

const useBgColor = () => {
  const location = useLocation()
  return ['/', '/subscription', '/menu'].includes(location.pathname)
}

export default useBgColor
