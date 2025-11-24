import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

type AlertType = 'error' | 'success' | 'warning' | 'info';

interface AuthAlertProps {
  type: AlertType;
  title: string;
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
}

const getAlertConfig = (type: AlertType) => {
  switch (type) {
    case 'error':
      return {
        icon: AlertCircle,
        className: 'border-red-500/50 bg-red-50 dark:bg-red-950/20',
        titleClassName: 'text-red-800 dark:text-red-400',
        messageClassName: 'text-red-700 dark:text-red-300',
      };
    case 'success':
      return {
        icon: CheckCircle,
        className: 'border-green-500/50 bg-green-50 dark:bg-green-950/20',
        titleClassName: 'text-green-800 dark:text-green-400',
        messageClassName: 'text-green-700 dark:text-green-300',
      };
    case 'warning':
      return {
        icon: AlertCircle,
        className: 'border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20',
        titleClassName: 'text-yellow-800 dark:text-yellow-400',
        messageClassName: 'text-yellow-700 dark:text-yellow-300',
      };
    case 'info':
      return {
        icon: Clock,
        className: 'border-blue-500/50 bg-blue-50 dark:bg-blue-950/20',
        titleClassName: 'text-blue-800 dark:text-blue-400',
        messageClassName: 'text-blue-700 dark:text-blue-300',
      };
  }
};

export const AuthAlert: React.FC<AuthAlertProps> = ({
  type,
  title,
  message,
  onDismiss,
  autoHide = false,
  duration = 5000,
}) => {
  const [visible, setVisible] = React.useState(true);
  const config = getAlertConfig(type);
  const Icon = config.icon;

  React.useEffect(() => {
    if (autoHide) {
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  if (!visible) return null;

  return (
    <Alert className={config.className}>
      <Icon className="h-4 w-4" />
      <AlertTitle className={config.titleClassName}>{title}</AlertTitle>
      <AlertDescription className={config.messageClassName}>
        {message}
      </AlertDescription>
    </Alert>
  );
};

// Common error/success messages
export const AuthMessages = {
  OTP_SENT: {
    type: 'success' as AlertType,
    title: 'OTP Sent',
    message: 'Check your SMS for the verification code',
  },
  OTP_SENT_FAIL: {
    type: 'error' as AlertType,
    title: 'Failed to Send OTP',
    message: 'Please check your phone number and try again',
  },
  INVALID_PHONE: {
    type: 'error' as AlertType,
    title: 'Invalid Phone Number',
    message: 'Please enter a valid 10-digit mobile number',
  },
  OTP_INVALID: {
    type: 'error' as AlertType,
    title: 'Invalid OTP',
    message: 'The code you entered is incorrect or expired',
  },
  VERIFICATION_SUCCESS: {
    type: 'success' as AlertType,
    title: 'Verification Successful',
    message: 'Your account has been verified',
  },
  NETWORK_ERROR: {
    type: 'error' as AlertType,
    title: 'Network Error',
    message: 'Please check your internet connection',
  },
  USERNAME_TAKEN: {
    type: 'error' as AlertType,
    title: 'Username Unavailable',
    message: 'This username is already taken',
  },
  SESSION_RESTORED: {
    type: 'info' as AlertType,
    title: 'Welcome Back',
    message: 'Your session has been restored',
  },
};

export default AuthAlert;
