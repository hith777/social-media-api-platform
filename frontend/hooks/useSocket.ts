'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Socket } from 'socket.io-client'
import { getSocket, disconnectSocket, reconnectSocket } from '@/lib/socket'
import { useAuthStore } from '@/stores/authStore'

interface UseSocketOptions {
  autoConnect?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  onError?: (error: Error) => void
}

interface UseSocketReturn {
  socket: Socket | null
  isConnected: boolean
  isConnecting: boolean
  error: Error | null
  connect: () => void
  disconnect: () => void
  emit: (event: string, data?: any) => void
  on: (event: string, callback: (...args: any[]) => void) => void
  off: (event: string, callback?: (...args: any[]) => void) => void
}

export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = true, onConnect, onDisconnect, onError } = options
  const { isAuthenticated, accessToken } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const callbacksRef = useRef<Map<string, Set<(...args: any[]) => void>>>(new Map())

  const connect = useCallback(() => {
    if (!isAuthenticated || !accessToken) {
      return
    }

    if (socketRef.current?.connected) {
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const newSocket = getSocket()
      if (!newSocket) {
        throw new Error('Failed to initialize socket')
      }

      socketRef.current = newSocket
      setSocket(newSocket)

      // Set up connection handlers
      newSocket.on('connect', () => {
        setIsConnected(true)
        setIsConnecting(false)
        onConnect?.()
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
        setIsConnecting(false)
        onDisconnect?.()
      })

      newSocket.on('connect_error', (err) => {
        setIsConnecting(false)
        const error = new Error(err.message || 'Socket connection failed')
        setError(error)
        onError?.(error)
      })

      // Re-register all event listeners
      callbacksRef.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          newSocket.on(event, callback)
        })
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect socket')
      setError(error)
      setIsConnecting(false)
      onError?.(error)
    }
  }, [isAuthenticated, accessToken, onConnect, onDisconnect, onError])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      // Remove all event listeners
      callbacksRef.current.forEach((callbacks, event) => {
        callbacks.forEach((callback) => {
          socketRef.current?.off(event, callback)
        })
      })
      callbacksRef.current.clear()

      disconnectSocket()
      socketRef.current = null
      setSocket(null)
      setIsConnected(false)
      setIsConnecting(false)
    }
  }, [])

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    } else {
      console.warn(`Cannot emit ${event}: socket not connected`)
    }
  }, [])

  const on = useCallback((event: string, callback: (...args: any[]) => void) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set())
    }
    callbacksRef.current.get(event)!.add(callback)

    if (socketRef.current) {
      socketRef.current.on(event, callback)
    }
  }, [])

  const off = useCallback((event: string, callback?: (...args: any[]) => void) => {
    if (callback) {
      callbacksRef.current.get(event)?.delete(callback)
      socketRef.current?.off(event, callback)
    } else {
      callbacksRef.current.delete(event)
      socketRef.current?.off(event)
    }
  }, [])

  // Auto-connect when authenticated
  useEffect(() => {
    if (autoConnect && isAuthenticated && accessToken) {
      connect()
    }

    return () => {
      if (!autoConnect) {
        disconnect()
      }
    }
  }, [autoConnect, isAuthenticated, accessToken, connect, disconnect])

  // Reconnect when token changes
  useEffect(() => {
    if (isAuthenticated && accessToken && socketRef.current) {
      reconnectSocket()
      connect()
    }
  }, [accessToken, isAuthenticated, connect])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect()
    }
  }, [disconnect])

  return {
    socket,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    emit,
    on,
    off,
  }
}

