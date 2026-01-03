export default function OfflinePage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                {/* Offline Icon */}
                <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                    <svg
                        className="w-12 h-12 text-gray-400 dark:text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                        />
                    </svg>
                </div>

                {/* Message */}
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                    Bạn đang offline
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Không thể kết nối mạng. Một số tính năng có thể không khả dụng.
                </p>

                {/* Actions */}
                <div className="space-y-4">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                        Thử lại
                    </button>
                    <button
                        onClick={() => window.history.back()}
                        className="w-full py-3 px-4 bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-semibold rounded-xl hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
                    >
                        Quay lại
                    </button>
                </div>

                {/* Tips */}
                <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl text-left">
                    <p className="text-sm text-amber-800 dark:text-amber-200 font-medium mb-2">
                        Mẹo khi offline:
                    </p>
                    <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <li>• Dữ liệu đã xem trước đó có thể vẫn khả dụng</li>
                        <li>• Kiểm tra kết nối Wi-Fi hoặc dữ liệu di động</li>
                        <li>• Các thay đổi sẽ được đồng bộ khi online lại</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
