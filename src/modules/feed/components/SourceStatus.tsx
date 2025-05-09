import { useState, useEffect } from 'react';
import { checkSourceStatus } from '../../../services/api';

const SourceStatus = ({ bucketId }: { bucketId: string }) => {
  const [status, setStatus] = useState<{
    sources?: {
      success?: any[];
      processing?: any[];
      pending?: any[];
      failed?: any[];
    };
    total_sources?: number;
    status_summary?: {
      success: number;
      processing: number;
      pending: number;
      failed: number;
    };
    completionPercentage?: number;
    isFullyProcessed?: boolean;
    recent_logs?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pollCount, setPollCount] = useState(0);
  const [intervalId, setIntervalId] = useState<ReturnType<typeof setInterval> | undefined>();
  
  useEffect(() => {
    let mounted = true;
    
    const fetchStatus = async () => {
      try {
        if (!bucketId) {
          setError('No bucket ID provided');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const result = await checkSourceStatus(bucketId);
        
        if (mounted) {
          setStatus(result);
          setError('');
          setPollCount(prev => prev + 1);
          
          // Check if all sources are processed
          const allProcessed = result.isFullyProcessed;
          
          // If all sources are processed or we've polled too many times, stop
          if (allProcessed || pollCount > 30) {
            clearInterval(intervalId);
          }
        }
      } catch (error) {
        if (mounted) {
          setError('Failed to fetch source status');
          console.error('Error fetching source status:', error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    // Initial fetch
    fetchStatus();
    
    // Poll every 4 seconds
    intervalId = setInterval(fetchStatus, 4000);
    
    return () => {
      mounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [bucketId, pollCount]);
  
  const getSourceTypeIcon = (source: {
    source_url?: string;
    id?: string;
    status?: string;
    source_message?: string;
  }) => {
    const url = source.source_url || '';
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return '🎬'; // YouTube
    } else if (url.includes('instagram.com')) {
      return '📸'; // Instagram
    } else if (url.includes('local://raw-text') || !url) {
      return '📝'; // Text
    } else if (url.endsWith('.pdf')) {
      return '📄'; // PDF
    } else {
      return '🌐'; // Web
    }
  };
  
  if (loading && !status) {
    return <div className="p-4 text-gray-600">Loading source status...</div>;
  }
  
  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }
  
  if (!status || !status?.sources) {
    return <div className="p-4 text-gray-600">No source information available</div>;
  }
  
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-4">Source Processing Status</h3>
      
      {loading && !status ? (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Checking source status...</span>
        </div>
      ) : error ? (
        <div className="p-4 text-red-500">Error: {error}</div>
      ) : !status ? (
        <div className="p-4 text-gray-600">No source information available</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium">Total sources: {status?.total_sources ?? 0}</p>
              <div className="mt-2 space-y-1">
                <p className="text-sm text-green-600">✓ Processed: {status?.status_summary?.success ?? 0}</p>
                <p className="text-sm text-yellow-600">⟳ Processing: {status?.status_summary?.processing ?? 0}</p>
                <p className="text-sm text-blue-600">⏱ Pending: {status?.status_summary?.pending ?? 0}</p>
                <p className="text-sm text-red-600">✗ Failed: {status?.status_summary?.failed ?? 0}</p>
              </div>
            </div>
            
            {/* Progress bar */}
            <div className="bg-gray-50 p-3 rounded-md">
              <p className="text-sm font-medium mb-2">Processing progress</p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{width: `${status?.completionPercentage ?? 0}%`}}
                ></div>
              </div>
              <p className="text-xs text-right mt-1">{status?.completionPercentage ?? 0}% complete</p>
            </div>
          </div>
          
          {/* Status messages based on processing state */}
          {(status?.isFullyProcessed === true) ? (
            <div className="bg-green-50 p-3 rounded-md mb-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">✓ All sources processed!</span> You can now ask questions about your content.
              </p>
            </div>
          ) : ((status?.status_summary?.success ?? 0) > 0) ? (
            <div className="bg-yellow-50 p-3 rounded-md mb-4">
              <p className="text-sm text-yellow-800">
                <span className="font-medium">⚠️ Some sources are ready</span> You can start asking questions, but some content is still processing.
              </p>
            </div>
          ) : ((status?.total_sources ?? 0) > 0) ? (
            <div className="bg-blue-50 p-3 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">⏱️ Processing in progress</span> Please wait for your sources to be processed before asking questions.
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded-md mb-4">
              <p className="text-sm text-gray-800">
                <span className="font-medium">ℹ️ No sources added yet</span> Add some sources to get started.
              </p>
            </div>
          )}
          
          {(status?.status_summary?.success ?? 0) > 0 && (
            <div className="bg-green-50 p-3 rounded-md">
              <p className="text-sm font-medium text-green-800">Your Shakty can now answer questions about:</p>
              <ul className="mt-2 space-y-1 text-sm">
                {status?.sources?.success?.slice(0, 3).map((source: any) => (
                  <li key={source.id} className="truncate">
                    {getSourceTypeIcon(source)} {source.source_message || source.source_url}
                  </li>
                ))}
                {(status?.sources?.success?.length ?? 0) > 3 && (
                  <li className="text-gray-500">...and {status.sources.success.length - 3} more</li>
                )}
              </ul>
            </div>
          )}
          
          {((status?.sources?.processing?.length ?? 0) > 0 || (status?.sources?.pending?.length ?? 0) > 0) && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">In Progress</h4>
              <ul className="space-y-2">
                {[...(status?.sources?.processing ?? []), ...(status?.sources?.pending ?? [])].slice(0, 5).map((source: any) => (
                  <li key={source.id} className="text-sm flex items-center">
                    <span className="mr-2 inline-block animate-pulse">⟳</span>
                    <span className="truncate">{source.source_message || source.source_url}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {(status?.sources?.failed?.length ?? 0) > 0 && (
            <div className="bg-red-50 p-3 rounded-md mb-4">
              <h4 className="text-sm font-medium text-red-800 mb-2">Failed Sources</h4>
              <ul className="space-y-1">
                {status?.sources?.failed?.map((source: any) => (
                  <li key={source.id} className="text-sm text-red-600">
                    ✗ {source.source_url} - {source.source_message}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {status && status?.recent_logs && (
            <details className="mt-4">
              <summary className="text-sm font-medium cursor-pointer">Processing Logs</summary>
              <pre className="mt-2 text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 text-gray-600">
                {status?.recent_logs}
              </pre>
            </details>
          )}
        </>
      )}
    </div>
  );
};

export default SourceStatus; 