import { Search, Sparkles, Home, MapPin, Cpu } from "lucide-react";

export default function Hero({ count }: { count: number }) {
  return (
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-50 text-black/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5 fill-black/80" />
          AI-Powered Recommendations
        </div>

        {/* Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Find Your Perfect
          <span className="text-black/70"> Property</span>
        </h1>

        <p className="text-gray-500 text-lg max-w-xl mx-auto mb-10">
          Browse {count}+ properties across India. Our AI learns what you like
          and shows you similar homes automatically.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              placeholder="Search by location, type, or keyword..."
              className="bg-transparent w-full text-sm text-gray-700 placeholder-gray-400 outline-none"
            />
          </div>
          <button className="bg-black/80 hover:bg-black text-white text-sm font-medium px-6 py-3 rounded-xl transition-colors shrink-0 flex items-center justify-center gap-2">
            Search
          </button>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap items-center justify-center gap-8 mt-12">
          {[
            { value: `${count}+`, label: 'Properties', icon: Home },
            { value: '12+', label: 'Cities', icon: MapPin },
            { value: 'AI', label: 'Powered Search', icon: Cpu },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center">
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4 text-black/80" />
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
