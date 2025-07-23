/**
 * Socket.IO client setup
 * Handles WebSocket connection for real-time features
 */

import { io, Socket } from 'socket.io-client'
import { env } from '@/config/env'
import { getAccessToken } from '@/utils/tokenManager'

let socket: Socket | null = null

/**
 * Initialize Socket.IO connection
 * Connects to the WebSocket server with authentication
 */
export function initializeSocket(): Socket | null {
  // Don't initialize if already connected
  if (socket?.connected) {
    return socket
  }

  // Don't initialize if no token (user not logged in)
  const token = getAccessToken()
  if (!token) {
    return null
  }

  try {
    socket = io(env.wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket.IO connected:', socket?.id)
      }
    })

    socket.on('disconnect', (reason) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Socket.IO disconnected:', reason)
      }
    })

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error)
    })

    return socket
  } catch (error) {
    console.error('Failed to initialize Socket.IO:', error)
    return null
  }
}

/**
 * Get current Socket.IO instance
 */
export function getSocket(): Socket | null {
  if (!socket || !socket.connected) {
    return initializeSocket()
  }
  return socket
}

/**
 * Disconnect Socket.IO
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

/**
 * Reconnect Socket.IO with new token
 */
export function reconnectSocket(): void {
  disconnectSocket()
  initializeSocket()
}

