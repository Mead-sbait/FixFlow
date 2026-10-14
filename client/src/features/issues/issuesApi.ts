import type { TechnicianComment } from '../technician/technician.types'
import { api } from '../../lib/api'
import type { Category, NewIssue, UserIssue } from './issue.types'

function withToken(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } }
}

export async function getMyIssues(token: string) {
  const response = await api.get<UserIssue[]>('/issues', withToken(token))
  return response.data
}

export async function getMyIssue(token: string, issueId: string) {
  const response = await api.get<UserIssue>(`/issues/${issueId}`, withToken(token))
  return response.data
}

export async function createIssue(token: string, data: NewIssue) {
  const response = await api.post<UserIssue>('/issues', data, withToken(token))
  return response.data
}

export async function getCategories(token: string) {
  const response = await api.get<Category[]>('/categories', withToken(token))
  return response.data
}

export async function getUserComments(token: string, issueId: string) {
  const response = await api.get<TechnicianComment[]>(`/issues/${issueId}/comments`, withToken(token))
  return response.data
}

export async function createUserComment(token: string, issueId: string, message: string) {
  const response = await api.post<TechnicianComment>(`/issues/${issueId}/comments`, { message }, withToken(token))
  return response.data
}
