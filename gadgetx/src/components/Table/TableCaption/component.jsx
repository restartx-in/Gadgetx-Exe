// import "./style.scss"

// const TableCaption = ({ item }) => {
//   return (
//     <p className= "table_caption fs18 fw500 ">No {item} found.</p>
//   )
// }

// export default TableCaption

import './style.scss'
import {Tr,Td,} from '@/components/Table'

const TableCaption = ({ item, noOfCol }) => {
  return (
    <Tr>
      <Td colSpan={noOfCol} className="text-center py-4">
        <p className="table_caption fs18 fw500">No {item} found.</p>
      </Td>
    </Tr>
  )
}

export default TableCaption
