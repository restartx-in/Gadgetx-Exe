
import { useEffect, useRef } from 'react'
import './style.scss' 

const RangeField = ({
  label, 
  min = 0,
  max = 1000000,
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  step = 1,
  prefix = '₹', 
}) => {
  const highlightRef = useRef(null)

  const handleMinChange = (e) => {
    const value = Math.min(Number(e.target.value), maxValue - step)
    onMinChange(value)
  }

  const handleMaxChange = (e) => {
    const value = Math.max(Number(e.target.value), minValue + step)
    onMaxChange(value)
  }

  useEffect(() => {
    if (highlightRef.current) {
      highlightRef.current.style.left = ((minValue - min) / (max - min)) * 100 + '%'
      highlightRef.current.style.width = ((maxValue - minValue) / (max - min)) * 100 + '%'
    }
  }, [minValue, maxValue, min, max])

  return (
    <div className="range_container">
      {label && <label className="range_container__label">{label}</label>}
      
      <div className="range_container__track">
        <div
          ref={highlightRef}
          className="range_container__track-highlight"
        ></div>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={minValue}
          onChange={handleMinChange}
          className="range_container__input_style"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={maxValue}
          onChange={handleMaxChange}
          className="range_container__input_style"
        />
      </div>

      <div className="price-labels-container">
        <div className="price-label">{prefix}{minValue}</div>
        <div className="price-label">{prefix}{maxValue}</div>
      </div>
    </div>
  )
}

export default RangeField