import { ChangeEvent, FC } from 'react'
import type { DiscountType } from '../types'

interface DiscountInputProps {
  type: DiscountType | null
  value: number | null
  onTypeChange: (type: DiscountType) => void
  onValueChange: (value: number | null) => void
  placeholder?: string
}

const DiscountInput: FC<DiscountInputProps> = ({
  type,
  value,
  onTypeChange,
  onValueChange,
  placeholder = 'Discount',
}) => {
  const handleValueChange = (e: ChangeEvent<HTMLInputElement>) => {
    const numValue = e.target.value ? parseFloat(e.target.value) : null
    if (numValue === null || (!isNaN(numValue) && numValue >= 0)) {
      onValueChange(numValue)
    }
  }

  const handleTypeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onTypeChange(e.target.value as DiscountType)
  }

  return (
    <div className="flex items-center border border-gray-300 rounded overflow-hidden">
      <input
        type="number"
        min="0"
        step="0.01"
        className="p-1 text-sm w-20 outline-none text-right"
        placeholder={placeholder}
        value={value ?? ''}
        onChange={handleValueChange}
      />
      <select
        className="p-1 text-sm bg-gray-100 border-l border-gray-300 outline-none"
        value={type ?? 'percentage'}
        onChange={handleTypeChange}
      >
        <option value="percentage">%</option>
        <option value="flat">Flat</option>{' '}
      </select>
    </div>
  )
}

export default DiscountInput
