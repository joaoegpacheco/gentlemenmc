'use client';

import React, { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './alert-dialog';
import { AlertTriangle, Trash2, CheckCircle, Info, AlertCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'destructive' | 'default' | 'warning' | 'info';
  icon?: ReactNode;
  isLoading?: boolean;
}

/**
 * Confirmation Dialog Component
 * Used before destructive or important actions
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  icon,
  isLoading = false,
}: ConfirmationDialogProps) {
  const t = useTranslations('confirmationDialog');
  const defaultConfirmText = confirmText ?? t('defaultConfirm');
  const defaultCancelText = cancelText ?? t('defaultCancel');
  
  const handleConfirm = async () => {
    await onConfirm();
    onOpenChange(false);
  };

  const getIcon = () => {
    if (icon) return icon;
    
    switch (variant) {
      case 'destructive':
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>{defaultCancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={
              variant === 'destructive'
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
          >
            {isLoading ? t('processing') : defaultConfirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for using confirmation dialog
 */
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dialogProps, setDialogProps] = React.useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>>({
    onConfirm: () => {},
    title: '',
    description: '',
  });

  const showConfirmation = (props: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    setDialogProps(props);
    setIsOpen(true);
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      {...dialogProps}
    />
  );

  return {
    showConfirmation,
    ConfirmationDialog: ConfirmationDialogComponent,
  };
}

/**
 * Utility function for quick confirmations
 */
export async function confirm(
  options: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange' | 'onConfirm'>
): Promise<boolean> {
  return new Promise((resolve) => {
    // This would need to be implemented with a global dialog provider
    // For now, it's a placeholder
    console.warn('Global confirm not implemented yet. Use useConfirmationDialog hook instead.');
    resolve(false);
  });
}

