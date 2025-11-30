import { apiClient } from './client'

export interface StockTakeSession {
  id: number
  started_at: string
  completed_at: string | null
  status: 'open' | 'review' | 'approved' | 'cancelled'
  notes?: string
  total_items_counted: number
  total_differences: number
  total_loss_value: number
  total_gain_value: number
  lines?: StockTakeLine[]
}

export interface StockTakeLine {
  id: number
  product_id: number
  product_name: string
  expected_qty: number
  counted_qty: number | null
  difference: number
  difference_type: 'loss' | 'over' | 'match' | null
  difference_value: number
  counted_at: string | null
  notes?: string
}

export interface StockTakeCountRequest {
  lines: Array<{
    product_id: number
    counted_qty: number
    notes?: string
  }>
}

export interface StockTakeSummary {
  total_items: number
  items_counted: number
  items_uncounted: number
  losses_count: number
  overs_count: number
  matches_count: number
  total_loss_value: number
  total_gain_value: number
  net_difference: number
}

export interface ShrinkageReport {
  session_id: number
  session_date: string
  total_loss_value: number
  total_gain_value: number
  net_difference: number
  top_losses: Array<{
    product_id: number
    product_name: string
    expected_qty: number
    counted_qty: number
    difference: number
    difference_value: number
  }>
  top_overs: Array<{
    product_id: number
    product_name: string
    expected_qty: number
    counted_qty: number
    difference: number
    difference_value: number
  }>
  highest_variance: Array<{
    product_id: number
    product_name: string
    expected_qty: number
    counted_qty: number
    difference: number
    difference_value: number
  }>
  counted_by: string
  notes?: string
}

export const stockTakeApi = {
  // Start new stock take session
  async start(notes?: string, branchId?: number): Promise<StockTakeSession> {
    const response = await apiClient.post<StockTakeSession>('/stocktake/start', {
      notes,
      branch_id: branchId,
    })
    return response.data
  },

  // Add counts to session
  async addCounts(sessionId: number, counts: StockTakeCountRequest): Promise<any> {
    const response = await apiClient.post(`/stocktake/session/${sessionId}/count`, counts)
    return response.data
  },

  // Mark session for review
  async markForReview(sessionId: number): Promise<any> {
    const response = await apiClient.post(`/stocktake/session/${sessionId}/review`)
    return response.data
  },

  // Approve session
  async approve(sessionId: number, notes?: string): Promise<any> {
    const response = await apiClient.post(`/stocktake/session/${sessionId}/approve`, {
      notes,
    })
    return response.data
  },

  // Get session details
  async getSession(sessionId: number): Promise<StockTakeSession> {
    const response = await apiClient.get<StockTakeSession>(`/stocktake/session/${sessionId}`)
    return response.data
  },

  // Get summary
  async getSummary(sessionId: number): Promise<StockTakeSummary> {
    const response = await apiClient.get<StockTakeSummary>(`/stocktake/session/${sessionId}/summary`)
    return response.data
  },

  // Get shrinkage report
  async getReport(sessionId: number): Promise<ShrinkageReport> {
    const response = await apiClient.get<ShrinkageReport>(`/stocktake/session/${sessionId}/report`)
    return response.data
  },

  // List sessions
  async listSessions(status?: string): Promise<StockTakeSession[]> {
    const response = await apiClient.get<StockTakeSession[]>('/stocktake/sessions', {
      params: status ? { status } : {},
    })
    return response.data
  },
}

