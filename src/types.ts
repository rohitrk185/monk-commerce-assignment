export interface ApiImage {
  id: number
  product_id: number
  src: string
}

export interface ApiVariant {
  id: number
  product_id: number
  title: string
  price: string
}

export interface ApiProduct {
  id: number
  title: string
  variants: ApiVariant[]
  image: ApiImage | null
}

// Internal Usage State Types
export type DiscountType = 'percentage' | 'flat'

export interface Variant extends ApiVariant {
  localId: string // Unique ID for DND and selection state
  discountType: DiscountType | null
  discountValue: number | null
}

export interface Product extends Omit<ApiProduct, 'id' | 'variants'> {
  localId: string // Unique ID for DND and list state
  apiId?: number // original API Product ID if available
  variants: Variant[]
  discountType: DiscountType | null
  discountValue: number | null
  showVariants: boolean
  isPlaceholder: boolean // To identify newly added rows
}

export interface SelectedVariantInfo extends Variant {
  productTitle: string
  productImageSrc: string | undefined
}
