import React from 'react'
import { Text } from 'react-native'

// ── Activity config ────────────────────────────────────────────────────────

export const ACTIVITY_CONFIG: Record<
  string,
  { label: string; color: string; lightBg: string; lightBorder: string }
> = {
  restaurant: { label: 'Restaurant', color: '#f97316', lightBg: '#fff7ed', lightBorder: '#fed7aa' },
  attraction:  { label: 'Attraction', color: '#0ea5e9', lightBg: '#f0f9ff', lightBorder: '#bae6fd' },
  shopping:    { label: 'Shopping',   color: '#a855f7', lightBg: '#faf5ff', lightBorder: '#e9d5ff' },
  medical:     { label: 'Medical',    color: '#ef4444', lightBg: '#fef2f2', lightBorder: '#fecaca' },
}

// ── Transport config ───────────────────────────────────────────────────────

export const TRANSPORT_CONFIG: Record<
  string,
  { label: string; color: string; lightBg: string; lightBorder: string }
> = {
  flight: { label: 'Flight', color: '#3b82f6', lightBg: '#eff6ff', lightBorder: '#bfdbfe' },
  train:  { label: 'Train',  color: '#10b981', lightBg: '#f0fdf4', lightBorder: '#a7f3d0' },
  bus:    { label: 'Bus',    color: '#f59e0b', lightBg: '#fffbeb', lightBorder: '#fde68a' },
  ferry:  { label: 'Ferry',  color: '#06b6d4', lightBg: '#ecfeff', lightBorder: '#a5f3fc' },
  car:    { label: 'Car',    color: '#8b5cf6', lightBg: '#f5f3ff', lightBorder: '#ddd6fe' },
  other:  { label: 'Other',  color: '#6b7280', lightBg: '#f9fafb', lightBorder: '#e5e7eb' },
}

// ── Icon components (emoji-based for RN compatibility) ─────────────────────

export function ActivityIcon({
  type,
  size = 14,
  color,
}: {
  type: string
  size?: number
  color?: string
}) {
  const emojis: Record<string, string> = {
    restaurant: '🍴',
    attraction: '🏛',
    shopping: '🛍',
    medical: '🏥',
  }
  return <Text style={{ fontSize: size }}>{emojis[type] ?? '📍'}</Text>
}

export function BedIcon({
  size = 14,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return <Text style={{ fontSize: size }}>🛏</Text>
}

export function TransportIcon({
  type,
  size = 14,
  color = 'white',
}: {
  type: string
  size?: number
  color?: string
}) {
  const emojis: Record<string, string> = {
    flight: '✈️',
    train: '🚂',
    bus: '🚌',
    car: '🚗',
    ferry: '⛴',
    other: '🚐',
  }
  return <Text style={{ fontSize: size }}>{emojis[type] ?? '🚐'}</Text>
}

export function PlaneIcon({
  size = 14,
  color = 'currentColor',
}: {
  size?: number
  color?: string
}) {
  return <Text style={{ fontSize: size }}>✈️</Text>
}
