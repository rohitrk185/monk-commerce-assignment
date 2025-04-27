import { useState, useEffect, Fragment, FC, ChangeEvent } from 'react'
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from '@headlessui/react'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { fetchProducts as fetchProductsApi } from '../services/api'
import { useDebounce } from '../hooks/useDebounce'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import type { ApiProduct, ApiVariant, SelectedVariantInfo } from '../types'

interface ProductPickerProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectProducts: (selectedProducts: any[]) => void // Use a more specific type later if needed
}

const ProductPicker: FC<ProductPickerProps> = ({
  isOpen,
  onClose,
  onSelectProducts,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [products, setProducts] = useState<ApiProduct[]>([])
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, SelectedVariantInfo>
  >({}) // Stores selected variant info by localId
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500) // 500ms debounce

  const loadProducts = async (
    term: string,
    currentPage: number,
    reset: boolean = false
  ) => {
    if (isLoading || (!hasMore && !reset)) return
    setIsLoading(true)
    setError(null)
    try {
      // Use the correct localId generation from the api service
      const fetchedProducts = await fetchProductsApi(term, currentPage, 10)
      if (reset) {
        setProducts(fetchedProducts)
      } else {
        // Filter out duplicates just in case API returns overlapping items on pagination
        setProducts((prev) => [
          ...prev,
          ...fetchedProducts.filter((fp) => !prev.some((p) => p.id === fp.id)),
        ])
      }
      setHasMore(fetchedProducts.length === 10)
      setPage(currentPage + 1)
    } catch (err) {
      console.error('Failed to load products:', err)
      setError('Failed to load products. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  // Effect for initial load and search term changes
  useEffect(() => {
    // Reset everything when search term changes
    setProducts([])
    setPage(1)
    setHasMore(true)
    setSelectedVariants({}) // Clear selection on new search
    loadProducts(debouncedSearchTerm, 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm]) // Dependency: debounced search term

  // Effect to reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setProducts([])
      setSelectedVariants({})
      setPage(1)
      setHasMore(true)
      setIsLoading(false)
      setError(null)
    }
  }, [isOpen])

  // Infinite scroll setup
  const lastElementRef = useInfiniteScroll({
    loading: isLoading,
    hasMore: hasMore,
    onLoadMore: () => {
      if (!isLoading && hasMore) {
        loadProducts(debouncedSearchTerm, page)
      }
    },
    disabled: !isOpen, // Disable when modal is closed
  })

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }

  const handleVariantSelectToggle = (
    variant: ApiVariant,
    product: ApiProduct
  ) => {
    const localVariantId = `${variant.product_id}-${variant.id}` // Consistent local ID
    setSelectedVariants((prev) => {
      const newSelected = { ...prev }
      if (newSelected[localVariantId]) {
        delete newSelected[localVariantId] // Deselect
      } else {
        // Select: Store necessary info to reconstruct Product later
        newSelected[localVariantId] = {
          ...(variant as SelectedVariantInfo), // Type assertion needed
          localId: localVariantId,
          productTitle: product.title,
          productImageSrc: product.image?.src,
          // Initialize discount fields
          discountType: null,
          discountValue: null,
        }
      }
      return newSelected
    })
  }

  const handleSelectAllProductVariants = (product: ApiProduct) => {
    setSelectedVariants((prev) => {
      const newSelected = { ...prev }
      product.variants.forEach((variant) => {
        const localVariantId = `${variant.product_id}-${variant.id}`
        if (!newSelected[localVariantId]) {
          // Only select if not already selected
          newSelected[localVariantId] = {
            ...(variant as SelectedVariantInfo),
            localId: localVariantId,
            productTitle: product.title,
            productImageSrc: product.image?.src,
            discountType: null,
            discountValue: null,
          }
        }
      })
      return newSelected
    })
  }

  const handleAddSelected = () => {
    // Group selected variants by their original product ID
    const variantsByProduct = Object.values(selectedVariants).reduce(
      (acc, variant) => {
        const productId = variant.product_id
        if (!acc[productId]) {
          // Initialize Product structure using info from the first variant encountered
          acc[productId] = {
            localId: `sel-${productId}-${Date.now()}`, // Generate unique local ID for the new product row
            apiId: productId,
            title: variant.productTitle,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            image: { src: variant.productImageSrc } as any, // Assuming image is always present when selected
            variants: [],
            discountType: null,
            discountValue: null,
            showVariants: false,
            isPlaceholder: false,
          }
        }
        // Add the variant (ensure it has the required fields)
        acc[productId].variants.push({
          ...variant,
          // Ensure discount fields exist if not already added
          discountType: variant.discountType ?? null,
          discountValue: variant.discountValue ?? null,
        })
        return acc
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<number, any>
    ) // Use 'any' temporarily, refine type if needed

    onSelectProducts(Object.values(variantsByProduct))
    onClose()
  }

  const totalSelectedCount = Object.keys(selectedVariants).length

  console.log('Products: ', products)

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/30" />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white text-left align-middle shadow-xl transition-all">
                <DialogTitle
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 p-4 border-b flex justify-between items-center"
                >
                  Select Products
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </DialogTitle>
                <div className="p-4">
                  {/* Search Bar */}
                  <div className="relative mb-4">
                    <input
                      type="text"
                      placeholder="Search product..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      className="w-full p-2 pl-10 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>

                  {/* Product List Area */}
                  <div className="max-h-[50vh] overflow-y-auto pr-2">
                    {' '}
                    {/* Scrollable Area */}
                    {error && (
                      <p className="text-red-500 text-center">{error}</p>
                    )}
                    {!isLoading &&
                      products.length === 0 &&
                      !error &&
                      debouncedSearchTerm && (
                        <p className="text-gray-500 text-center">
                          No products found for "{debouncedSearchTerm}".
                        </p>
                      )}
                    {!isLoading &&
                      products.length === 0 &&
                      !error &&
                      !debouncedSearchTerm && (
                        <p className="text-gray-500 text-center">
                          Start typing to search for products.
                        </p>
                      )}
                    {products.map((product) => (
                      <div key={product.id} className="mb-3 border rounded p-2">
                        {/* Product Header */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <img
                              src={product.image?.src}
                              alt={product.title}
                              className="w-8 h-8 object-cover rounded border"
                              onError={(e) =>
                                (e.currentTarget.src =
                                  'https://via.placeholder.com/32')
                              }
                            />
                            <span className="font-medium text-sm">
                              {product.title}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              handleSelectAllProductVariants(product)
                            }
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
                            title={`Select all variants for ${product.title}`}
                          >
                            Select All
                          </button>
                        </div>
                        {/* Variant List */}
                        <div className="space-y-1 pl-4">
                          {product.variants.map((variant) => {
                            const localVariantId = `${variant.product_id}-${variant.id}`
                            const isSelected =
                              !!selectedVariants[localVariantId]
                            return (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between cursor-pointer p-1 rounded hover:bg-gray-100"
                                onClick={() =>
                                  handleVariantSelectToggle(variant, product)
                                }
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="w-5 h-5">
                                    {' '}
                                    {/* Checkbox area */}
                                    {isSelected && (
                                      <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    )}
                                    {!isSelected && (
                                      <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                                    )}
                                  </div>
                                  <span className="text-sm text-gray-700">
                                    {variant.title}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  ${variant.price}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                    {/* Loader / End of List Indicator */}
                    <div
                      ref={lastElementRef}
                      className="h-10 flex items-center justify-center"
                    >
                      {isLoading && (
                        <p className="text-gray-500 text-sm">Loading more...</p>
                      )}
                      {!isLoading && !hasMore && products.length > 0 && (
                        <p className="text-gray-500 text-sm">End of results.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer with Actions */}
                <div className="flex justify-between items-center p-4 border-t bg-gray-50">
                  <span className="text-sm text-gray-600">
                    {totalSelectedCount} variant(s) selected
                  </span>
                  <div>
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddSelected}
                      disabled={totalSelectedCount === 0}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}

export default ProductPicker
