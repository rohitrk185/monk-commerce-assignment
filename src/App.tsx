import { useState, useCallback } from 'react'
import { produce } from 'immer'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'

import ProductList from './components/ProductList'
import ProductPicker from './components/ProductPicker'
import AddProductButton from './components/AddProductButton'
import type { Product, DiscountType } from './types'

function App() {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [isPickerOpen, setIsPickerOpen] = useState(false)
  const [editingProductIndex, setEditingProductIndex] = useState<number | null>(
    null
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Product Handling
  const handleAddProduct = () => {
    // Add a placeholder product
    const newPlaceholder: Product = {
      localId: `placeholder-${crypto.randomUUID()}`,
      title: '',
      variants: [],
      image: null,
      discountType: null,
      discountValue: null,
      showVariants: false,
      isPlaceholder: true,
    }
    setSelectedProducts(
      produce((draft) => {
        draft.push(newPlaceholder)
      })
    )
  }

  const handleRemoveProduct = useCallback((localIdToRemove: string) => {
    setSelectedProducts(
      produce((draft) => {
        const index = draft.findIndex((p) => p.localId === localIdToRemove)
        if (index !== -1) {
          draft.splice(index, 1)
        }
      })
    )
  }, [])

  const handleEditProduct = useCallback((index: number) => {
    setEditingProductIndex(index)
    setIsPickerOpen(true)
  }, [])

  const handleToggleVariants = useCallback((localId: string) => {
    setSelectedProducts(
      produce((draft) => {
        const product = draft.find((p) => p.localId === localId)
        if (product) {
          product.showVariants = !product.showVariants
        }
      })
    )
  }, [])

  // Discount Handling
  const handleUpdateProductDiscount = useCallback(
    (localId: string, type: DiscountType | null, value: number | null) => {
      setSelectedProducts(
        produce((draft) => {
          const product = draft.find((p) => p.localId === localId)
          if (product) {
            // 1. Update the main product's discount
            product.discountType = type
            product.discountValue = value

            // 2. Iterate through the product's variants and update their discounts
            if (product.variants && product.variants.length > 0) {
              product.variants.forEach((variant) => {
                variant.discountType = type
                variant.discountValue = value
              })
            }
          }
        })
      )
    },
    []
  )

  const handleUpdateVariantDiscount = useCallback(
    (
      variantLocalId: string,
      type: DiscountType | null,
      value: number | null
    ) => {
      setSelectedProducts(
        produce((draft) => {
          // Find the variant across all products
          for (const product of draft) {
            const variant = product.variants.find(
              (v) => v.localId === variantLocalId
            )
            if (variant) {
              variant.discountType = type
              variant.discountValue = value
              break
            }
          }
        })
      )
    },
    []
  )

  //  Product Picker Handling
  const handleClosePicker = () => {
    setIsPickerOpen(false)
    setEditingProductIndex(null)
  }

  const handleProductSelection = (newlySelectedProducts: Product[]) => {
    if (editingProductIndex === null) return

    setSelectedProducts(
      produce((draft) => {
        // Replace the product at the editing index with the newly selected ones
        draft.splice(editingProductIndex, 1, ...newlySelectedProducts)
      })
    )

    handleClosePicker()
  }

  // Drag and Drop Handling
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event

      if (!over) return // Dropped outside a droppable area
      const activeId = active.id
      const overId = over.id
      if (activeId === overId) return // Dropped in the same place

      const activeType = active.data.current?.type
      const overType = over.data.current?.type

      console.log('Drag End:', { activeId, overId, activeType, overType })
      // console.log('Active Data:', active.data.current); // Keep for debugging if needed
      // console.log('Over Data:', over.data.current); // Keep for debugging if needed

      if (activeType === 'PRODUCT' && overType === 'PRODUCT') {
        // Reordering Products - Update state directly using arrayMove
        setSelectedProducts((currentProducts) => {
          const oldIndex = currentProducts.findIndex(
            (p) => p.localId === activeId
          )
          const newIndex = currentProducts.findIndex(
            (p) => p.localId === overId
          )

          if (oldIndex !== -1 && newIndex !== -1) {
            // Return the NEW array created by arrayMove
            return arrayMove(currentProducts, oldIndex, newIndex)
          }
          // Return original array if indices are invalid
          console.warn('Product DnD: Indices not found.')
          return currentProducts
        })
      } else if (activeType === 'VARIANT' && overType === 'VARIANT') {
        // Reordering Variants - Use produce for nested state mutation
        setSelectedProducts(
          produce((draft) => {
            let productIndex = -1
            // Find the product containing the dragged variant
            for (let i = 0; i < draft.length; i++) {
              if (draft[i].variants.some((v) => v.localId === activeId)) {
                productIndex = i
                break
              }
            }

            if (productIndex !== -1) {
              const product = draft[productIndex]
              // Ensure the drop target variant is within the SAME product
              if (product.variants.some((v) => v.localId === overId)) {
                const oldVariantIndex = product.variants.findIndex(
                  (v) => v.localId === activeId
                )
                const newVariantIndex = product.variants.findIndex(
                  (v) => v.localId === overId
                )

                if (oldVariantIndex !== -1 && newVariantIndex !== -1) {
                  // Use arrayMove directly on the draft's nested array
                  product.variants = arrayMove(
                    product.variants,
                    oldVariantIndex,
                    newVariantIndex
                  )
                } else {
                  console.warn(
                    'Variant DnD: Variant indices not found within product.'
                  )
                }
              } else {
                console.warn('Cannot move variant between different products.')
              }
            } else {
              console.warn(
                'Variant DnD: Product not found for dragged variant.'
              )
            }
          })
        )
      } else {
        console.log(
          'Unhandled drag/drop combination:',
          activeType,
          'over',
          overType
        )
      }
    },
    [] // Keep dependencies empty as only using state updater function pattern
  )

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {' '}
      <h1 className="text-2xl font-semibold mb-4 text-gray-800">
        Monk Upsell & Cross-sell
      </h1>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-medium mb-4 text-gray-700">Add Products</h2>

        {/* Wrap ProductList with DndContext */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <ProductList
            products={selectedProducts}
            onRemoveProduct={handleRemoveProduct}
            onEditProduct={handleEditProduct}
            onToggleVariants={handleToggleVariants}
            onUpdateProductDiscount={handleUpdateProductDiscount}
            onUpdateVariantDiscount={handleUpdateVariantDiscount}
          />
        </DndContext>

        {selectedProducts.length === 0 && (
          <p className="text-center text-gray-500 my-6">
            No products added yet. Click below to add one.
          </p>
        )}

        <div className="mt-6">
          <AddProductButton onClick={handleAddProduct} />
        </div>
      </div>
      <ProductPicker
        isOpen={isPickerOpen}
        onClose={handleClosePicker}
        onSelectProducts={handleProductSelection}
      />
    </div>
  )
}

export default App
