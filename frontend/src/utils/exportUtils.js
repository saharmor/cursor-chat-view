import axios from 'axios';

/**
 * Exports a chat session as HTML or JSON
 * @param {string} sessionId - The ID of the chat session to export
 * @param {string} format - The export format ('html' or 'json')
 * @returns {Promise} - A promise that resolves when the export is complete
 */
export const exportChat = async (sessionId, format) => {
  try {
    console.log(`Starting ${format.toUpperCase()} export for session:`, sessionId);
    console.log(`Making API request to: /api/chat/${sessionId}/export?format=${format}`);
    
    const response = await axios.get(
      `/api/chat/${sessionId}/export?format=${format}`,
      { responseType: 'blob' }
    );

    const blob = response.data;
    console.log('Received blob size:', blob ? blob.size : 0);

    if (!blob || blob.size === 0) {
      throw new Error('Received empty or invalid content from server');
    }

    // Ensure the blob has the correct MIME type
    const mimeType = format === 'json' ? 'application/json;charset=utf-8' : 'text/html;charset=utf-8';
    const typedBlob = blob.type ? blob : new Blob([blob], { type: mimeType });
    console.log('Prepared typed blob, size:', typedBlob.size);

    // --- Download Logic Start ---
    const extension = format === 'json' ? 'json' : 'html';
    const filename = `cursor-chat-${sessionId.slice(0, 8)}.${extension}`;
    const link = document.createElement('a');
    
    // Create an object URL for the (possibly re-typed) blob
    const url = URL.createObjectURL(typedBlob);
    link.href = url;
    link.download = filename;
    
    // Append link to the body (required for Firefox)
    document.body.appendChild(link);
    
    // Programmatically click the link to trigger the download
    link.click();
    
    // Clean up: remove the link and revoke the object URL
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log("Download initiated and cleanup complete");
    // --- Download Logic End ---
    
    return true;
  } catch (error) {
    // Detailed error logging
    console.error('Detailed export error:', error);
    if (error.response) {
      console.error('Error Response Data:', error.response.data);
      console.error('Error Response Status:', error.response.status);
      console.error('Error Response Headers:', error.response.headers);
    } else if (error.request) {
      console.error('Error Request:', error.request);
    } else {
      console.error('Error Message:', error.message);
    }
    console.error('Error Config:', error.config);
    
    const errorMessage = error.response ? 
      `Server error: ${error.response.status}` : 
      error.request ? 
      'No response received from server' : 
      error.message || 'Unknown error setting up request';
    
    alert(`Failed to export chat: ${errorMessage}`);
    return false;
  }
};

/**
 * Manages user preferences for export warnings in cookies
 */
export const exportPreferences = {
  /**
   * Check if the user has chosen to skip the export warning
   * @returns {boolean} - Whether to skip the warning
   */
  getDontShowWarning: () => {
    const warningPreference = document.cookie
      .split('; ')
      .find(row => row.startsWith('dontShowExportWarning='));
    
    return warningPreference ? warningPreference.split('=')[1] === 'true' : false;
  },
  
  /**
   * Save the user's preference for export warnings
   * @param {boolean} dontShow - Whether to skip the warning in future
   */
  saveDontShowWarning: (dontShow) => {
    if (dontShow) {
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1); // Cookie lasts 1 year
      document.cookie = `dontShowExportWarning=true; expires=${expiryDate.toUTCString()}; path=/`;
    }
  }
}; 