import * as React from 'react';
import { MessageCircle, ChevronDown, ChevronRight, X, Plus } from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import usersData from '@/utils/users.json';
import { ENV } from '@/conf';

type User = {
  id: string;
  name: string;
  avatar?: string;
  email?: string;
};

export type Comment = {
  id: string;
  parentId: string | null;
  author: User;
  body: string;
  createdAt: string;
  replies: Comment[];
};

const DUMMY_COMMENTS: Comment[] = [
  {
    id: '1',
    parentId: null,
    author: {
      id: 'u1',
      name: 'Alice Smith',
    },
    body: 'This is a great feature! I really love how nested comments work.',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    replies: [
      {
        id: '2',
        parentId: '1',
        author: {
          id: 'u2',
          name: 'Bob Jones',
          avatar: 'https://i.pravatar.cc/150?u=bob',
        },
        body: 'I totally agree, Alice! It makes discussions much easier to follow.',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        replies: [
          {
            id: '3',
            parentId: '2',
            author: {
              id: 'u3',
              name: 'Charlie Brown',
              avatar: 'https://i.pravatar.cc/150?u=charlie',
            },
            body: 'Plus one to that. The UI looks super clean as well.',
            createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
            replies: [],
          },
        ],
      },
    ],
  },
  {
    id: '4',
    parentId: null,
    author: {
      id: 'u4',
      name: 'Diana Prince',
      avatar: 'https://i.pravatar.cc/150?u=diana',
    },
    body: 'Does this support markdown or is it just plain text?',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    replies: [],
  },
];

/**
 * Transforms a flat array of MongoDB notes (with `_id` and `notesParentId`)
 * into a nested tree array of `Comment` objects.
 */
export function buildCommentTree(rawNotes: any[]): Comment[] {
  if (!rawNotes || !Array.isArray(rawNotes)) return [];

  const commentMap = new Map<string, Comment>();
  const rootComments: Comment[] = [];

  // Step 1: Initialize all comments
  rawNotes.forEach((n) => {
    const commentId = String(n._id || n.id || '');
    if (!commentId) return;

    const authorName =
      n.Created_By?.name ||
      n.Owner?.first_name ||
      n.Owner?.name ||
      'Unknown User';

    const authorId = n.Created_By?.id || n.Owner?.id || 'unknown';

    commentMap.set(commentId, {
      id: commentId,
      parentId: n.notesParentId || null,
      author: {
        id: authorId,
        name: authorName,
        avatar: n.Created_By?.avatar || n.Owner?.avatar,
        email: n.Created_By?.email || n.Owner?.email,
      },
      body: n.Note_Content || '',
      createdAt: n.Created_Time || new Date().toISOString(),
      replies: [],
    });
  });

  // Step 2: Build tree hierarchy
  commentMap.forEach((comment) => {
    if (comment.parentId && commentMap.has(comment.parentId)) {
      commentMap.get(comment.parentId)!.replies.push(comment);
    } else {
      rootComments.push(comment);
    }
  });

  return rootComments;
}

type NestedCommentsProps = {
  entityId?: string;
  moduleName?: string;
  initialComments?: Comment[];
  notes?: any[];
  onNoteAdded?: () => void;
};

export function NestedComments({
  entityId,
  moduleName = 'Accounts',
  initialComments,
  notes,
  onNoteAdded,
}: NestedCommentsProps = {}) {
  const [comments, setComments] = React.useState<Comment[]>(() => {
    if (notes && Array.isArray(notes)) {
      return buildCommentTree(notes);
    }
    return initialComments || DUMMY_COMMENTS;
  });

  const [isCreatingNote, setIsCreatingNote] = React.useState(false);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [collapsed, setCollapsed] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (notes && Array.isArray(notes)) {
      setComments(buildCommentTree(notes));
    }
  }, [notes]);

  function toggleCollapsed(commentId: string) {
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  }

  async function addNote(parentId: string | null, body: string) {
    if (!entityId) {
      // Offline / Demo fallback
      const newComment: Comment = {
        id: crypto.randomUUID(),
        parentId,
        author: {
          id: 'current-user',
          name: 'You',
        },
        body,
        createdAt: new Date().toISOString(),
        replies: [],
      };

      if (parentId) {
        setComments((current) => insertReply(current, parentId, newComment));
      } else {
        setComments((current) => [newComment, ...current]);
      }

      setReplyingTo(null);
      setIsCreatingNote(false);
      return;
    }

    try {
      const res = await fetch(`${ENV.VITE_BACKEND_BASE_URL}/notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: entityId,
          module: moduleName,
          note: body,
          notesParentId: parentId,
        }),
      });

      if (res.ok) {
        const resultData = await res.json();
        const rawNote = resultData.data;

        if (rawNote) {
          const authorName =
            rawNote.Created_By?.name ||
            rawNote.Owner?.first_name ||
            rawNote.Owner?.name ||
            'You';

          const newComment: Comment = {
            id: String(rawNote._id || rawNote.id || crypto.randomUUID()),
            parentId,
            author: {
              id: rawNote.Created_By?.id || 'current-user',
              name: authorName,
            },
            body: rawNote.Note_Content || body,
            createdAt: rawNote.Created_Time || new Date().toISOString(),
            replies: [],
          };

          if (parentId) {
            setComments((current) => insertReply(current, parentId, newComment));
          } else {
            setComments((current) => [newComment, ...current]);
          }
        }

        if (onNoteAdded) {
          onNoteAdded();
        }
      }
    } catch (err) {
      console.error('Failed to create note:', err);
    } finally {
      setReplyingTo(null);
      setIsCreatingNote(false);
    }
  }

  const INITIAL_VISIBLE_COUNT = 5;
  const [visibleCount, setVisibleCount] = React.useState(INITIAL_VISIBLE_COUNT);

  const visibleComments = comments.slice(0, visibleCount);

  return (
    <section className='w-full'>
      {/* Header section with Create Note button on the right side */}
      <div className='mb-6 flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <MessageCircle className='size-5' />
          <h2 className='text-lg font-semibold'>Notes</h2>
        </div>

        <Button
          size='sm'
          onClick={() => setIsCreatingNote((prev) => !prev)}
          className='gap-1.5'
        >
          <Plus className='size-4' />
          {isCreatingNote ? 'Cancel' : 'Create Note'}
        </Button>
      </div>

      {/* Top Level Note Composer */}
      {isCreatingNote && (
        <div className='mb-6'>
          <ReplyComposer
            authorName='Top Level Note'
            isTopLevel
            onCancel={() => setIsCreatingNote(false)}
            onSubmit={(body) => addNote(null, body)}
            placeholder='Add a new top-level note...'
            buttonText='Create Note'
          />
        </div>
      )}

      {/* Comments List */}
      <div className='space-y-6'>
        {comments.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No notes available yet.</p>
        ) : (
          visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              replyingTo={replyingTo}
              collapsed={collapsed}
              onReply={setReplyingTo}
              onCancelReply={() => setReplyingTo(null)}
              onSubmitReply={(parentId, body) => addNote(parentId, body)}
              onToggleCollapsed={toggleCollapsed}
            />
          ))
        )}
      </div>

      {/* Load More Pagination */}
      {comments.length > visibleCount && (
        <div className='mt-6 text-center'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setVisibleCount((prev) => prev + 5)}
          >
            Show More Notes ({comments.length - visibleCount} remaining)
          </Button>
        </div>
      )}
      {visibleCount > INITIAL_VISIBLE_COUNT && visibleCount >= comments.length && (
        <div className='mt-6 text-center'>
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setVisibleCount(INITIAL_VISIBLE_COUNT)}
          >
            Show Less
          </Button>
        </div>
      )}
    </section>
  );
}

type CommentItemProps = {
  comment: Comment;
  depth: number;
  replyingTo: string | null;
  collapsed: Set<string>;

  onReply: (commentId: string) => void;
  onCancelReply: () => void;

  onSubmitReply: (parentId: string, body: string) => void;

  onToggleCollapsed: (commentId: string) => void;
};

function CommentItem({
  comment,
  depth,
  replyingTo,
  collapsed,
  onReply,
  onCancelReply,
  onSubmitReply,
  onToggleCollapsed,
}: CommentItemProps) {
  const isReplying = replyingTo === comment.id;
  const isCollapsed = collapsed.has(comment.id);
  const hasReplies = comment.replies.length > 0;

  return (
    <div className='relative'>
      <div className='flex gap-3'>
        <Avatar className='size-9 shrink-0'>
          <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
          <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
        </Avatar>

        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium'>{comment.author.name}</span>
            <span className='text-xs text-muted-foreground'>
              {formatDate(comment.createdAt)}
            </span>
          </div>

          <p className='mt-1 whitespace-pre-wrap text-sm leading-6'>
            {renderMentions(comment.body)}
          </p>

          <div className='mt-2 flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2 text-xs'
              onClick={() => onReply(comment.id)}
            >
              Reply
            </Button>

            {hasReplies && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 gap-1 px-2 text-xs'
                onClick={() => onToggleCollapsed(comment.id)}
              >
                {isCollapsed ? (
                  <ChevronRight className='size-3.5' />
                ) : (
                  <ChevronDown className='size-3.5' />
                )}

                {isCollapsed
                  ? `Show ${comment.replies.length} ${
                      comment.replies.length === 1 ? 'reply' : 'replies'
                    }`
                  : 'Hide replies'}
              </Button>
            )}
          </div>

          {isReplying && (
            <ReplyComposer
              authorName={comment.author.name}
              onCancel={onCancelReply}
              onSubmit={(body) => onSubmitReply(comment.id, body)}
              placeholder={`Reply to ${comment.author.name}...`}
              buttonText='Reply'
            />
          )}

          {!isCollapsed && hasReplies && (
            <div className='mt-4 border-l pl-4'>
              <div className='space-y-5'>
                {comment.replies.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    depth={depth + 1}
                    replyingTo={replyingTo}
                    collapsed={collapsed}
                    onReply={onReply}
                    onCancelReply={onCancelReply}
                    onSubmitReply={onSubmitReply}
                    onToggleCollapsed={onToggleCollapsed}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type ReplyComposerProps = {
  authorName: string;
  isTopLevel?: boolean;
  onCancel: () => void;
  onSubmit: (body: string) => void;
  placeholder?: string;
  buttonText?: string;
};

function renderMentions(text: string) {
  return text.replace(/crm\[user#([^\]]+)\]crm/g, (_, userId) => {
    const userName = (usersData as Record<string, string>)[userId];
    return userName ? `@${userName}` : '@Unknown User';
  });
}

function ReplyComposer({
  authorName,
  isTopLevel = false,
  onCancel,
  onSubmit,
  placeholder,
  buttonText = 'Reply',
}: ReplyComposerProps) {
  const [value, setValue] = React.useState('');
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionStart, setMentionStart] = React.useState(-1);
  const [mentionedUsers, setMentionedUsers] = React.useState<
    { id: string; name: string }[]
  >([]);

  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const usersList = Object.entries(usersData).map(([id, name]) => ({
    id,
    name: String(name),
  }));

  const filteredUsers =
    mentionQuery !== null
      ? usersList.filter((user) =>
          user.name.toLowerCase().includes(mentionQuery.toLowerCase()),
        )
      : [];

  function submit() {
    let finalBody = value.trim();

    if (!finalBody) return;

    // Convert @User Name → crm[user#id]crm
    mentionedUsers.forEach((user) => {
      const regex = new RegExp(
        `@${user.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
        'g',
      );

      finalBody = finalBody.replace(regex, `crm[user#${user.id}]crm`);
    });

    onSubmit(finalBody);

    setValue('');
    setMentionQuery(null);
    setMentionStart(-1);
    setMentionedUsers([]);
  }

  const handleMentionSelect = (user: { id: string; name: string }) => {
    if (mentionStart === -1) return;

    const before = value.substring(0, mentionStart);
    const exactEnd = textareaRef.current?.selectionStart ?? value.length;
    const after = value.substring(exactEnd);
    const insertText = `@${user.name} `;

    setValue(before + insertText + after);

    setMentionedUsers((prev) => {
      if (!prev.some((mentionedUser) => mentionedUser.id === user.id)) {
        return [...prev, user];
      }
      return prev;
    });

    setMentionQuery(null);
    setMentionStart(-1);

    setTimeout(() => {
      const newCursorPos = before.length + insertText.length;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className='relative mt-3 rounded-lg border bg-muted/30 p-3 w-full'>
      <div className='mb-2 flex items-center justify-between'>
        <span className='text-xs text-muted-foreground'>
          {isTopLevel ? (
            <span className='font-semibold text-foreground'>Create Note</span>
          ) : (
            <>
              Replying to{' '}
              <span className='font-medium text-foreground'>
                {authorName}
              </span>
            </>
          )}
        </span>

        <Button
          variant='ghost'
          size='icon'
          className='size-7'
          onClick={onCancel}
        >
          <X className='size-4' />
          <span className='sr-only'>Cancel</span>
        </Button>
      </div>

      <div className='relative'>
        <Textarea
          ref={textareaRef}
          autoFocus
          value={value}
          onChange={(e) => {
            const val = e.target.value;
            const cursor = e.target.selectionStart;

            setValue(val);

            const textBeforeCursor = val.substring(0, cursor);
            const match = textBeforeCursor.match(
              /(?:^|\s)@([a-zA-Z0-9 ]{0,30})$/,
            );

            if (match) {
              setMentionQuery(match[1]);
              setMentionStart(cursor - match[1].length - 1);
            } else {
              setMentionQuery(null);
              setMentionStart(-1);
            }
          }}
          placeholder={placeholder || `Reply to ${authorName}...`}
          className='min-h-20 resize-none bg-background'
        />

        {mentionQuery !== null && filteredUsers.length > 0 && (
          <div className='absolute z-50 left-0 right-0 bottom-full mb-1 max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md'>
            {filteredUsers.map((user) => (
              <button
                key={user.id}
                type='button'
                className='block w-full px-3 py-2 text-left text-sm hover:bg-muted'
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleMentionSelect(user)}
              >
                {user.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className='mt-2 flex justify-end gap-2'>
        <Button variant='ghost' size='sm' onClick={onCancel}>
          Cancel
        </Button>

        <Button size='sm' disabled={!value.trim()} onClick={submit}>
          {buttonText}
        </Button>
      </div>
    </div>
  );
}

/**
 * Recursively finds the parent comment and
 * inserts the new reply into its replies array.
 */
function insertReply(
  comments: Comment[],
  parentId: string,
  reply: Comment,
): Comment[] {
  return comments.map((comment) => {
    if (comment.id === parentId) {
      return {
        ...comment,
        replies: [...comment.replies, reply],
      };
    }

    if (comment.replies.length === 0) {
      return comment;
    }

    return {
      ...comment,
      replies: insertReply(comment.replies, parentId, reply),
    };
  });
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date: string) {
  const value = new Date(date);
  if (isNaN(value.getTime())) {
    return date || 'just now';
  }

  const diff = Date.now() - value.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return 'just now';
  }

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  return value.toLocaleDateString();
}
