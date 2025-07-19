import dynamic from 'next/dynamic'

export const PostDetailPage = dynamic(
  () => import('./PostDetailPage').then((mod) => ({ default: mod.PostDetailPage })),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    ),
  }
)

