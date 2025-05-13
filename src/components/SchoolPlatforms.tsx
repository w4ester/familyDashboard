import React, { useState, useEffect } from 'react';

interface PlatformEntry {
  id: number;
  person: string;
  platformName: string;
  url: string;
  username?: string;
  category: string;
  notes?: string;
}

interface SchoolPlatformsProps {
  familyMembers: string[];
}

const SchoolPlatforms: React.FC<SchoolPlatformsProps> = ({ familyMembers }) => {
  // State for storing platform entries
  const [platforms, setPlatforms] = useState<PlatformEntry[]>([]);
  
  // States for form inputs
  const [personName, setPersonName] = useState('');
  const [platformName, setPlatformName] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [platformUsername, setPlatformUsername] = useState('');
  const [platformCategory, setPlatformCategory] = useState('');
  const [platformNotes, setPlatformNotes] = useState('');
  
  // State for filtering platforms
  const [filterPerson, setFilterPerson] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  
  // Common platform categories
  const platformCategories = [
    'Learning Management',
    'Math',
    'Reading',
    'Science',
    'Languages',
    'Art',
    'Music',
    'Assessment',
    'Communication',
    'Other'
  ];
  
  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedPlatforms = localStorage.getItem('schoolPlatforms');
    
    if (savedPlatforms) {
      setPlatforms(JSON.parse(savedPlatforms));
    }
  }, []);
  
  // Save data to localStorage whenever platforms change
  useEffect(() => {
    localStorage.setItem('schoolPlatforms', JSON.stringify(platforms));
  }, [platforms]);
  
  // Handle platform form submission
  const handlePlatformSubmit = () => {
    if (personName.trim() === '' || platformName.trim() === '' || platformUrl.trim() === '') {
      alert('Please enter a name, platform name, and URL!');
      return;
    }
    
    // Create new platform entry
    const newPlatform: PlatformEntry = {
      id: Date.now(),
      person: personName.trim(),
      platformName: platformName.trim(),
      url: platformUrl.trim(),
      category: platformCategory || 'Other',
      username: platformUsername.trim() || undefined,
      notes: platformNotes.trim() || undefined
    };
    
    // Add the new entry to the list
    setPlatforms([...platforms, newPlatform]);
    
    // Clear the form
    clearForm();
  };
  
  // Clear the form inputs
  const clearForm = () => {
    setPlatformName('');
    setPlatformUrl('');
    setPlatformUsername('');
    setPlatformNotes('');
  };
  
  // Delete a platform entry
  const deletePlatform = (id: number) => {
    if (window.confirm('Are you sure you want to delete this platform?')) {
      setPlatforms(platforms.filter(platform => platform.id !== id));
    }
  };
  
  // Get unique categories from platforms
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    platforms.forEach(platform => {
      categories.add(platform.category);
    });
    return Array.from(categories).sort();
  };
  
  // Filter platforms based on person and category
  const getFilteredPlatforms = () => {
    return platforms.filter(platform => {
      // Filter by person if specified
      if (filterPerson && platform.person !== filterPerson) {
        return false;
      }
      
      // Filter by category if specified
      if (filterCategory && platform.category !== filterCategory) {
        return false;
      }
      
      return true;
    });
  };
  
  // Group platforms by person
  const getPlatformsByPerson = () => {
    const result: Record<string, PlatformEntry[]> = {};
    
    getFilteredPlatforms().forEach(platform => {
      if (!result[platform.person]) {
        result[platform.person] = [];
      }
      
      result[platform.person].push(platform);
    });
    
    return result;
  };
  
  // Check if URL is valid
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  // Format URL for display (removing http/https)
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.host + urlObj.pathname;
    } catch (e) {
      return url;
    }
  };
  
  return (
    <div>
      {/* Add new platform form */}
      <div className="bg-green-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Add School Platform</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Student</label>
            <select
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Student --</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select
              value={platformCategory}
              onChange={(e) => setPlatformCategory(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Category --</option>
              {platformCategories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Platform Name</label>
            <input
              type="text"
              placeholder="Google Classroom, Khan Academy, etc."
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              className={`w-full p-2 border rounded ${
                platformUrl && !isValidUrl(platformUrl) ? 'border-red-500' : ''
              }`}
            />
            {platformUrl && !isValidUrl(platformUrl) && (
              <p className="text-red-500 text-xs mt-1">Please enter a valid URL (including http:// or https://)</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Username (optional)</label>
            <input
              type="text"
              placeholder="Username or login ID"
              value={platformUsername}
              onChange={(e) => setPlatformUsername(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              placeholder="Any additional information..."
              value={platformNotes}
              onChange={(e) => setPlatformNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={3}
            ></textarea>
          </div>
        </div>
        <button 
          onClick={handlePlatformSubmit} 
          className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
          disabled={!personName || !platformName || !platformUrl || !isValidUrl(platformUrl)}
        >
          Add Platform
        </button>
      </div>

      {/* Platform List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">School Platforms</h2>
          
          <div className="flex gap-2">
            {/* Filter by person */}
            <select
              onChange={(e) => setFilterPerson(e.target.value)}
              value={filterPerson}
              className="p-2 border rounded"
            >
              <option value="">All Students</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
            
            {/* Filter by category */}
            <select
              onChange={(e) => setFilterCategory(e.target.value)}
              value={filterCategory}
              className="p-2 border rounded"
            >
              <option value="">All Categories</option>
              {getUniqueCategories().map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
        
        {Object.entries(getPlatformsByPerson()).length === 0 ? (
          <p className="text-gray-500 italic">No platforms added yet. Add your first platform above!</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(getPlatformsByPerson()).map(([person, personPlatforms]) => (
              <div key={person} className="bg-white rounded-lg shadow-sm border">
                <div className="bg-green-50 px-4 py-3 rounded-t-lg border-b">
                  <h3 className="font-semibold">{person}'s Platforms</h3>
                </div>
                <div className="divide-y">
                  {personPlatforms.map(platform => (
                    <div key={platform.id} className="p-4 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <h4 className="font-medium">{platform.platformName}</h4>
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded ml-2">
                            {platform.category}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div>
                            <a 
                              href={platform.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                              {formatUrl(platform.url)}
                            </a>
                          </div>
                          
                          {platform.username && (
                            <div className="text-gray-600">
                              <span className="font-medium">Username:</span> {platform.username}
                            </div>
                          )}
                          
                          {platform.notes && (
                            <div className="text-gray-600">
                              <span className="font-medium">Notes:</span> {platform.notes}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mt-3 sm:mt-0">
                        <button 
                          onClick={() => deletePlatform(platform.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolPlatforms;