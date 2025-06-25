"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, File, X, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useMutation } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/utils";

interface DocumentUploadProps {
  documentId: Id<"documents">;
  onUploadComplete?: () => void;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
}

export function DocumentUpload({ documentId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const attachToDocument = useMutation(api.files.attachToDocument);

  const handleFiles = async (files: FileList) => {
    const filesArray = Array.from(files);
    
    for (const file of filesArray) {
      const fileId = `${file.name}-${Date.now()}`;
      setUploadingFiles(prev => new Map(prev).set(fileId, {
        file,
        progress: 0,
        status: "uploading",
      }));

      try {
        // Get upload URL from Convex
        const uploadUrl = await generateUploadUrl();
        
        // Upload file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type || "application/octet-stream" },
          body: file,
        });

        if (response.ok) {
          const { storageId } = await response.json();
          
          // Update progress to 100%
          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(fileId);
            if (current) {
              newMap.set(fileId, { ...current, progress: 100 });
            }
            return newMap;
          });
          
          // Attach to document
          await attachToDocument({
            documentId,
            storageId: storageId as Id<"_storage">,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
          });

          setUploadingFiles(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(fileId);
            if (current) {
              newMap.set(fileId, { ...current, status: "completed" });
            }
            return newMap;
          });

          // Remove from list after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => {
              const newMap = new Map(prev);
              newMap.delete(fileId);
              return newMap;
            });
          }, 2000);

          onUploadComplete?.();
        } else {
          throw new Error("Upload failed");
        }
      } catch (error) {
        setUploadingFiles(prev => {
          const newMap = new Map(prev);
          const current = newMap.get(fileId);
          if (current) {
            newMap.set(fileId, { 
              ...current, 
              status: "error", 
              error: "Failed to get upload URL" 
            });
          }
          return newMap;
        });
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragging 
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
            : "border-gray-300 dark:border-gray-700"
        )}
      >
        <Upload className="w-8 h-8 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here or
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
        >
          Browse Files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      <AnimatePresence>
        {Array.from(uploadingFiles.entries()).map(([fileId, uploadingFile]) => (
          <motion.div
            key={fileId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <File className="w-5 h-5 text-gray-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium truncate">
                    {uploadingFile.file.name}
                  </p>
                  <button
                    onClick={() => removeFile(fileId)}
                    className="p-1 hover:bg-gray-200 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {formatBytes(uploadingFile.file.size)}
                </p>
                {uploadingFile.status === "uploading" && (
                  <Progress value={uploadingFile.progress} className="h-1" />
                )}
                {uploadingFile.status === "completed" && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs">Uploaded successfully</span>
                  </div>
                )}
                {uploadingFile.status === "error" && (
                  <p className="text-xs text-red-600">{uploadingFile.error}</p>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}