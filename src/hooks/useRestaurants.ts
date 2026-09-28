import { useContext } from 'react'
import { RestaurantsContext } from '../context/RestaurantsContext'

export function useRestaurants() {
  const ctx = useContext(RestaurantsContext)
  if (!ctx) throw new Error('useRestaurants must be used within RestaurantsProvider')
  return ctx
}

export function useRestaurant(slug: string | undefined) {
  const { getBySlug, loading } = useRestaurants()
  return { restaurant: slug ? getBySlug(slug) : undefined, loading }
}
