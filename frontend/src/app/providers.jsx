import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from './i18n.jsx';
import { AuthProvider } from './auth.jsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      // Don't retry client errors (4xx); retry network/server errors once.
      retry: (count, err) => (err?.status >= 400 && err?.status < 500 ? false : count < 1),
    },
  },
});

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
