export default function isAllFiltersEmpty(...states) {
  const allEmpty = states.every((val) => val === '')
  if (allEmpty)
    return true // Indicates that refetch was called
  else return false
}
