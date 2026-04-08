import AdminSidebar from "@/components/admin/AdminSidebar";
import { NotificationProvider } from "@/components/NotificationContext";

export const metadata = {
    title: "Admin — ZetVerify Control Center",
    description: "Administrator control center for the ZetVerify platform.",
};

export default function AdminLayout({ children }) {
    return (
        <NotificationProvider>
            <div className="flex h-screen bg-slate-950 overflow-hidden">
                <AdminSidebar />
                <div className="flex flex-col flex-1 overflow-hidden">
                    {/* children include their own AdminTopBar for refresh state */}
                    <main className="flex-1 overflow-y-auto">
                        {children}
                    </main>
                </div>
            </div>
        </NotificationProvider>
    );
}
