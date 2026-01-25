import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { isOwner, hasPermission } from '../../utils/roles';
import { getUserDepartment, loadDepartments, getDepartmentName } from '../../utils/departments';

export default function LearningCenter({ user }) {
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [canUpload, setCanUpload] = useState(false);
  const [userDepartment, setUserDepartment] = useState(null);
  const [userIsOwner, setUserIsOwner] = useState(false);
  
  // PDF Viewer Controls
  const [zoom, setZoom] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'continuous'
  const [fullscreen, setFullscreen] = useState(false);
  
  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDepartment, setUploadDepartment] = useState('');
  const [uploadCategory, setUploadCategory] = useState('handbook');
  const [uploadContent, setUploadContent] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    filterDocuments();
  }, [documents, selectedDept, searchTerm]);
  
  // Reset viewer state when document changes
  useEffect(() => {
    if (selectedDoc) {
      setZoom(100);
      setCurrentPage(1);
      setViewMode('single');
      setFullscreen(false);
    }
  }, [selectedDoc]);
  
  // Keyboard shortcuts for PDF viewer
  useEffect(() => {
    function handleKeyPress(e) {
      if (!selectedDoc) return;
      
      // Arrow keys for page navigation
      if (e.key === 'ArrowLeft' && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      } else if (e.key === 'ArrowRight' && selectedDoc.pages && currentPage < selectedDoc.pages.length) {
        setCurrentPage(currentPage + 1);
      }
      
      // Zoom shortcuts
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '=' || e.key === '+') {
          e.preventDefault();
          setZoom(Math.min(200, zoom + 10));
        } else if (e.key === '-') {
          e.preventDefault();
          setZoom(Math.max(50, zoom - 10));
        } else if (e.key === '0') {
          e.preventDefault();
          setZoom(100);
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedDoc, currentPage, zoom]);

  async function loadData() {
    if (!user) return;
    
    // Load departments
    const depts = await loadDepartments();
    setDepartments(depts);
    
    // Get user's department
    const userDept = await getUserDepartment(user);
    setUserDepartment(userDept);
    
    // Check if owner
    const owner = await isOwner(user);
    setUserIsOwner(owner);
    
    // Check upload permission (owner or FTO)
    const canUploadDocs = owner || await hasPermission(user, 'manage_training');
    setCanUpload(canUploadDocs);
    
    // Set default upload department
    if (userDept) {
      setUploadDepartment(userDept);
    }
    
    // Load documents
    await loadDocuments();
  }

  async function loadDocuments() {
    try {
      const docsSnapshot = await getDocs(
        query(
          collection(db, 'learning_center'),
          orderBy('createdAt', 'desc')
        )
      );
      
      const docs = [];
      docsSnapshot.forEach(doc => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    }
  }

  function filterDocuments() {
    let filtered = [...documents];
    
    // Filter by department
    if (selectedDept !== 'all') {
      filtered = filtered.filter(doc => 
        doc.department === selectedDept || doc.department === 'all'
      );
    } else {
      // Show user's department + all departments content
      if (userDepartment && !userIsOwner) {
        filtered = filtered.filter(doc =>
          doc.department === 'all' || doc.department === userDepartment
        );
      }
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(term) ||
        doc.category.toLowerCase().includes(term) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(term)))
      );
    }
    
    setFilteredDocs(filtered);
  }

  async function handleUploadDocument() {
    if (!uploadTitle || !uploadDepartment || !uploadContent) {
      alert('Please fill in all required fields');
      return;
    }
    
    // Check if user can upload to this department
    if (!userIsOwner && uploadDepartment !== userDepartment && uploadDepartment !== 'all') {
      alert('You can only upload to your department');
      return;
    }
    
    setUploading(true);
    
    try {
      await addDoc(collection(db, 'learning_center'), {
        title: uploadTitle,
        department: uploadDepartment,
        category: uploadCategory,
        content: uploadContent,
        author: user.fullName || user.username,
        authorUid: user.uid,
        tags: extractTags(uploadTitle + ' ' + uploadContent),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Clear form
      setUploadTitle('');
      setUploadContent('');
      setUploadCategory('handbook');
      setShowUpload(false);
      
      // Reload documents
      await loadDocuments();
      
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    try {
      await deleteDoc(doc(db, 'learning_center', docId));
      await loadDocuments();
      setSelectedDoc(null);
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  }

  function extractTags(text) {
    // Extract common keywords as tags
    const words = text.toLowerCase().split(/\s+/);
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for'];
    const tags = words
      .filter(word => word.length > 4 && !commonWords.includes(word))
      .slice(0, 5);
    return [...new Set(tags)];
  }

  function getCategoryIcon(category) {
    const icons = {
      handbook: '📘',
      policy: '📋',
      procedure: '📝',
      training: '🎓',
      memo: '📄',
      guide: '📖',
      form: '📑'
    };
    return icons[category] || '📄';
  }

  function getCategoryColor(category) {
    const colors = {
      handbook: 'bg-blue-100 text-blue-800',
      policy: 'bg-purple-100 text-purple-800',
      procedure: 'bg-green-100 text-green-800',
      training: 'bg-orange-100 text-orange-800',
      memo: 'bg-gray-100 text-gray-800',
      guide: 'bg-indigo-100 text-indigo-800',
      form: 'bg-pink-100 text-pink-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">📚 Learning Center</h1>
            <p className="text-blue-100 text-sm">Handbooks, Policies & Training Materials</p>
          </div>
          
          {canUpload && (
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              {showUpload ? '✕ Cancel' : '📤 Upload Document'}
            </button>
          )}
        </div>
        
        {/* Search & Filter */}
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg text-gray-800 placeholder-gray-400"
          />
          
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="px-4 py-2 rounded-lg text-gray-800 bg-white"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Upload Panel */}
      {showUpload && (
        <div className="bg-gray-50 border-b border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Upload New Document</h2>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Document title"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Department *</label>
              <select
                value={uploadDepartment}
                onChange={(e) => setUploadDepartment(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Select department</option>
                {userIsOwner ? (
                  // Owner can upload to any department
                  departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))
                ) : (
                  // Others can only upload to their department or 'all'
                  <>
                    {userDepartment && (
                      <option value={userDepartment}>
                        {getDepartmentName(userDepartment)}
                      </option>
                    )}
                    <option value="all">All Departments</option>
                  </>
                )}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Category *</label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="handbook">Handbook</option>
                <option value="policy">Policy</option>
                <option value="procedure">Procedure</option>
                <option value="training">Training Material</option>
                <option value="memo">Memo</option>
                <option value="guide">Guide</option>
                <option value="form">Form</option>
              </select>
            </div>
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Content *</label>
            <textarea
              value={uploadContent}
              onChange={(e) => setUploadContent(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg h-40"
              placeholder="Document content..."
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleUploadDocument}
              disabled={uploading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg font-semibold transition-colors"
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {selectedDoc ? (
        // PDF-Style Document Viewer with PowerPoint Controls
        <div className="flex-1 flex flex-col bg-gray-900">
          {/* Document Header Bar */}
          <div className="bg-gray-800 text-white px-6 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedDoc(null)}
                className="text-gray-300 hover:text-white flex items-center gap-2 transition-colors"
              >
                ← Back to Library
              </button>
              <div className="h-6 w-px bg-gray-600"></div>
              <span className="text-2xl">{getCategoryIcon(selectedDoc.category)}</span>
              <div>
                <h2 className="text-lg font-semibold">{selectedDoc.title}</h2>
                <p className="text-sm text-gray-400">
                  {getDepartmentName(selectedDoc.department)} • {selectedDoc.category}
                </p>
              </div>
            </div>
            
            {(userIsOwner || selectedDoc.authorUid === user?.uid) && (
              <button
                onClick={() => handleDeleteDocument(selectedDoc.id)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                🗑️ Delete
              </button>
            )}
          </div>

          {/* PowerPoint-Style Controls */}
          <div className="bg-gray-800 px-6 py-3 flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <button 
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Zoom Out"
              >
                −
              </button>
              <span className="px-3 py-1 bg-gray-700 text-white rounded min-w-[80px] text-center">
                {zoom}%
              </span>
              <button 
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Zoom In"
              >
                +
              </button>
              
              <div className="h-6 w-px bg-gray-600 mx-2"></div>
              
              {/* Fit Controls */}
              <button 
                onClick={() => setZoom(100)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors text-sm"
              >
                Fit Width
              </button>
            </div>
            
            {/* Page Navigation (if multi-page) */}
            {selectedDoc.pages && selectedDoc.pages.length > 1 && (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                >
                  ◀
                </button>
                <span className="text-white text-sm">
                  Page {currentPage} of {selectedDoc.pages?.length || 1}
                </span>
                <button 
                  onClick={() => setCurrentPage(Math.min(selectedDoc.pages.length, currentPage + 1))}
                  disabled={currentPage === (selectedDoc.pages?.length || 1)}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded transition-colors"
                >
                  ▶
                </button>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <button 
                onClick={() => setViewMode('single')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'single' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Single Page"
              >
                📄
              </button>
              <button 
                onClick={() => setViewMode('continuous')}
                className={`px-3 py-1.5 rounded transition-colors ${
                  viewMode === 'continuous' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-700 hover:bg-gray-600 text-white'
                }`}
                title="Continuous"
              >
                📋
              </button>
              
              <div className="h-6 w-px bg-gray-600 mx-2"></div>
              
              {/* Presentation Mode */}
              <button 
                onClick={() => setFullscreen(!fullscreen)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Presentation Mode"
              >
                {fullscreen ? '🗗' : '⛶'}
              </button>
              
              {/* Print */}
              <button 
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
                title="Print"
              >
                🖨️
              </button>
            </div>
          </div>

          {/* PDF-Style Document Display */}
          <div className="flex-1 overflow-auto bg-gray-900 p-8" style={{ height: fullscreen ? '100vh' : 'auto' }}>
            <div className="max-w-[900px] mx-auto">
              {/* Document Metadata Card */}
              <div className="bg-white rounded-t-lg shadow-2xl mb-0 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-6xl">{getCategoryIcon(selectedDoc.category)}</div>
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedDoc.title}</h1>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Department:</span>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                            {getDepartmentName(selectedDoc.department)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Category:</span>
                          <span className={`px-2 py-1 rounded ${getCategoryColor(selectedDoc.category)}`}>
                            {selectedDoc.category}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Author:</span> {selectedDoc.author}
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(selectedDoc.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Document Content - PDF Style */}
              <div 
                className="bg-white shadow-2xl rounded-b-lg p-12 print:shadow-none"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  marginBottom: zoom !== 100 ? `${(zoom - 100) * 3}px` : '0'
                }}
              >
                <div className="prose prose-lg max-w-none">
                  {/* Page Number Header */}
                  {selectedDoc.pages && selectedDoc.pages.length > 1 && (
                    <div className="text-right text-sm text-gray-500 mb-6 print:hidden">
                      Page {currentPage} of {selectedDoc.pages.length}
                    </div>
                  )}
                  
                  {/* Content */}
                  <div className="whitespace-pre-wrap leading-relaxed text-gray-800">
                    {selectedDoc.pages && selectedDoc.pages.length > 1 
                      ? selectedDoc.pages[currentPage - 1]
                      : selectedDoc.content
                    }
                  </div>
                  
                  {/* Page Number Footer */}
                  <div className="mt-12 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
                    {selectedDoc.pages && selectedDoc.pages.length > 1 
                      ? `Page ${currentPage} of ${selectedDoc.pages.length}`
                      : `${selectedDoc.title} - ${getDepartmentName(selectedDoc.department)}`
                    }
                  </div>
                </div>
              </div>
              
              {/* Page Navigation Arrows (Floating) */}
              {selectedDoc.pages && selectedDoc.pages.length > 1 && (
                <>
                  {currentPage > 1 && (
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      className="fixed left-8 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full shadow-lg transition-all print:hidden"
                      style={{ zIndex: 50 }}
                    >
                      ◀
                    </button>
                  )}
                  {currentPage < selectedDoc.pages.length && (
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      className="fixed right-8 top-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-800 p-4 rounded-full shadow-lg transition-all print:hidden"
                      style={{ zIndex: 50 }}
                    >
                      ▶
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Keyboard Shortcuts Help */}
          <div className="bg-gray-800 px-6 py-2 border-t border-gray-700">
            <p className="text-xs text-gray-400 text-center">
              💡 Shortcuts: [←] [→] Previous/Next Page  •  [Ctrl +] [Ctrl -] Zoom  •  [F11] Fullscreen  •  [Ctrl P] Print
            </p>
          </div>
        </div>
      ) : (
        // Document List View
        <div className="flex-1 overflow-y-auto p-6">
          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">📚</p>
              <p>No documents found</p>
              {canUpload && (
                <p className="text-sm mt-2">Upload your first document to get started</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl">{getCategoryIcon(doc.category)}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{getDepartmentName(doc.department)}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {doc.content.substring(0, 100)}...
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getCategoryColor(doc.category)}`}>
                      {doc.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
