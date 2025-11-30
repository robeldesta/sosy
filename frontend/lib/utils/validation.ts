/**
 * Client-side validation utilities
 */

export interface ValidationError {
  field: string
  message: string
}

export function validatePhone(phone: string): string | null {
  if (!phone) return null
  
  // Remove spaces, dashes, and plus signs
  const cleaned = phone.replace(/[\s\-+]/g, '')
  
  // Ethiopian phone: 9 digits after country code
  // Accept: 9 digits, or 9 digits with 251 prefix
  if (cleaned.startsWith('251')) {
    if (cleaned.length !== 12) {
      return 'Phone must be 9 digits after country code'
    }
  } else if (cleaned.length !== 9) {
    return 'Phone must be 9 digits'
  }
  
  if (!/^\d+$/.test(cleaned)) {
    return 'Phone must contain only numbers'
  }
  
  return null
}

export function validateEmail(email: string): string | null {
  if (!email) return null
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return 'Invalid email address'
  }
  
  return null
}

export function validateRequired(value: any, fieldName: string): string | null {
  if (value === null || value === undefined || value === '') {
    return `${fieldName} is required`
  }
  
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} cannot be empty`
  }
  
  return null
}

export function validatePositiveNumber(value: number, fieldName: string): string | null {
  if (value === null || value === undefined || isNaN(value)) {
    return `${fieldName} must be a number`
  }
  
  if (value < 0) {
    return `${fieldName} must be greater than or equal to 0`
  }
  
  return null
}

export function validateGreaterThanZero(value: number, fieldName: string): string | null {
  const positiveError = validatePositiveNumber(value, fieldName)
  if (positiveError) return positiveError
  
  if (value <= 0) {
    return `${fieldName} must be greater than 0`
  }
  
  return null
}

export function validateInvoiceItems(items: Array<{ product_id: number; quantity: number; unit_price: number }>): string | null {
  if (!items || items.length === 0) {
    return 'Invoice must have at least one item'
  }
  
  for (const item of items) {
    if (!item.product_id || item.product_id <= 0) {
      return 'All items must have a valid product'
    }
    
    if (!item.quantity || item.quantity <= 0) {
      return 'All items must have a quantity greater than 0'
    }
    
    if (!item.unit_price || item.unit_price <= 0) {
      return 'All items must have a price greater than 0'
    }
  }
  
  return null
}

