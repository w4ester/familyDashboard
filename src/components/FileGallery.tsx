import React, { useState, useEffect, useRef } from 'react';

interface FileEntry {
  id: number;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  person?: string;
  category?: string;
  tags?: string[];
  notes?: string;
  dateAdded: string;
}

interface FileGalleryProps {
  familyMembers: string[];
}

const FileGallery: React.FC<FileGalleryProps> = ({ familyMembers }) => {
  // State for storing file entries
  const [files, setFiles] = useState<FileEntry[]>([]);
  
  // States for form inputs
  const [personName, setPersonName] = useState('');
  const [fileCategory, setFileCategory] = useState('');
  const [fileTags, setFileTags] = useState('');
  const [fileNotes, setFileNotes] = useState('');
  
  // State for drag and drop functionality
  const [isDragging, setIsDragging] = useState(false);
  
  // State for filtering files
  const [filterPerson, setFilterPerson] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Ref for file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Common file categories
  const fileCategories = [
    'School Documents',
    'Artwork',
    'Certificates',
    'Homework',
    'Projects',
    'Photos',
    'Medical',
    'Important Documents',
    'Other'
  ];
  
  // Load data from localStorage when component mounts
  useEffect(() => {
    const savedFiles = localStorage.getItem('familyFiles');
    
    if (savedFiles) {
      setFiles(JSON.parse(savedFiles));
    }
  }, []);
  
  // Save data to localStorage whenever files change
  useEffect(() => {
    localStorage.setItem('familyFiles', JSON.stringify(files));
  }, [files]);
  
  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    processFiles(selectedFiles);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Process files for storage
  const processFiles = (selectedFiles: FileList) => {
    Array.from(selectedFiles).forEach(file => {
      const reader = new FileReader();
      
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result as string;
        
        // Create file entry
        const newFile: FileEntry = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: result,
          person: personName || undefined,
          category: fileCategory || 'Other',
          tags: fileTags ? fileTags.split(',').map(tag => tag.trim()) : undefined,
          notes: fileNotes || undefined,
          dateAdded: new Date().toISOString()
        };
        
        setFiles(prevFiles => [...prevFiles, newFile]);
      };
      
      // Read the file as Data URL (base64)
      reader.readAsDataURL(file);
    });
  };
  
  // Handle drag events
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length === 0) return;
    
    processFiles(droppedFiles);
  };
  
  // Open file input dialog
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Delete a file entry
  const deleteFile = (id: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      setFiles(files.filter(file => file.id !== id));
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString();
  };
  
  // Get unique categories from files
  const getUniqueCategories = () => {
    const categories = new Set<string>();
    files.forEach(file => {
      if (file.category) {
        categories.add(file.category);
      }
    });
    return Array.from(categories).sort();
  };
  
  // Get unique tags from files
  const getUniqueTags = () => {
    const tags = new Set<string>();
    files.forEach(file => {
      if (file.tags) {
        file.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  };
  
  // Check if a file is an image
  const isImage = (type: string): boolean => {
    return type.startsWith('image/');
  };
  
  // Check if a file is a document
  const isDocument = (type: string): boolean => {
    return type.includes('pdf') || type.includes('word') || type.includes('excel') || 
           type.includes('powerpoint') || type.includes('text');
  };
  
  // Get appropriate icon for file type
  const getFileIcon = (type: string): string => {
    if (isImage(type)) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel')) return '📊';
    if (type.includes('powerpoint')) return '📑';
    if (type.includes('text')) return '📃';
    if (type.includes('audio')) return '🎵';
    if (type.includes('video')) return '🎬';
    return '📁';
  };
  
  // Filter files based on person, category, tag, and search query
  const getFilteredFiles = () => {
    return files.filter(file => {
      // Filter by person if specified
      if (filterPerson && file.person !== filterPerson) {
        return false;
      }
      
      // Filter by category if specified
      if (filterCategory && file.category !== filterCategory) {
        return false;
      }
      
      // Filter by tag if specified
      if (filterTag && (!file.tags || !file.tags.includes(filterTag))) {
        return false;
      }
      
      // Filter by search query if specified
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = file.name.toLowerCase().includes(query);
        const categoryMatch = file.category ? file.category.toLowerCase().includes(query) : false;
        const tagsMatch = file.tags ? file.tags.some(tag => tag.toLowerCase().includes(query)) : false;
        const notesMatch = file.notes ? file.notes.toLowerCase().includes(query) : false;
        
        if (!(nameMatch || categoryMatch || tagsMatch || notesMatch)) {
          return false;
        }
      }
      
      return true;
    });
  };
  
  // Clear all filters
  const clearFilters = () => {
    setFilterPerson('');
    setFilterCategory('');
    setFilterTag('');
    setSearchQuery('');
  };
  
  // Clear the form inputs
  const clearForm = () => {
    setPersonName('');
    setFileCategory('');
    setFileTags('');
    setFileNotes('');
  };
  
  // Check if there are any active filters
  const hasActiveFilters = (): boolean => {
    return !!(filterPerson || filterCategory || filterTag || searchQuery);
  };
  
  return (
    <div>
      {/* File Upload Area */}
      <div className="bg-amber-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">Upload Files</h2>
        
        <div 
          className={`border-2 border-dashed rounded-lg p-6 mb-4 text-center transition-colors
            ${isDragging ? 'border-amber-500 bg-amber-100' : 'border-gray-300 hover:border-amber-400'}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            multiple
          />
          <div className="text-4xl mb-2">📁</div>
          <p className="font-medium">{isDragging ? 'Drop files here' : 'Drag & drop files here, or click to browse'}</p>
          <p className="text-gray-500 text-sm mt-1">Upload documents, images, and more</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Associate with (optional)</label>
            <select
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Person --</option>
              {familyMembers.map((member, index) => (
                <option key={index} value={member}>{member}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category (optional)</label>
            <select
              value={fileCategory}
              onChange={(e) => setFileCategory(e.target.value)}
              className="w-full p-2 border rounded"
            >
              <option value="">-- Select Category --</option>
              {fileCategories.map((category, index) => (
                <option key={index} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tags (optional, comma-separated)</label>
            <input
              type="text"
              placeholder="homework, report, art"
              value={fileTags}
              onChange={(e) => setFileTags(e.target.value)}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Notes (optional)</label>
            <textarea
              placeholder="Any additional information..."
              value={fileNotes}
              onChange={(e) => setFileNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={2}
            ></textarea>
          </div>
        </div>
      </div>
      
      {/* Files Gallery */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-lg font-semibold">File Gallery</h2>
          
          <div className="flex flex-col sm:flex-row gap-2">
            {/* Search input */}
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="p-2 border rounded"
            />
            
            {/* Filter by person */}
            <select
              onChange={(e) => setFilterPerson(e.target.value)}
              value={filterPerson}
              className="p-2 border rounded"
            >
              <option value="">All People</option>
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
            
            {/* Filter by tag */}
            <select
              onChange={(e) => setFilterTag(e.target.value)}
              value={filterTag}
              className="p-2 border rounded"
            >
              <option value="">All Tags</option>
              {getUniqueTags().map((tag, index) => (
                <option key={index} value={tag}>{tag}</option>
              ))}
            </select>
            
            {/* Clear filters button */}
            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="text-amber-600 hover:text-amber-800 text-sm whitespace-nowrap px-2 py-1 border border-amber-300 rounded"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {files.length === 0 ? (
          <p className="text-gray-500 italic">No files uploaded yet. Use the form above to add your first file!</p>
        ) : getFilteredFiles().length === 0 ? (
          <p className="text-gray-500 italic">No files match your search criteria. Try adjusting your filters.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {getFilteredFiles().map(file => (
              <div key={file.id} className="bg-white rounded-lg shadow-sm border overflow-hidden">
                {/* File preview */}
                <div className="h-40 bg-gray-100 flex items-center justify-center">
                  {isImage(file.type) ? (
                    <img 
                      src={file.dataUrl} 
                      alt={file.name} 
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <div className="text-5xl">{getFileIcon(file.type)}</div>
                  )}
                </div>
                
                {/* File information */}
                <div className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-sm truncate" title={file.name}>
                      {file.name}
                    </h3>
                    <button 
                      onClick={() => deleteFile(file.id)}
                      className="text-red-500 hover:text-red-700 text-sm ml-1"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-1">
                    {formatFileSize(file.size)} • {formatDate(file.dateAdded)}
                  </div>
                  
                  {file.person && (
                    <div className="text-xs text-gray-600 mb-1">
                      Associated with: <span className="font-medium">{file.person}</span>
                    </div>
                  )}
                  
                  {file.category && (
                    <div className="mb-1">
                      <span className="inline-block text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                        {file.category}
                      </span>
                    </div>
                  )}
                  
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-1">
                      {file.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {file.notes && (
                    <div className="text-xs text-gray-600 mt-1">
                      <div className="font-medium">Notes:</div>
                      <div className="truncate" title={file.notes}>{file.notes}</div>
                    </div>
                  )}
                  
                  {/* Download and view buttons */}
                  <div className="flex justify-between mt-2">
                    <a 
                      href={file.dataUrl} 
                      download={file.name}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Download
                    </a>
                    <a 
                      href={file.dataUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileGallery;