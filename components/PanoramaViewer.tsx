import React from 'react';

interface PanoramaViewerProps {
  url?: string;
}

const PanoramaViewer: React.FC<PanoramaViewerProps> = ({ url }) => {
  return (
    <div className="w-full h-screen relative bg-gray-900">
      {url ? (
        <iframe 
          src={url}
          className="w-full h-full border-0"
          title="360 Virtual Tour"
          allowFullScreen
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-white/50">
          Loading Panorama...
        </div>
      )}
    </div>
  );
};

export default PanoramaViewer;