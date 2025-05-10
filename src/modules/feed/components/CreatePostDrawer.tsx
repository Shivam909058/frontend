import React, { useState, useEffect } from 'react';
import {
  processYouTube, 
  processInstagram, 
  processText,
  checkSourceStatus,
  addSource,
  checkAndRefreshToken
} from '../../../services/api';
import { useParams } from 'react-router-dom';

// Inline styles to ensure proper display
const styles = {
  modal: {
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: 0,
  },
  cancelButton: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#f97316',
    padding: '8px',
    borderRadius: '4px',
  },
  description: {
    marginBottom: '16px',
    color: '#4b5563',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  tab: {
    padding: '8px 16px',
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
  },
  activeTab: {
    fontWeight: 'bold',
    borderBottom: '2px solid #f97316',
    color: '#f97316',
  },
  section: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: 'medium',
    color: '#4b5563',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    marginBottom: '8px',
  },
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '1rem',
    minHeight: '150px',
    resize: 'vertical' as const,
    marginBottom: '8px',
  },
  info: {
    color: '#6b7280',
    fontSize: '0.875rem',
    marginTop: '4px',
  },
  error: {
    color: '#ef4444',
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: '#fee2e2',
    borderRadius: '4px',
  },
  success: {
    color: '#10b981',
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: '#d1fae5',
    borderRadius: '4px',
  },
  saveButton: {
    backgroundColor: '#f97316',
    color: 'white',
    padding: '10px 16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: 'medium',
    width: '100%',
  },
  disabledButton: {
    backgroundColor: '#fdba74',
    cursor: 'not-allowed',
  },
  statusSection: {
    marginTop: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
  },
  statusTitle: {
    fontWeight: 'bold',
    marginBottom: '8px',
  },
};

interface CreatePostDrawerProps {
  bucketId: string;
  onClose: () => void;
  onSourceAdded?: () => void;
}

const CreatePostDrawer: React.FC<CreatePostDrawerProps> = ({ bucketId, onClose, onSourceAdded }) => {
  const [url, setUrl] = useState<string>('');
  const [text, setText] = useState<string>('');
  const [title, setTitle] = useState<string>('Text Source');
  const [activeTab, setActiveTab] = useState<'links' | 'text'>('links');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [processingStatus, setProcessingStatus] = useState<any>(null);
  
  // Move useParams to the top level of the component
  const params = useParams();
  const urlBucketId = params?.id;

  // Log available information on mount
  useEffect(() => { 
    console.log("CreatePostDrawer mounted");
    
    // Or get it from local storage
    const storedBucketId = localStorage.getItem('currentBucketId');
    
    // Set the active bucket ID from URL or stored value
    const idToUse = urlBucketId || storedBucketId || bucketId;
    
    console.log("Setting active bucket ID:", idToUse);
    
    // Get bucket ID from props or localStorage (avoid using same name as props)
    const currentBucketId = bucketId || localStorage.getItem('currentBucketId');
    console.log("Bucket ID:", currentBucketId);
    
    const token = localStorage.getItem(import.meta.env.VITE_TOKEN_ID);
    console.log("Token exists:", !!token);
  }, [bucketId]);

  // Detect URL type
  const detectUrlType = (url: string): 'youtube' | 'instagram' | 'general' => {
    if (!url) return 'general';
    
    const processedUrl = url.toLowerCase();
    
    if (processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) {
      return 'youtube';
    }
    
    if (processedUrl.includes('instagram.com')) {
      return 'instagram';
    }
    
    return 'general';
  };

  // Format URL properly
  const ensureUrlHasProtocol = (url: string): string => {
    url = url.trim();
    if (!url) return '';
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return 'https://' + url;
    }
    
    return url;
  };

  // Handle Save Source button click
  const handleSaveSource = async () => {
    if (activeTab === 'links' && !url) {
      setError('Please enter a URL');
      return;
    }
    
    if (activeTab === 'text' && (!text || text.length < 50)) {
      setError('Text must be at least 50 characters long');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      console.log(`Processing source for bucket: ${bucketId}`);
      
      if (!bucketId) {
        setError('No bucket selected. Please select a bucket first.');
        setIsProcessing(false);
        return;
      }
      
      // Check authentication first
      const isAuthenticated = await checkAndRefreshToken();
      
      if (!isAuthenticated) {
        setError('Your session has expired. Please log in again.');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }
      
      let response;
      
      if (activeTab === 'links') {
        // Ensure URL has protocol
        const processedUrl = ensureUrlHasProtocol(url);
        
        // Determine source type from URL
        const urlType = detectUrlType(processedUrl);
        console.log(`Processing ${urlType} URL: ${processedUrl}`);
        
        // Use the appropriate API function based on URL type
        if (urlType === 'youtube') {
          response = await processYouTube(processedUrl, bucketId);
        } else if (urlType === 'instagram') {
          response = await processInstagram(processedUrl, bucketId);
        } else {
          // For general URLs, use the addSource function
          response = await addSource(processedUrl, bucketId);
        }
        
        console.log(`Processed ${urlType} URL:`, response);
        
        if (response && response.success) {
          setSuccess(`Successfully added ${urlType} content! Processing in background...`);
          setUrl('');
          
          // Start checking processing status
          checkProcessingStatus(bucketId);
          
          // Call callback if provided
          if (typeof onSourceAdded === 'function') {
            onSourceAdded();
          }
        } else {
          // Handle error
          const errorMessage = response?.message || 'Failed to process URL';
          setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
        }
        
        // After getting the response, check for authentication issues
        if (response && !response.success && response.message?.includes('Authentication')) {
          setError('Authentication error: ' + response.message);
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
          return;
        }
      } else if (activeTab === 'text') {
        // Process text input
        response = await processText(text, title, bucketId);
        
        console.log('Text processing response:', response);
        
        if (response && response.success) {
          setSuccess('Successfully added text content!');
          setText('');
          setTitle('Text Source');
          
          // Call callback if provided
          if (typeof onSourceAdded === 'function') {
            onSourceAdded();
          }
        } else {
          // Handle error
          const errorMessage = response?.message || 'Failed to process text';
          setError(typeof errorMessage === 'object' ? JSON.stringify(errorMessage) : errorMessage);
        }
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      setError(errMsg || 'An error occurred while processing the source');
    } finally {
      setIsProcessing(false);
    }
  };

  // Add this helper function to check processing status periodically
  const checkProcessingStatus = async (bucketId: string) => {
    try {
      // Check status immediately
      const status = await checkSourceStatus(bucketId);
      setProcessingStatus(status);
      
      // Set up interval to check status every 5 seconds
      const intervalId = setInterval(async () => {
        try {
          const updatedStatus = await checkSourceStatus(bucketId);
          setProcessingStatus(updatedStatus);
          
          // If all sources are processed (no pending or processing), stop checking
          if (updatedStatus.status_summary && 
              updatedStatus.status_summary.pending === 0 && 
              updatedStatus.status_summary.processing === 0) {
            clearInterval(intervalId);
          }
        } catch (error) {
          console.error("Error checking processing status:", error);
        }
      }, 5000);
      
      // Clean up interval after 2 minutes maximum
      setTimeout(() => {
        clearInterval(intervalId);
      }, 120000);
      
    } catch (error) {
      console.error("Error setting up status checking:", error);
    }
  };

  return (
    <div style={styles.modal} className="add-source-modal">
      <div style={styles.header} className="header">
        <h2 style={styles.title}>Add a source</h2>
        <button style={styles.cancelButton} className="cancel-button" onClick={onClose}>Cancel</button>
          </div>
      
      <p style={styles.description} className="description">
        Enhance your Shakty with your data sources for personalized responses
      </p>
      
      <div style={styles.tabs} className="tabs">
        <div 
          style={{...styles.tab, ...(activeTab === 'links' ? styles.activeTab : {})}}
          className={`tab ${activeTab === 'links' ? 'active' : ''}`}
          onClick={() => setActiveTab('links')}
        >
          Links (one link at a time)
        </div>
        <div 
          style={{...styles.tab, ...(activeTab === 'text' ? styles.activeTab : {})}}
          className={`tab ${activeTab === 'text' ? 'active' : ''}`}
          onClick={() => setActiveTab('text')}
        >
          Text
              </div>
        </div>

      {activeTab === 'links' && (
        <div style={styles.section} className="link-section">
          <p style={styles.label}>Add links to your saved Reels, YouTube videos, or websites as sources</p>
          <input
            style={styles.input}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="url-input"
          />
          <p style={styles.info} className="info">Website content will be processed using a web scraper</p>
            </div>
      )}
      
      {activeTab === 'text' && (
        <div style={styles.section} className="text-section">
          <p style={styles.label}>Add text, context, or instructions related to your links</p>
          <input
            style={styles.input}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a title for this text"
            className="title-input"
          />
          <textarea
            style={{ ...styles.textarea, resize: 'vertical' }}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter source information... (minimum 50 characters)"
            className="text-input"
            rows={6}
          />
          <p style={styles.info}>Text must be at least 50 characters long</p>
          <p style={styles.info}>{text.length} characters</p>
          </div>
        )}

      {error && <div style={styles.error} className="error-message">{error}</div>}
      {success && <div style={styles.success} className="success-message">{success}</div>}
      
      <button 
        style={{
          ...styles.saveButton,
          ...(isProcessing ? styles.disabledButton : {})
        }}
        onClick={handleSaveSource}
        disabled={isProcessing}
        className="save-source-button"
      >
        {isProcessing ? 'Processing...' : 'Save Source'}
      </button>
      
      {processingStatus && (
        <div style={styles.statusSection} className="status-section">
          <h4 style={styles.statusTitle}>Processing Status</h4>
          <p>Total sources: {processingStatus.total_sources}</p>
          {processingStatus.status_summary && (
            <>
              <p>Pending: {processingStatus.status_summary.pending}</p>
              <p>Processing: {processingStatus.status_summary.processing}</p>
              <p>Success: {processingStatus.status_summary.success}</p>
              <p>Failed: {processingStatus.status_summary.failed}</p>
            </>
          )}
        </div>
        )}
      </div>
  );
};

export default CreatePostDrawer;
