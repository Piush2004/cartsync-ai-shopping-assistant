import React from 'react';

interface ProfileEditorProps {
  preferences: any;
}

export default function ProfileEditor({ preferences }: ProfileEditorProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Style Preferences</h3>
      
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Brands</label>
          <div className="flex flex-wrap gap-2">
            {preferences.favorite_brands.map((brand: string) => (
              <span key={brand} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {brand}
              </span>
            ))}
            <button className="px-3 py-1 border border-dashed border-gray-300 text-gray-500 rounded-full text-sm font-medium hover:bg-gray-50">
              + Add
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Fit Preference</label>
          <select 
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            defaultValue={preferences.fit_preference}
          >
            <option value="slim">Slim</option>
            <option value="regular">Regular</option>
            <option value="relaxed">Relaxed</option>
            <option value="oversized">Oversized</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Budget (USD)</label>
          <div className="flex items-center gap-4">
            <input 
              type="number" 
              defaultValue={preferences.price_range.min} 
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
            />
            <span className="text-gray-500">to</span>
            <input 
              type="number" 
              defaultValue={preferences.price_range.max} 
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm py-2 px-3 border"
            />
          </div>
        </div>
        
        <button className="w-full bg-black text-white py-2 rounded-md font-medium hover:bg-gray-800 transition-colors">
          Save Preferences
        </button>
      </div>
    </div>
  );
}
