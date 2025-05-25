# 📸 File Gallery

## Overview
The File Gallery allows families to upload, view, and share photos, documents, and memories in a secure, organized way.

## Location in Codebase
- **Component**: `src/components/FileGallery.tsx`
- **Called from**: `src/components/FamilyDashboard.tsx` (when Gallery tab selected)
- **Storage**: `family-data/uploads/` directory

## Core Structure

### File Metadata
```typescript
interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  category?: string;
  tags?: string[];
}
```

## Component Implementation

### Main Gallery Component
```typescript
export default function FileGallery() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null);
  
  // Load files from storage
  useEffect(() => {
    loadFiles();
  }, []);
  
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/files/list');
      const fileList = await response.json();
      setFiles(fileList);
    } catch (error) {
      console.error('Error loading files:', error);
    }
  };
```

### File Upload
```typescript
const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // Validate file
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    alert('File too large. Maximum size is 10MB.');
    return;
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    alert('File type not supported.');
    return;
  }
  
  // Upload file
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadedBy', getCurrentUser());
  formData.append('category', selectedCategory);
  
  try {
    const response = await fetch('/api/files/upload', {
      method: 'POST',
      body: formData
    });
    
    if (response.ok) {
      const newFile = await response.json();
      setFiles([...files, newFile]);
      
      // Log activity
      activityLogger.log({
        user: getCurrentUser(),
        action: `Uploaded file: ${file.name}`,
        category: 'system',
        result: 'success',
        details: { fileName: file.name, fileSize: file.size }
      });
    }
  } catch (error) {
    console.error('Upload error:', error);
  }
};
```

### Gallery Views

#### Grid View
```typescript
const renderGridView = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {filteredFiles.map(file => (
      <div 
        key={file.id} 
        className="relative group cursor-pointer"
        onClick={() => setSelectedFile(file)}
      >
        {file.type.startsWith('image/') ? (
          <img 
            src={file.url} 
            alt={file.name}
            className="w-full h-48 object-cover rounded-lg"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-4xl">{getFileIcon(file.type)}</span>
          </div>
        )}
        
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 
                        text-white p-2 rounded-b-lg opacity-0 group-hover:opacity-100 
                        transition-opacity">
          <p className="truncate text-sm">{file.name}</p>
          <p className="text-xs">{formatFileSize(file.size)}</p>
        </div>
      </div>
    ))}
  </div>
);
```

#### List View
```typescript
const renderListView = () => (
  <div className="space-y-2">
    {filteredFiles.map(file => (
      <div 
        key={file.id}
        className="flex items-center p-3 bg-white rounded-lg border hover:shadow-md cursor-pointer"
        onClick={() => setSelectedFile(file)}
      >
        <div className="text-2xl mr-3">{getFileIcon(file.type)}</div>
        <div className="flex-1">
          <p className="font-medium">{file.name}</p>
          <p className="text-sm text-gray-600">
            {file.uploadedBy} • {formatDate(file.uploadedAt)} • {formatFileSize(file.size)}
          </p>
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            handleDownload(file);
          }}
          className="text-blue-500 hover:text-blue-700"
        >
          Download
        </button>
      </div>
    ))}
  </div>
);
```

### File Viewer Modal
```typescript
const FileViewerModal = ({ file, onClose }: { file: FileData; onClose: () => void }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">{file.name}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-4">
          {file.type.startsWith('image/') ? (
            <img src={file.url} alt={file.name} className="max-w-full" />
          ) : file.type === 'application/pdf' ? (
            <iframe src={file.url} className="w-full h-[60vh]" />
          ) : (
            <div className="text-center py-8">
              <span className="text-6xl">{getFileIcon(file.type)}</span>
              <p className="mt-4">Preview not available</p>
              <button 
                onClick={() => handleDownload(file)}
                className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              >
                Download File
              </button>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-gray-50">
          <p className="text-sm text-gray-600">
            Uploaded by {file.uploadedBy} on {formatDate(file.uploadedAt)}
          </p>
          {file.tags && file.tags.length > 0 && (
            <div className="mt-2">
              {file.tags.map(tag => (
                <span key={tag} className="inline-block bg-gray-200 px-2 py-1 rounded text-xs mr-2">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Features

### 1. Category Organization
```typescript
const categories = [
  { id: 'all', name: 'All Files', icon: '📁' },
  { id: 'photos', name: 'Photos', icon: '📸' },
  { id: 'documents', name: 'Documents', icon: '📄' },
  { id: 'artwork', name: 'Kids Artwork', icon: '🎨' },
  { id: 'schoolwork', name: 'School Work', icon: '📚' },
  { id: 'achievements', name: 'Achievements', icon: '🏆' }
];

// Filter by category
const filteredFiles = selectedCategory === 'all' 
  ? files 
  : files.filter(f => f.category === selectedCategory);
```

### 2. Search Functionality
```typescript
const [searchTerm, setSearchTerm] = useState('');

const searchFiles = files.filter(file => 
  file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  file.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
);
```

### 3. Bulk Actions
```typescript
const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

const handleBulkDelete = async () => {
  if (confirm(`Delete ${selectedFiles.length} files?`)) {
    for (const fileId of selectedFiles) {
      await deleteFile(fileId);
    }
    setSelectedFiles([]);
    loadFiles();
  }
};

const handleBulkDownload = () => {
  selectedFiles.forEach(fileId => {
    const file = files.find(f => f.id === fileId);
    if (file) handleDownload(file);
  });
};
```

### 4. Drag and Drop Upload
```typescript
const handleDrop = (e: React.DragEvent) => {
  e.preventDefault();
  const droppedFiles = Array.from(e.dataTransfer.files);
  droppedFiles.forEach(file => uploadFile(file));
};

<div 
  onDrop={handleDrop}
  onDragOver={(e) => e.preventDefault()}
  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center"
>
  <p>Drag files here or click to upload</p>
</div>
```

## File Management

### Storage Structure
```
family-data/
└── uploads/
    ├── photos/
    │   ├── 2024-12-photo1.jpg
    │   └── 2024-12-photo2.jpg
    ├── documents/
    │   └── report-card.pdf
    └── artwork/
        └── drawing1.png
```

### Security Features
```typescript
// File validation
const validateFile = (file: File): boolean => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (file.size > maxSize) {
    alert('File too large');
    return false;
  }
  
  if (!allowedTypes.includes(file.type)) {
    alert('File type not allowed');
    return false;
  }
  
  return true;
};
```

## Related Features
- **Activity Logs**: Tracks uploads/downloads
- **Family Members**: Files tagged by uploader
- **Data Persistence**: Uses MCP filesystem

## Customization Ideas

### Albums/Collections
```typescript
interface Album {
  id: string;
  name: string;
  description: string;
  coverPhoto: string;
  fileIds: string[];
  createdBy: string;
  sharedWith: string[];
}
```

### Tagging System
```typescript
const suggestedTags = [
  'vacation', 'birthday', 'holiday', 
  'school', 'sports', 'family'
];

const addTag = (fileId: string, tag: string) => {
  const file = files.find(f => f.id === fileId);
  if (file) {
    file.tags = [...(file.tags || []), tag];
    updateFile(file);
  }
};
```

### Comments
```typescript
interface Comment {
  id: string;
  fileId: string;
  user: string;
  text: string;
  timestamp: string;
}
```

## Benefits
1. **Memory Preservation**: Keep family photos safe
2. **Organization**: Categories and tags
3. **Sharing**: All family members can view
4. **Achievement Tracking**: Document milestones
5. **School Integration**: Store important documents