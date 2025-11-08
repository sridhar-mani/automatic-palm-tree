import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Oops! Something went wrong</Text>
          <Text style={styles.message}>
            We encountered an unexpected error. Please try refreshing the app.
          </Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => this.setState({ hasError: false, error: undefined })}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </Pressable>
          {__DEV__ && this.state.error && (
            <View style={styles.errorDetails}>
              <Text style={styles.errorTitle}>Error Details (Dev Mode):</Text>
              <Text style={styles.errorText}>{this.state.error.message}</Text>
              <Text style={styles.errorStack}>{this.state.error.stack}</Text>
            </View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#D63031',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D63031',
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: '#636E72',
    fontFamily: 'monospace',
    lineHeight: 14,
  },
});