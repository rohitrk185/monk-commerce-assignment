import { FC } from 'react'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import VariantItem from './VariantItem'
import type { Variant, DiscountType } from '../types'

interface VariantListProps {
  productId: string // Local ID of the parent product
  variants: Variant[]
  onUpdateVariantDiscount: (
    variantLocalId: string,
    type: DiscountType | null,
    value: number | null
  ) => void
}

const VariantList: FC<VariantListProps> = ({
  variants,
  onUpdateVariantDiscount,
}) => {
  // Extract just the localIds for SortableContext
  const variantIds = variants.map((v) => v.localId)

  return (
    <SortableContext items={variantIds} strategy={verticalListSortingStrategy}>
      <div className="mt-2 space-y-1">
        {variants.map((variant) => (
          <VariantItem
            key={variant.localId}
            variant={variant}
            onUpdateDiscount={onUpdateVariantDiscount}
          />
        ))}
      </div>
    </SortableContext>
  )
}

export default VariantList
