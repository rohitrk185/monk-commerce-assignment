import {
  useState,
  useEffect,
  Fragment,
  FC,
  ChangeEvent,
  useMemo,
  useCallback,
  memo,
} from 'react'
import { VariableSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
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
import type { ApiProduct, ApiVariant, SelectedVariantInfo } from '../types'

interface RowData {
  products: ApiProduct[]
  selectedVariants: Record<string, SelectedVariantInfo>
  toggleVariantSelection: (variant: ApiVariant, product: ApiProduct) => void
  selectAllProductVariants: (product: ApiProduct) => void
  hasMore: boolean
  itemCount: number
}

// Row component
const Row = memo(
  ({
    index,
    style,
    data,
  }: {
    index: number
    style: React.CSSProperties
    data: RowData
  }) => {
    const {
      products,
      selectedVariants,
      toggleVariantSelection,
      selectAllProductVariants,
      hasMore,
      itemCount,
    } = data

    if (hasMore && index === itemCount - 1) {
      return (
        <div
          style={style}
          className="flex items-center justify-center text-gray-500 text-sm"
        >
          Loading more...
        </div>
      )
    }

    //  Find the corresponding Product or Variant for the index
    let cumulativeCount = 0
    let item:
      | { type: 'product'; product: ApiProduct }
      | { type: 'variant'; variant: ApiVariant; product: ApiProduct }
      | null = null

    for (const product of products) {
      // Check if index is the header
      if (index === cumulativeCount) {
        item = { type: 'product', product: product }
        break
      }
      cumulativeCount += 1 // Account for header

      // Check if index is one of the variants
      const variantIndex = index - cumulativeCount
      if (variantIndex >= 0 && variantIndex < product.variants.length) {
        item = {
          type: 'variant',
          variant: product.variants[variantIndex],
          product: product,
        }
        break
      }
      cumulativeCount += product.variants.length // Account for variants
    }

    if (!item) {
      console.warn('Row: Could not find item for index', index)
      return <div style={style}>Error: Item not found</div>
    }

    return (
      <div style={style}>
        {/* Render Product Header */}
        {item.type === 'product' && (
          <div
            className="flex items-center justify-between p-2 border-b border-gray-200 h-full bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors duration-150"
            onClick={() => selectAllProductVariants(item.product)}
            title={`Click to select/deselect all variants for ${item.product.title}`}
          >
            {/* Left side (Image and Title) */}
            <div className="flex items-center space-x-2 overflow-hidden">
              <img
                src={item.product.image?.src}
                alt={item.product.title}
                className="w-8 h-8 object-cover rounded border flex-shrink-0"
                onError={(e) =>
                  (e.currentTarget.src = 'https://via.placeholder.com/32')
                }
              />
              <span className="font-medium text-sm truncate">
                {item.product.title}
              </span>
            </div>
          </div>
        )}

        {/* Render Variant Row */}
        {item.type === 'variant' && (
          <div className="flex items-center justify-between cursor-pointer p-2 pl-6 h-full hover:bg-gray-100 border-b border-gray-100">
            {' '}
            <div
              className="flex items-center space-x-2 overflow-hidden flex-grow"
              onClick={() => toggleVariantSelection(item.variant, item.product)}
            >
              <div className="w-5 h-5 flex-shrink-0">
                {selectedVariants[
                  `${item.variant.product_id}-${item.variant.id}`
                ] ? (
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                ) : (
                  <div className="w-4 h-4 border border-gray-400 rounded-full"></div>
                )}
              </div>
              <span className="text-sm text-gray-700 truncate">
                {item.variant.title}
              </span>
            </div>
            <span className="text-sm text-gray-500 flex-shrink-0 ml-2">
              ${item.variant.price}
            </span>
          </div>
        )}
      </div>
    )
  }
)
Row.displayName = 'VirtualizedRow'

interface ProductPickerProps {
  isOpen: boolean
  onClose: () => void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSelectProducts: (selectedProducts: any[]) => void
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
  >({})
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  const loadProducts = useCallback(
    async (term: string, currentPage: number, reset: boolean = false) => {
      if (isLoading || (!hasMore && !reset)) return
      setIsLoading(true)
      setError(null)
      try {
        const fetchedProducts = await fetchProductsApi(term, currentPage, 10)
        if (reset) {
          setProducts(fetchedProducts)
        } else {
          setProducts((prev) => [
            ...prev,
            ...fetchedProducts.filter(
              (fp) => !prev.some((p) => p.id === fp.id)
            ),
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
    },
    [hasMore, isLoading]
  )

  // Effect for initial load and search term changes
  useEffect(() => {
    // Reset everything
    setProducts([])
    setPage(1)
    setHasMore(true)
    setSelectedVariants({})
    loadProducts(debouncedSearchTerm, 1, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm])

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
    setSelectedVariants((prevSelected) => {
      const allVariantIds = product.variants.map(
        (v) => `${v.product_id}-${v.id}`
      )

      // Check if every variant ID for this product exists in the current selection
      const areAllSelected = allVariantIds.every((id) => !!prevSelected[id])

      const newSelected = { ...prevSelected } // Create a mutable copy

      if (areAllSelected) {
        //  DESELECT ALL
        // If all are currently selected, remove them from the new selection object
        allVariantIds.forEach((id) => {
          delete newSelected[id]
        })
        // console.log(`Deselecting all variants for product ${product.id}`)
      } else {
        //  SELECT ALL
        // If not all are selected, add/overwrite all variants for this product
        product.variants.forEach((variant) => {
          const localVariantId = `${variant.product_id}-${variant.id}`
          newSelected[localVariantId] = {
            ...(variant as SelectedVariantInfo), // Use existing variant data
            localId: localVariantId,
            productTitle: product.title,
            productImageSrc: product.image?.src,
            // Ensure discount fields are initialized/preserved if needed
            discountType: prevSelected[localVariantId]?.discountType ?? null,
            discountValue: prevSelected[localVariantId]?.discountValue ?? null,
          }
        })
        // console.log(`Selecting all variants for product ${product.id}`)
      }

      return newSelected // Return the updated selection state
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
        // Add the variant
        acc[productId].variants.push({
          ...variant,
          // Ensure discount fields exist if not already added
          discountType: variant.discountType ?? null,
          discountValue: variant.discountValue ?? null,
        })
        return acc
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      {} as Record<number, any>
    )

    onSelectProducts(Object.values(variantsByProduct))
    onClose()
  }

  const totalSelectedCount = Object.keys(selectedVariants).length

  const PRODUCT_HEADER_HEIGHT = 56
  const VARIANT_ROW_HEIGHT = 60
  const LOADER_HEIGHT = 50

  const { itemCount } = useMemo(() => {
    let count = 0
    const indices: number[] = [] // Store the starting index of each product in the virtual list
    products.forEach((product) => {
      indices.push(count) // The header starts at the current count
      count += 1 // Add 1 for the product header
      count += product.variants.length // Add count for variants
    })
    // Add 1 for the loader row if there are more items to load
    const finalCount = hasMore ? count + 1 : count
    return { itemCount: finalCount, productStartIndices: indices }
  }, [products, hasMore])

  const getItemSize = useCallback(
    (index: number): number => {
      // Check if it's the loader row (the very last item if hasMore is true)
      if (hasMore && index === itemCount - 1) {
        return LOADER_HEIGHT
      }

      // Iterate through products to find which item this index corresponds to
      let cumulativeCount = 0
      for (const product of products) {
        // Check if index is the header for this product
        if (index === cumulativeCount) {
          return PRODUCT_HEADER_HEIGHT
        }
        cumulativeCount += 1 // Account for the header

        // Check if index falls within the variants of this product
        if (index < cumulativeCount + product.variants.length) {
          return VARIANT_ROW_HEIGHT
        }
        cumulativeCount += product.variants.length // Account for variants
      }

      console.warn('getItemSize: Index out of bounds?', index)
      return VARIANT_ROW_HEIGHT
    },
    [products, hasMore, itemCount]
  )

  const handleVariantSelectToggleCallback = useCallback(
    (variant: ApiVariant, product: ApiProduct) => {
      handleVariantSelectToggle(variant, product)
    },
    []
  )

  const handleSelectAllProductVariantsCallback = useCallback(
    (product: ApiProduct) => {
      handleSelectAllProductVariants(product)
    },
    []
  )

  const isItemLoaded = (index: number) => !hasMore || index < itemCount - 1

  // Function for InfiniteLoader to trigger loading more items
  const loadMoreItems = useCallback(() => {
    if (isLoading || !hasMore) {
      // console.log('InfiniteLoader: Skipping loadMoreItems')
      return
    }
    // console.log('InfiniteLoader: Triggering loadMoreItems')
    return loadProducts(debouncedSearchTerm, page)
  }, [isLoading, hasMore, loadProducts, debouncedSearchTerm, page])

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
                  <div className="flex-grow h-[50vh] w-full overflow-hidden">
                    {' '}
                    {error && (
                      <p className="text-red-500 text-center p-4">{error}</p>
                    )}
                    {/* Empty/No Results States */}
                    {!isLoading &&
                      products.length === 0 &&
                      !error &&
                      debouncedSearchTerm && (
                        <p className="text-gray-500 text-center p-4">
                          No products found for "{debouncedSearchTerm}".
                        </p>
                      )}
                    {!isLoading &&
                      products.length === 0 &&
                      !error &&
                      !debouncedSearchTerm && (
                        <p className="text-gray-500 text-center p-4">
                          Start typing to search for products.
                        </p>
                      )}
                    {!error &&
                      (products.length > 0 || isLoading || hasMore) && (
                        <InfiniteLoader
                          isItemLoaded={isItemLoaded}
                          itemCount={itemCount}
                          loadMoreItems={loadMoreItems}
                          threshold={10} // Load when 10 items from the end are visible
                        >
                          {({ onItemsRendered, ref }) => (
                            <List
                              height={window.innerHeight * 0.5}
                              itemCount={itemCount}
                              itemSize={getItemSize}
                              width="100%"
                              onItemsRendered={onItemsRendered}
                              ref={ref}
                              itemData={{
                                products: products,
                                selectedVariants: selectedVariants,
                                toggleVariantSelection:
                                  handleVariantSelectToggleCallback,
                                selectAllProductVariants:
                                  handleSelectAllProductVariantsCallback,
                                hasMore: hasMore,
                                itemCount: itemCount,
                              }}
                              className="overflow-y-auto"
                              overscanCount={20}
                            >
                              {Row}
                            </List>
                          )}
                        </InfiniteLoader>
                      )}
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
