import { Header } from "@/components/store/header";
import { Footer } from "@/components/store/footer";
import { FloatingButtons } from "@/components/floating-buttons";

export default function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
