
import { FileText, FileImage, FileVideo, FileAudio, Archive, Code, Sheet, Presentation } from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const getFileIcon = (filename: string): LucideIcon => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    // PDF
    case 'pdf':
      return FileText;
    
    // Microsoft Office
    case 'doc':
    case 'docx':
      return FileText;
    case 'xls':
    case 'xlsx':
      return Sheet;
    case 'ppt':
    case 'pptx':
      return Presentation;
    
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return FileImage;
    
    // Videos
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return FileVideo;
    
    // Audio
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return FileAudio;
    
    // Archives
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return Archive;
    
    // Code
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'sql':
      return Code;
    
    // Default
    default:
      return FileText;
  }
};

export const getFileIconColor = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'pdf':
      return 'text-red-600';
    case 'doc':
    case 'docx':
      return 'text-blue-600';
    case 'xls':
    case 'xlsx':
      return 'text-green-600';
    case 'ppt':
    case 'pptx':
      return 'text-orange-600';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'bmp':
    case 'svg':
    case 'webp':
      return 'text-purple-600';
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'flv':
    case 'webm':
      return 'text-pink-600';
    case 'mp3':
    case 'wav':
    case 'flac':
    case 'aac':
    case 'ogg':
      return 'text-indigo-600';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return 'text-yellow-600';
    case 'js':
    case 'ts':
    case 'html':
    case 'css':
    case 'json':
    case 'xml':
    case 'sql':
      return 'text-gray-600';
    default:
      return 'text-gray-500';
  }
};
