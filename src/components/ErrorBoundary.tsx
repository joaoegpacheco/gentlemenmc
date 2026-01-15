'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { AlertCircle, RefreshCcw, Home } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  translations?: {
    somethingWentWrong: string;
    unexpectedError: string;
    error: string;
    stackTrace: string;
    pleaseReloadOrGoHome: string;
    tryAgain: string;
    goToHome: string;
  };
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // TODO: Send error to error reporting service (e.g., Sentry)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      const t = this.props.translations || {
        somethingWentWrong: 'Something went wrong',
        unexpectedError: 'Sorry, an unexpected error occurred. Our team has been notified.',
        error: 'Error:',
        stackTrace: 'Stack Trace:',
        pleaseReloadOrGoHome: 'Please try reloading the page or go back to the home page.',
        tryAgain: 'Try again',
        goToHome: 'Go to home',
      };

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-6 w-6 text-destructive" />
                <CardTitle>{t.somethingWentWrong}</CardTitle>
              </div>
              <CardDescription>
                {t.unexpectedError}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-muted-foreground">{t.error}</p>
                  <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-40">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <>
                      <p className="text-sm font-semibold text-muted-foreground mt-4">
                        {t.stackTrace}
                      </p>
                      <pre className="p-4 bg-muted rounded-lg text-xs overflow-auto max-h-60">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              )}
              {process.env.NODE_ENV === 'production' && (
                <p className="text-sm text-muted-foreground">
                  {t.pleaseReloadOrGoHome}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" className="flex-1">
                <RefreshCcw className="mr-2 h-4 w-4" />
                {t.tryAgain}
              </Button>
              <Button onClick={this.handleGoHome} className="flex-1">
                <Home className="mr-2 h-4 w-4" />
                {t.goToHome}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component that provides translations to ErrorBoundary
 * Usage: wrap components with <ErrorBoundaryWrapper>...</ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({ children, fallback, onError }: Omit<Props, 'translations'>) {
  const t = useTranslations('errorBoundary');
  
  const translations = {
    somethingWentWrong: t('somethingWentWrong'),
    unexpectedError: t('unexpectedError'),
    error: t('error'),
    stackTrace: t('stackTrace'),
    pleaseReloadOrGoHome: t('pleaseReloadOrGoHome'),
    tryAgain: t('tryAgain'),
    goToHome: t('goToHome'),
  };

  return (
    <ErrorBoundary fallback={fallback} onError={onError} translations={translations}>
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook version for functional components
 * Usage: wrap components with <ErrorBoundary>...</ErrorBoundary>
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundaryWrapper fallback={fallback}>
        <Component {...props} />
      </ErrorBoundaryWrapper>
    );
  };
}

