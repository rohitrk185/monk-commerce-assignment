import { PlusIcon } from '@heroicons/react/24/solid'
import { FC } from 'react'

interface AddProductButtonProps {
  onClick: () => void
  disabled?: boolean
}

const AddProductButton: FC<AddProductButtonProps> = ({ onClick, disabled }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
    >
      <PlusIcon className="h-5 w-5" />
      <span>Add Product</span>
    </button>
  )
}

export default AddProductButton
