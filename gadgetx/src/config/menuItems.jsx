import React from 'react'
import { PiEyeBold } from 'react-icons/pi'
import {
  FiFileText,
  FiDollarSign,
  FiShoppingCart,
  FiPrinter,
} from 'react-icons/fi'
import { MdOutlineFileDownload } from 'react-icons/md'
import { AiOutlinePrinter } from 'react-icons/ai'
import { FaRegEdit } from 'react-icons/fa'
import { LuTrash2, LuPackagePlus } from 'react-icons/lu'
import { TbPencilDollar } from 'react-icons/tb'

export const getSaleMenuItems = (sale, handlers) => [
  {
    label: 'View Sale',
    icon: <PiEyeBold size={16} />,
    onClick: () => handlers.onView(sale.id),
  },
  {
    label: 'Download PDF',
    icon: <FiFileText size={16} />,
    onClick: () => handlers.onDownloadPdf(sale.id),
  },
  {
    label: 'Print Receipt',
    icon: <AiOutlinePrinter size={16} />,
    onClick: () => handlers.onDownloadReceipt(sale.id),
  },
  {
    label: 'Show Payments',
    icon: <FiDollarSign size={16} />,
    onClick: () => handlers.onShowPayments(sale),
  },
  {
    label: 'Create Payment',
    icon: <TbPencilDollar size={16} />,
    onClick: () => handlers.onCreatePayment(sale.id),
  },
  {
    label: 'Create Sale Return',
    icon: <FiShoppingCart size={16} />,
    onClick: () => handlers.onCreateSaleReturn(sale.id),
  },
  {
    label: 'Edit Sale',
    icon: <FaRegEdit size={16} />,
    onClick: () => handlers.onEdit(sale.id),
  },
  {
    label: 'Delete Sale',
    icon: <LuTrash2 size={16} />,
    onClick: () => handlers.onDelete(sale),
  },
]
export const getSaleReturnMenuItems = (saleReturn, handlers) => [
  {
    label: 'View Return',
    icon: <PiEyeBold size={16} />,
    onClick: () => handlers.onView(saleReturn.id, saleReturn),
  },
  {
    label: 'Edit Return',
    icon: <FaRegEdit size={16} />,
    onClick: () => handlers.onEdit(saleReturn.id, saleReturn),
  },
  {
    label: 'Delete Return',
    icon: <LuTrash2 size={16} />,
    onClick: () => handlers.onDelete(saleReturn.id),
  },
  {
    label: 'Show Payments',
    icon: <FiDollarSign size={16} />,
    onClick: () => handlers.onShowPayments(saleReturn),
  },
]

export const getPurchaseMenuItems = (purchase, handlers) => [
  {
    label: 'View Purchase',
    icon: <PiEyeBold size={16} />,
    onClick: () => handlers.onView(purchase.id, purchase),
  },
  {
    label: 'Download PDF',
    icon: <FiFileText size={16} />,
    onClick: () => handlers.onDownloadPdf(purchase.id),
  },
  {
    label: 'Show Payments',
    icon: <FiDollarSign size={16} />,
    onClick: () => handlers.onShowPayments(purchase.id),
  },
  {
    label: 'Create Purchase Return',
    icon: <LuPackagePlus size={16} />,
    onClick: () => handlers.onCreatePurchaseReturn(purchase.id),
  },
  {
    label: 'Edit Purchase',
    icon: <FaRegEdit size={16} />,
    onClick: () => handlers.onEdit(purchase.id, purchase),
  },
  {
    label: 'Delete Purchase',
    icon: <LuTrash2 size={16} />,
    onClick: () => handlers.onDelete(purchase),
  },
]
export const getPurchaseReturnMenuItems = (purchaseReturn, handlers) => [
  {
    label: 'View Return',
    icon: <PiEyeBold size={16} />,
    onClick: () => handlers.onView(purchaseReturn.id),
  },
  {
    label: 'Edit Return',
    icon: <FaRegEdit size={16} />,
    onClick: () => handlers.onEdit(purchaseReturn.id),
  },
  {
    label: 'Delete Return',
    icon: <LuTrash2 size={16} />,
    onClick: () => handlers.onDelete(purchaseReturn.id),
  },
  {
    label: 'Show Payments',
    icon: <FiDollarSign size={16} />,
    onClick: () => handlers.onShowPayments(purchaseReturn),
  },
]
export const getJobSheetMenuItems = (jobsheet, handlers) => [
  {
    label: 'View Job Sheet',
    icon: <PiEyeBold size={16} />,
    onClick: () => handlers.onView(jobsheet),
  },
  {
    label: 'Edit Job Sheet',
    icon: <FaRegEdit size={16} />,
    onClick: () => handlers.onEdit(jobsheet),
  },
  {
    label: 'Delete Job Sheet',
    icon: <LuTrash2 size={16} />,
    onClick: () => handlers.onDelete(jobsheet.job_id),
  },
  {
    label: 'Download PDF',
    icon: <FiFileText size={16} />,
   onClick: () => handlers.onDownloadPdf(jobsheet.job_id),
  },
  {
    label: 'Print',
    icon: <FiPrinter size={16} />,
    onClick: () => handlers.onPrint(jobsheet),
  },
]