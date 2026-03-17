import Header from '@/components/layout/header';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] bg-gradient-to-b from-background to-muted/20">
        {children}
      </main>
    </>
  );
}
