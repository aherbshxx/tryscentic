"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, PackagePlus, LogOut, LockKeyhole, Users, ShieldQuestionMark } from "lucide-react";
import { createClient } from "@/lib/utils/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        toast.success("Logged out successfully");
        router.push("/login");
    };

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: <LayoutDashboard size={20} />,
        },
        {
            name: "Products",
            href: "/dashboard/products",
            icon: <PackagePlus size={20} />,
        },
        {
            name: "Brands",
            href: "/dashboard/brands",
            icon: <ShieldQuestionMark size={20} />,
        },
        {
            name: "Users",
            href: "/dashboard/users",
            icon: <Users size={20} />,
        },
    ];

    return (
        <aside className="w-75 text-white min-h-screen flex flex-col bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-br-3xl rounded-tr-3xl p-6">

            <div className="flex gap-4 p-6 border-b border-gray-800 text-secondary">
                <LockKeyhole size={32} />
                <h2 className="text-2xl font-bold tracking-wider">ADMIN</h2>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? "bg-amber-600 text-white"
                                : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                }`}
                        >
                            {item.icon}
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-gray-800">
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 w-full text-left text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                    <LogOut size={20} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
