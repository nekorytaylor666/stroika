"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, 
  Download, 
  ExternalLink, 
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";
import { formatBytes } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface DocumentViewerProps {
  documentId: Id<"documents">;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileAudio;
  if (mimeType.includes("pdf")) return FileText;
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return FileSpreadsheet;
  if (mimeType.includes("code") || mimeType.includes("json") || mimeType.includes("javascript")) return FileCode;
  return File;
};

const isPreviewable = (mimeType: string) => {
  return mimeType.startsWith("image/") || 
         mimeType === "application/pdf" ||
         mimeType.startsWith("text/");
};

export function DocumentViewer({ documentId }: DocumentViewerProps) {
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const attachments = useQuery(api.files.getDocumentAttachments, { documentId });
  const removeAttachment = useMutation(api.files.removeAttachment);
  const getUrl = useQuery(api.files.getUrl, 
    selectedFile ? { storageId: selectedFile.fileUrl } : "skip"
  );

  // Update preview URL when getUrl changes
  if (getUrl && getUrl !== previewUrl) {
    setPreviewUrl(getUrl);
  }

  const handleRemove = async (attachmentId: Id<"documentAttachments">) => {
    await removeAttachment({ attachmentId });
  };

  const handleDownload = async (attachment: any) => {
    const url = await api.files.getUrl({ storageId: attachment.fileUrl });
    if (url) {
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!attachments || attachments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No files attached</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        <AnimatePresence>
          {attachments.map((attachment) => {
            const Icon = getFileIcon(attachment.mimeType);
            const canPreview = isPreviewable(attachment.mimeType);
            
            return (
              <motion.div
                key={attachment._id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="group bg-gray-50 dark:bg-gray-900 rounded-lg p-4 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h4 
                        className="font-medium text-sm truncate cursor-pointer hover:text-blue-600"
                        onClick={() => canPreview && setSelectedFile(attachment)}
                      >
                        {attachment.fileName}
                      </h4>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canPreview && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => setSelectedFile(attachment)}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={() => handleDownload(attachment)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleRemove(attachment._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{formatBytes(attachment.fileSize)}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarImage src={attachment.uploader?.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {attachment.uploader?.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{attachment.uploader?.name}</span>
                      </div>
                      <span>•</span>
                      <span>
                        {formatDistanceToNow(new Date(attachment.uploadedAt), {
                          addSuffix: true,
                          locale: ru,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <Dialog open={!!selectedFile} onOpenChange={() => {
        setSelectedFile(null);
        setPreviewUrl(null);
      }}>
        <DialogContent className="max-w-4xl h-[80vh]" hideCloseButton>
          {selectedFile && (
            <div className="h-full flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-medium">{selectedFile.fileName}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload(selectedFile)}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="flex-1 overflow-auto p-4">
                {previewUrl && selectedFile.mimeType.startsWith("image/") && (
                  <img 
                    src={previewUrl} 
                    alt={selectedFile.fileName}
                    className="max-w-full h-auto mx-auto"
                  />
                )}
                {previewUrl && selectedFile.mimeType === "application/pdf" && (
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-full"
                    title={selectedFile.fileName}
                  />
                )}
                {previewUrl && selectedFile.mimeType.startsWith("text/") && (
                  <iframe 
                    src={previewUrl} 
                    className="w-full h-full bg-white dark:bg-gray-900"
                    title={selectedFile.fileName}
                  />
                )}
                {!isPreviewable(selectedFile.mimeType) && (
                  <div className="text-center py-12">
                    <File className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-500">
                      Preview not available for this file type
                    </p>
                    <Button
                      className="mt-4"
                      onClick={() => handleDownload(selectedFile)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}