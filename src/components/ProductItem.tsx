import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Bars3Icon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import DiscountInput from './DiscountInput'
import VariantList from './VariantList'
import type { Product, DiscountType } from '../types'
import clsx from 'clsx'
import { FC } from 'react'

interface ProductItemProps {
  product: Product
  index: number
  totalProducts: number
  onRemove: (localId: string) => void
  onEdit: (index: number) => void
  onToggleVariants: (localId: string) => void
  onUpdateProductDiscount: (
    localId: string,
    type: DiscountType | null,
    value: number | null
  ) => void
  onUpdateVariantDiscount: (
    variantLocalId: string,
    type: DiscountType | null,
    value: number | null
  ) => void
}

const ProductItem: FC<ProductItemProps> = ({
  product,
  index,
  totalProducts,
  onRemove,
  onEdit,
  onToggleVariants,
  onUpdateProductDiscount,
  onUpdateVariantDiscount,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: product.localId,
    data: { type: 'PRODUCT', product: product },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  }

  const handleProductDiscountTypeChange = (type: DiscountType) => {
    onUpdateProductDiscount(product.localId, type, product.discountValue)
  }

  const handleProductDiscountValueChange = (value: number | null) => {
    onUpdateProductDiscount(
      product.localId,
      product.discountType ?? 'percentage',
      value
    )
  }

  const hasMultipleVariants = product.variants && product.variants.length > 1

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'mb-2 bg-white rounded shadow',
        isDragging && 'opacity-50 shadow-xl'
      )}
    >
      {/* Main Product Row */}
      <div className="flex items-center p-3 border-b border-gray-200">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab text-gray-400 hover:text-gray-600 mr-3 p-1"
        >
          <Bars3Icon className="h-5 w-5" />
        </button>

        <span className="text-gray-500 font-medium w-8 mr-2">{index + 1}.</span>

        {/* Product Info */}
        <div className="flex items-center space-x-3 flex-grow mr-4">
          {product.isPlaceholder ? (
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded text-gray-400 text-xs">
              Empty
            </div>
          ) : (
            <img
              src={product.image?.src}
              alt={product.title}
              className="w-12 h-12 object-cover rounded border border-gray-200"
              onError={(e) =>
                (e.currentTarget.src = 'https://via.placeholder.com/50')
              }
            />
          )}
          <span className="text-sm font-medium text-gray-800">
            {product.isPlaceholder ? 'Select Product' : product.title}
          </span>
        </div>

        {/* Product Discount */}
        <div className="mr-4">
          {!product.isPlaceholder && (
            <DiscountInput
              type={product.discountType}
              value={product.discountValue}
              onTypeChange={handleProductDiscountTypeChange}
              onValueChange={handleProductDiscountValueChange}
              placeholder="Prod Disc."
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {/* Edit Button */}
          <button
            title="Edit/Select Product"
            onClick={() => onEdit(index)}
            className="text-blue-600 hover:text-blue-800 p-1"
          >
            <PencilSquareIcon className="h-5 w-5" />
          </button>

          {hasMultipleVariants && !product.isPlaceholder && (
            <button
              onClick={() => onToggleVariants(product.localId)}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800 p-1 rounded hover:bg-indigo-50 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              title={product.showVariants ? 'Hide Variants' : 'Show Variants'}
            >
              {product.showVariants ? 'Hide' : 'Show'} Variants
              {/* {product.showVariants ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />} */}
            </button>
          )}

          {/* Delete Button */}
          {totalProducts > 1 && (
            <button
              title="Remove Product"
              onClick={() => onRemove(product.localId)}
              className="text-red-500 hover:text-red-700 p-1"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Variants List */}
      {hasMultipleVariants &&
        product.showVariants &&
        !product.isPlaceholder && (
          <div className="p-3 pt-2">
            {' '}
            <VariantList
              productId={product.localId}
              variants={product.variants}
              onUpdateVariantDiscount={onUpdateVariantDiscount}
            />
          </div>
        )}
    </div>
  )
}

export default ProductItem
