export default function Home() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          PixelPin
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          The fastest visual feedback tool for modern teams
        </p>
        <div className="space-x-4">
          <a 
            href="/signup" 
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Get Started Free
          </a>
          <a 
            href="/signin" 
            className="bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300"
          >
            Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
