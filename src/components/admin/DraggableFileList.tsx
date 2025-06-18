
import React from 'react';
import { X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getFileIcon, getFileIconColor } from '@/utils/fileIcons';

interface FileItem {
  name: string;
  size: number;
  id?: string;
}

interface DraggableFileListProps {
  files: (File | FileItem)[];
  onRemove: (index: number) => void;
  onReorder: (startIndex: number, endIndex: number) => void;
  isExistingFiles?: boolean;
}

export const DraggableFileList = ({ files, onRemove, onReorder, isExistingFiles = false }: DraggableFileListProps) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorder(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (files.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-2">
      {files.map((file, index) => {
        const fileName = file.name;
        const fileSize = 'size' in file ? file.size : 0;
        const isFile = file instanceof File;
        const FileIcon = getFileIcon(fileName);
        const iconColor = getFileIconColor(fileName);
        
        return (
          <div
            key={isExistingFiles && 'id' in file ? file.id : `${fileName}-${index}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`flex items-center justify-between p-3 rounded border-2 transition-all ${
              draggedIndex === index 
                ? 'border-blue-300 bg-blue-50 opacity-50' 
                : isExistingFiles 
                  ? 'border-green-200 bg-green-50 hover:border-green-300'
                  : 'border-gray-200 bg-gray-50 hover:border-gray-300'
            } cursor-move`}
          >
            <div className="flex items-center gap-3 flex-1">
              <GripVertical className="w-4 h-4 text-gray-400" />
              <FileIcon className={`w-5 h-5 ${iconColor}`} />
              <div className="flex flex-col">
                <span className="text-sm text-gray-700 font-medium">{fileName}</span>
                <span className="text-xs text-gray-500">
                  {formatFileSize(fileSize)} • Position {index + 1}
                  {isExistingFiles && (
                    <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                      Current
                    </span>
                  )}
                  {!isExistingFiles && (
                    <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                      New
                    </span>
                  )}
                </span>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemove(index)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        );
      })}
      <div className="text-xs text-gray-500 mt-2 flex items-center gap-1">
        <GripVertical className="w-3 h-3" />
        Drag files to reorder them
        {isExistingFiles && (
          <span className="ml-2 text-green-600">• Current files in database</span>
        )}
      </div>
    </div>
  );
};
