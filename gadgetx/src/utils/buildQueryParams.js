function buildQueryParams(filters = {}) {
  const params = new URLSearchParams()
  for (const key in filters) {
    if (
      filters[key] !== undefined &&
      filters[key] !== null &&
      filters[key] !== 0 &&
      filters[key] !== ''
    ) {
      // do not pass searchKey to api for if searchType not selected
      if (!(key === 'serachKey' && filters.searchType === '')) {
        params.append(key, filters[key])
      }
    }
  }

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export default buildQueryParams
