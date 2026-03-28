import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";

export default function AppLayout({ children }) {
    return (
        <div className="flex flex-col h-[100dvh] overflow-hidden">
            <Navbar />
            <div className="flex flex-1 relative w-full overflow-hidden">
                <Sidebar />
                <main 
                  className="flex-1 w-full pb-32 md:pb-0 overflow-y-auto overflow-x-hidden scroll-smooth transition-all duration-300" 
                  id="main-content"
                  style={{
                    WebkitOverflowScrolling: "touch",
                    overscrollBehaviorY: "contain"
                  }}
                >
                    {children}
                    <Footer />
                </main>
            </div>
            <BottomNav />
        </div>
    );
}
