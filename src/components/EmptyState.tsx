import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  onActionHref?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  onActionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border rounded-xl bg-card">
      <div className="p-4 bg-muted text-muted-foreground rounded-full mb-4">
        <Icon className="w-10 h-10" />
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-md mb-6">{description}</p>
      
      {actionLabel && onActionHref ? (
        <Link href={onActionHref} className={buttonVariants({ variant: 'default' })}>
          {actionLabel}
        </Link>
      ) : actionLabel && onAction ? (
        <Button onClick={onAction} className="shadow-sm">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
