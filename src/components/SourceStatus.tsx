import React, { useState, useEffect } from 'react';
import { checkSourceStatus } from '../services/api';

interface SourceStatusProps {
  bucketId: string;
}

const SourceStatus: React.FC<SourceStatusProps> = ({ bucketId }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  useEffect(() => {
    let mounted = true;
    let intervalId: number;
    
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const result = await checkSourceStatus(bucketId);
        
        if (mounted) {
          setStatus(result);
          setError('');
          
          // Check if all sources are processed
          const allDone = result.total_sources === 0 || 
            (result.status_summary.success + result.status_summary.failed === result.total_sources);
          
          // If all done, stop polling
          if (allDone && intervalId) {
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
    
    // Poll every 5 seconds
    intervalId = window.setInterval(fetchStatus, 5000) as unknown as number;
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [bucketId]);
  
  if (loading && !status) {
    return <div>Loading source status...</div>;
  }
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  if (!status || !status.sources) {
    return <div>No source information available</div>;
  }
  
  return (
    <div className="source-status">
      <h3>Source Processing Status</h3>
      <div className="status-summary">
        <div>Total sources: {status.total_sources}</div>
        <div>Processed: {status.status_summary.success}</div>
        <div>Processing: {status.status_summary.processing}</div>
        <div>Pending: {status.status_summary.pending}</div>
        <div>Failed: {status.status_summary.failed}</div>
      </div>
      
      {status.sources.processing.length > 0 && (
        <div className="status-section">
          <h4>Processing Sources</h4>
          <ul>
            {status.sources.processing.map((source: any) => (
              <li key={source.id}>{source.source_url}</li>
            ))}
          </ul>
        </div>
      )}
      
      {status.sources.success.length > 0 && (
        <div className="status-section">
          <h4>Processed Sources</h4>
          <ul>
            {status.sources.success.map((source: any) => (
              <li key={source.id}>{source.source_url}</li>
            ))}
          </ul>
        </div>
      )}
      
      {status.sources.failed.length > 0 && (
        <div className="status-section">
          <h4>Failed Sources</h4>
          <ul>
            {status.sources.failed.map((source: any) => (
              <li key={source.id}>{source.source_url} - {source.source_message}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SourceStatus; 