export type Product = {
  id: string
  slug: string
  name: string
  description: string
  price_pence: number
  type: 'physical' | 'lesson'
  image: string
  active: boolean
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
