const Loading = () => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white">
      <div className="relative flex flex-col items-center justify-center">
        <div className="h-12 w-12 sm:h-16 sm:w-16 animate-spin rounded-full border-2 sm:border-4 border-gray-200 border-t-[#caa446]"></div>
        <span className="mt-2 text-xs sm:text-sm font-medium">loading...</span>
      </div>
    </div>
  )
}

export default Loading;