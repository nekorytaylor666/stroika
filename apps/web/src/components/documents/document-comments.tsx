"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  Send, 
  MoreHorizontal, 
  Edit2, 
  Trash2,
  Reply,
  Check,
  X,
  AtSign
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../../packages/backend/convex/_generated/api";
import type { Id } from "../../../../../packages/backend/convex/_generated/dataModel";
import { formatDistanceToNow } from "date-fns";
import { ru } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DocumentCommentsProps {
  documentId: Id<"documents">;
}

interface Comment {
  _id: Id<"documentComments">;
  content: string;
  authorId: Id<"users">;
  author: any;
  parentCommentId?: Id<"documentComments">;
  isResolved: boolean;
  createdAt: number;
  updatedAt: number;
  childrenCount: number;
  mentionedUsers: any[];
  replies?: Comment[];
}

export function DocumentComments({ documentId }: DocumentCommentsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Id<"documentComments"> | null>(null);
  const [editingComment, setEditingComment] = useState<Id<"documentComments"> | null>(null);
  const [editContent, setEditContent] = useState("");
  const [showResolved, setShowResolved] = useState(false);
  const [mentioning, setMentioning] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const comments = useQuery(api.comments.list, { 
    documentId, 
    includeResolved: showResolved 
  });
  const users = useQuery(api.users.list);
  
  const createComment = useMutation(api.comments.create);
  const updateComment = useMutation(api.comments.update);
  const resolveComment = useMutation(api.comments.resolve);
  const removeComment = useMutation(api.comments.remove);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    // Extract mentioned users from content
    const mentionedUsernames = newComment.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const mentionedUserIds = users?.filter(u => 
      mentionedUsernames.includes(u.name.toLowerCase().replace(/\s+/g, ''))
    ).map(u => u._id) || [];

    await createComment({
      documentId,
      content: newComment,
      parentCommentId: replyingTo || undefined,
      mentionedUserIds: mentionedUserIds.length > 0 ? mentionedUserIds : undefined,
    });

    setNewComment("");
    setReplyingTo(null);
  };

  const handleUpdate = async () => {
    if (!editingComment || !editContent.trim()) return;

    // Extract mentioned users from content
    const mentionedUsernames = editContent.match(/@(\w+)/g)?.map(m => m.slice(1)) || [];
    const mentionedUserIds = users?.filter(u => 
      mentionedUsernames.includes(u.name.toLowerCase().replace(/\s+/g, ''))
    ).map(u => u._id) || [];

    await updateComment({
      id: editingComment,
      content: editContent,
      mentionedUserIds,
    });

    setEditingComment(null);
    setEditContent("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "@") {
      setMentioning(true);
      setMentionSearch("");
    } else if (mentioning && e.key === " ") {
      setMentioning(false);
    }
  };

  const handleMentionSelect = (user: any) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBefore = textarea.value.slice(0, cursorPos);
    const lastAtIndex = textBefore.lastIndexOf("@");
    const textAfter = textarea.value.slice(cursorPos);

    const newText = 
      textBefore.slice(0, lastAtIndex) + 
      `@${user.name.toLowerCase().replace(/\s+/g, '')} ` + 
      textAfter;

    if (editingComment) {
      setEditContent(newText);
    } else {
      setNewComment(newText);
    }

    setMentioning(false);
    setMentionSearch("");
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "group",
        isReply && "ml-12 mt-3"
      )}
    >
      <div className={cn(
        "rounded-lg p-4",
        comment.isResolved 
          ? "bg-gray-50 dark:bg-gray-900 opacity-60" 
          : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
      )}>
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.author?.avatarUrl} />
            <AvatarFallback className="text-xs">
              {comment.author?.name.charAt(0)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {comment.author?.name}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
                {comment.isResolved && (
                  <Badge variant="secondary" className="text-xs">
                    Resolved
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-opacity">
                    <MoreHorizontal className="w-4 h-4 text-gray-500" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {!comment.isResolved && (
                    <>
                      <DropdownMenuItem onClick={() => {
                        setEditingComment(comment._id);
                        setEditContent(comment.content);
                      }}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => 
                        resolveComment({ id: comment._id, isResolved: true })
                      }>
                        <Check className="w-4 h-4 mr-2" />
                        Resolve
                      </DropdownMenuItem>
                    </>
                  )}
                  {comment.isResolved && (
                    <DropdownMenuItem onClick={() => 
                      resolveComment({ id: comment._id, isResolved: false })
                    }>
                      <X className="w-4 h-4 mr-2" />
                      Unresolve
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => removeComment({ id: comment._id })}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {editingComment === comment._id ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[60px]"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleUpdate}>
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setEditingComment(null);
                      setEditContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm whitespace-pre-wrap">
                  {comment.content.split(/(@\w+)/).map((part, i) => {
                    if (part.startsWith("@")) {
                      const username = part.slice(1);
                      const mentionedUser = comment.mentionedUsers.find(u => 
                        u.name.toLowerCase().replace(/\s+/g, '') === username
                      );
                      if (mentionedUser) {
                        return (
                          <span key={i} className="text-blue-600 font-medium">
                            @{mentionedUser.name}
                          </span>
                        );
                      }
                    }
                    return part;
                  })}
                </p>

                {!isReply && !comment.isResolved && (
                  <button
                    onClick={() => setReplyingTo(comment._id)}
                    className="mt-2 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                  >
                    <Reply className="w-3 h-3" />
                    Reply
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((reply) => (
            <div key={reply._id}>
              {renderComment(reply, true)}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );

  const filteredUsers = users?.filter(u => 
    u.name.toLowerCase().includes(mentionSearch.toLowerCase())
  ) || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-500" />
          <h3 className="font-medium">Comments</h3>
          {comments && (
            <Badge variant="secondary" className="text-xs">
              {comments.length}
            </Badge>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowResolved(!showResolved)}
        >
          {showResolved ? "Hide" : "Show"} resolved
        </Button>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {comments?.map((comment) => (
            <div key={comment._id}>
              {renderComment(comment as any)}
            </div>
          ))}
        </AnimatePresence>
      </div>

      <div className="relative">
        {replyingTo && (
          <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded flex items-center justify-between">
            <span className="text-sm text-gray-600">
              Replying to comment...
            </span>
            <button
              onClick={() => setReplyingTo(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="relative">
          <Textarea
            ref={textareaRef}
            placeholder="Add a comment... Use @ to mention someone"
            value={newComment}
            onChange={(e) => {
              setNewComment(e.target.value);
              if (mentioning) {
                const lastAtIndex = e.target.value.lastIndexOf("@");
                setMentionSearch(e.target.value.slice(lastAtIndex + 1));
              }
            }}
            onKeyDown={handleKeyDown}
            className="min-h-[80px] pr-12"
          />
          <Button
            size="icon"
            className="absolute bottom-2 right-2"
            onClick={handleSubmit}
            disabled={!newComment.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>

          <AnimatePresence>
            {mentioning && filteredUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-full mb-2 left-0 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-2 max-h-48 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <button
                      key={user._id}
                      onClick={() => handleMentionSelect(user)}
                      className="w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-left"
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatarUrl} />
                        <AvatarFallback className="text-xs">
                          {user.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}