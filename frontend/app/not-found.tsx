export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-muted-foreground mb-4">The page you're looking for doesn't exist.</p>
      <a
        href="/"
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
      >
        Go Home
      </a>
    </div>
  )
}

