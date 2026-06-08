import Providers from "@/components/Providers";
import Sidebar from "@/components/Sidebar";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="app-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </Providers>
  );
}
