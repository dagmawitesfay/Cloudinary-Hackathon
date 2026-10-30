import { useEffect, useRef, useState, type ReactNode } from 'react';
import { buttonPrimary } from '../lib/ui';
import { uploadPreset } from './config';

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

interface UploadWidgetProps {
  onUploadSuccess?: (result: CloudinaryUploadResult) => void;
  onUploadError?: (error: Error) => void;
  /** Button contents. Defaults to plain text. */
  children?: ReactNode;
  /** Replaces the primary-button look, e.g. for the upload zone. */
  className?: string;
}

interface CloudinaryWidgetResult {
  event: string;
  info: CloudinaryUploadResult;
}

interface CloudinaryWidgetError {
  message?: string;
  statusText?: string;
}

declare global {
  interface Window {
    cloudinary?: {
      createUploadWidget: (
        config: Record<string, unknown>,
        callback: (error: CloudinaryWidgetError | null, result: CloudinaryWidgetResult | null) => void
      ) => { open: () => void; destroy?: () => void };
    };
  }
}

// Flyer photos only. Format/size are also enforced by the upload preset.
const WIDGET_OPTIONS = {
  sources: ['local', 'camera'],
  multiple: false,
  maxFiles: 1,
  resourceType: 'image',
  clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'heic'],
  maxFileSize: 10_000_000,
};

export function UploadWidget({
  onUploadSuccess,
  onUploadError,
  children = 'Upload Image',
  className = buttonPrimary,
}: UploadWidgetProps) {
  const widgetRef = useRef<{ open: () => void; destroy?: () => void } | null>(null);
  // Latest callbacks in refs so the widget is created once, not on every render.
  const onSuccessRef = useRef(onUploadSuccess);
  const onErrorRef = useRef(onUploadError);
  const [isReady, setIsReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    onSuccessRef.current = onUploadSuccess;
    onErrorRef.current = onUploadError;
  }, [onUploadSuccess, onUploadError]);

  useEffect(() => {
    let poll: ReturnType<typeof setInterval> | null = null;
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let mounted = true;

    function initializeWidget() {
      if (!mounted || typeof window.cloudinary?.createUploadWidget !== 'function') return;

      if (!uploadPreset) {
        console.warn(
          'VITE_CLOUDINARY_UPLOAD_PRESET is not set. ' +
          'Create an unsigned upload preset in your Cloudinary dashboard.'
        );
      }

      widgetRef.current = window.cloudinary.createUploadWidget(
        {
          cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
          uploadPreset: uploadPreset || undefined,
          ...WIDGET_OPTIONS,
        },
        (error: CloudinaryWidgetError | null, result: CloudinaryWidgetResult | null) => {
          if (error) {
            onErrorRef.current?.(new Error(error.message || error.statusText || 'Upload failed'));
            return;
          }

          if (result && result.event === 'success') {
            onSuccessRef.current?.(result.info);
          }
        }
      );

      setIsReady(true);
    }

    function isWidgetReady(): boolean {
      return typeof window.cloudinary?.createUploadWidget === 'function';
    }

    // Poll until createUploadWidget is available
    // Script should be in index.html, but poll handles any load timing
    poll = setInterval(() => {
      if (isWidgetReady()) {
        if (poll) clearInterval(poll);
        if (timeout) clearTimeout(timeout);
        initializeWidget();
      }
    }, 100);

    // Timeout after 10 seconds
    timeout = setTimeout(() => {
      if (poll) clearInterval(poll);
      if (mounted && !isWidgetReady()) {
        console.error('Upload widget script failed to load within 10 seconds');
        setScriptError(true);
      }
    }, 10000);

    // Check immediately in case script is already loaded
    if (isWidgetReady()) {
      if (poll) clearInterval(poll);
      if (timeout) clearTimeout(timeout);
      initializeWidget();
    }

    return () => {
      mounted = false;
      if (poll) clearInterval(poll);
      if (timeout) clearTimeout(timeout);
      widgetRef.current?.destroy?.();
      widgetRef.current = null;
    };
  }, []);

  const handleClick = () => {
    widgetRef.current?.open();
  };

  if (scriptError) {
    return (
      <p role="alert" className="text-sm text-danger">
        The upload tool failed to load. Please refresh the page or check your connection.
      </p>
    );
  }

  return (
    <button type="button" onClick={handleClick} disabled={!isReady} aria-busy={!isReady} className={className}>
      {isReady ? children : 'Loading…'}
    </button>
  );
}
