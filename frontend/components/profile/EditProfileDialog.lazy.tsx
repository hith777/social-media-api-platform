import dynamic from 'next/dynamic'

export const EditProfileDialog = dynamic(
  () => import('./EditProfileDialog').then((mod) => ({ default: mod.EditProfileDialog })),
  {
    loading: () => null,
    ssr: false,
  }
)

