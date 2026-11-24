import DashboardLayout from "@/components/layout/DashboardLayout";

// Gives this page the top bar and side menu. Without it the page had no links
// at all, so the only way out was the browser's Back button.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
