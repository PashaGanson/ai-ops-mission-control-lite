'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const navItems = [
  { icon: '📋', label: 'Tasks', href: '/tasks' },
  { icon: '📁', label: 'Projects', href: '/projects' },
];
export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <aside style={{ backgroundColor: 'rgb(26, 26, 46)' }} className="w-56 h-full flex flex-col py-4 px-2 border-r border-white/10">
    <nav className="flex flex-col gap-0.5">{navItems.map((item)=>{const isActive=pathname===item.href||pathname.startsWith(item.href+'/');return <Link key={item.href} href={item.href} onClick={onNavigate} className={`flex items-center gap-3 px-3 py-3 rounded-lg text-base md:text-sm md:py-2 transition-colors ${isActive?'bg-blue-600 text-white':'text-gray-300 hover:bg-white/10 hover:text-white'}`}><span className="text-base">{item.icon}</span><span>{item.label}</span></Link>})}</nav>
  </aside>
}
