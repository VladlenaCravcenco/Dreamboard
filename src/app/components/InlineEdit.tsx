import React, { useState, useEffect, useRef } from 'react';
import { Check, Pencil } from 'lucide-react';

interface InlineEditProps {
  value: string | number | null | undefined;
  onSave: (value: string) => void;
  className?: string;
  placeholder?: string;
  type?: 'text' | 'number' | 'textarea';
  prefix?: string;
  suffix?: string;
  displayClassName?: string;
}

export const InlineEdit: React.FC<InlineEditProps> = ({
  value,
  onSave,
  className = '',
  placeholder = 'Click to edit',
  type = 'text',
  prefix = '',
  suffix = '',
  displayClassName = '',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value?.toString() || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type !== 'textarea') {
        (inputRef.current as HTMLInputElement).select();
      }
    }
  }, [isEditing, type]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value?.toString() || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (!isEditing) {
    return (
      <div
        onClick={() => setIsEditing(true)}
        className={`group cursor-pointer hover:bg-[--cream]/50 dark:hover:bg-[--ink]/50 rounded px-2 py-1 -mx-2 -my-1 transition-colors flex items-center gap-2 ${displayClassName}`}
      >
        <span className="flex-1">
          {prefix}
          {value || <span className="text-[--ink]/40 dark:text-[--cream]/40">{placeholder}</span>}
          {suffix}
        </span>
        <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity text-[--gold]" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {type === 'textarea' ? (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-1 bg-white dark:bg-[--ink-light] border border-[--gold] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[--gold]/50 resize-none ${className}`}
          rows={3}
        />
      ) : (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={type}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className={`flex-1 bg-white dark:bg-[--ink-light] border border-[--gold] rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[--gold]/50 ${className}`}
        />
      )}
      <button
        onClick={handleSave}
        className="p-1 hover:bg-[--gold]/20 rounded transition-colors"
        type="button"
      >
        <Check className="w-4 h-4 text-[--gold]" />
      </button>
    </div>
  );
};
