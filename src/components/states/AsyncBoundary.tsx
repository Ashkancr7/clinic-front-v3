interface AsyncBoundaryProps {
  isLoading?: boolean;
  isError?: boolean;
  isEmpty?: boolean;
  hasAccess?: boolean;
  children: React.ReactNode;
}

export function AsyncBoundary({
  isLoading,
  isError,
  isEmpty,
  hasAccess = true,
  children,
}: AsyncBoundaryProps) {
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        شما به این بخش دسترسی ندارید.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400">در حال بارگذاری...</div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-danger">
        خطایی رخ داد. لطفاً دوباره تلاش کنید.
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        موردی برای نمایش وجود ندارد.
      </div>
    );
  }

  return <>{children}</>;
}
