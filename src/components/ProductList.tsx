import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import ProductItem from './ProductItem'
import type { Product, DiscountType } from '../types'
import { FC } from 'react'

interface ProductListProps {
  products: Product[]
  onRemoveProduct: (localId: string) => void
  onEditProduct: (index: number) => void
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

const ProductList: FC<ProductListProps> = ({
  products,
  onRemoveProduct,
  onEditProduct,
  onToggleVariants,
  onUpdateProductDiscount,
  onUpdateVariantDiscount,
}) => {
  const productIds = products.map((p) => p.localId)

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="hidden md:flex items-center px-3 py-2 text-xs font-semibold text-gray-500 uppercase border-b">
        <span className="w-12 mr-3"></span> {/* Spacer for drag handle */}
        <span className="w-8 mr-2">#</span>
        <span className="flex-grow mr-4">Product</span>
        <span className="w-40 mr-4 text-center">Discount</span>{' '}
        <span className="w-32 text-right">Actions</span>{' '}
      </div>

      <SortableContext
        items={productIds}
        strategy={verticalListSortingStrategy}
      >
        {products.map((product, index) => (
          <ProductItem
            key={product.localId}
            product={product}
            index={index}
            totalProducts={products.length}
            onRemove={onRemoveProduct}
            onEdit={onEditProduct}
            onToggleVariants={onToggleVariants}
            onUpdateProductDiscount={onUpdateProductDiscount}
            onUpdateVariantDiscount={onUpdateVariantDiscount}
          />
        ))}
      </SortableContext>
    </div>
  )
}

export default ProductList
