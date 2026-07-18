export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price_pence: number
  type: 'physical' | 'lesson'
  image: string
  active: boolean
  stock: number | null // null = not tracked (lessons); a number = finite inventory
}

export function isSoldOut(product: Product): boolean {
  return product.stock !== null && product.stock <= 0
}

// "Only N left" territory - low enough to nudge, high enough not to nag.
export function isLowStock(product: Product): boolean {
  return product.stock !== null && product.stock > 0 && product.stock <= 5
}

export type CartItem = {
  slug: string
  name: string
  price_pence: number
  quantity: number
  image: string
  type: 'physical' | 'lesson'
}

export type CartState = { items: CartItem[] }

export type CartAction =
  | { type: 'add'; item: Omit<CartItem, 'quantity'> }
  | { type: 'remove'; slug: string }
  | { type: 'setQuantity'; slug: string; quantity: number }
  | { type: 'clear' }
