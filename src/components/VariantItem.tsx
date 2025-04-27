import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Bars3Icon } from '@heroicons/react/24/solid'
import DiscountInput from './DiscountInput'
import type { Variant, DiscountType } from '../types'
import clsx from 'clsx'
import { FC } from 'react'

interface VariantItemProps {
  variant: Variant
  onUpdateDiscount: (
    variantLocalId: string,
    type: DiscountType | null,
    value: number | null
  ) => void
}

const VariantItem: FC<VariantItemProps> = ({ variant, onUpdateDiscount }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: variant.localId,
    data: { type: 'VARIANT', variant: variant },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  const handleDiscountTypeChange = (type: DiscountType) => {
    onUpdateDiscount(variant.localId, type, variant.discountValue)
  }

  const handleDiscountValueChange = (value: number | null) => {
    onUpdateDiscount(
      variant.localId,
      variant.discountType ?? 'percentage',
      value
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded ml-12 mb-1',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <div className="flex items-center space-x-2 flex-grow">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 p-1"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>
        <span className="text-sm text-gray-700 flex-grow">{variant.title}</span>
        <span className="text-sm text-gray-500 mr-4">${variant.price}</span>
      </div>
      <DiscountInput
        type={variant.discountType}
        value={variant.discountValue}
        onTypeChange={handleDiscountTypeChange}
        onValueChange={handleDiscountValueChange}
        placeholder="Var Disc."
      />
    </div>
  )
}

export default VariantItem
