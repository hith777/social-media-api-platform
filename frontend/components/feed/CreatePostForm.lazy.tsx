import dynamic from 'next/dynamic'

export const CreatePostForm = dynamic(
  () => import('./CreatePostForm').then((mod) => ({ default: mod.CreatePostForm })),
  {
    loading: () => (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false,
  }
)

