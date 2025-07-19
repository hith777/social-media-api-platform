import dynamic from 'next/dynamic'

export const CommentList = dynamic(
  () => import('./CommentList').then((mod) => ({ default: mod.CommentList })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
)

