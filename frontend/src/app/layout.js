'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Inter, Outfit } from 'next/font/google';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';
import './globals.css';
import { useTranslation } from 'react-i18next';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });

export default function RootLayout({ children }) {
    return (
        <I18nextProvider i18n={i18n}>
            <LayoutContent>{children}</LayoutContent>
        </I18nextProvider>
    );
}

function LayoutContent({ children }) {
    const { t } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Initial check
        const checkAuth = () => {
            const storedUser = localStorage.getItem('farm_user');
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            } else {
                setUser(null);
            }
        };

        checkAuth();

        // Listen for custom auth event (for same-tab login)
        window.addEventListener('auth-change', checkAuth);
        // Also listen for storage (for multi-tab)
        window.addEventListener('storage', checkAuth);

        return () => {
            window.removeEventListener('auth-change', checkAuth);
            window.removeEventListener('storage', checkAuth);
        };
    }, []);

    // Auth Guard
    useEffect(() => {
        if (!mounted) return;

        const storedUser = localStorage.getItem('farm_user');
        const publicPaths = ['/', '/register'];
        const isPublic = publicPaths.includes(pathname);

        if (!storedUser && !isPublic) {
            router.push('/register');
        }
    }, [pathname, mounted, router]);

    return (
        <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
            <body className="font-sans antialiased text-brand-dark bg-surface-50">
                {!mounted ? (
                    <div className="flex items-center justify-center min-h-screen bg-surface-50">
                        <div className="text-brand-gold animate-pulse font-medium">Loading FarmMind...</div>
                    </div>
                ) : (
                    <div className="flex flex-col min-h-screen">
                        {/* Hide Navbar on Register page */}
                        {pathname !== '/register' && (
                            <nav className="fixed w-full z-50 top-0 border-b border-white/50 bg-white/80 backdrop-blur-md transition-all duration-300">
                                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                                        <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-green/20">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                                <path fillRule="evenodd" d="M12.963 2.286a.75.75 0 0 0-1.071-.136 9.742 9.742 0 0 0-3.539 6.177 7.547 7.547 0 0 1-1.705-1.715.75.75 0 0 0-1.152-.082A9 9 0 1 0 15.68 4.534a7.46 7.46 0 0 1-2.717-2.248ZM15.75 14.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <span className="text-xl font-bold tracking-tight font-display">FarmMind <span className="text-brand-green">Lite</span></span>
                                    </Link>

                                    {user ? (
                                        <div className="hidden md:flex items-center gap-1 text-sm font-medium">
                                            {/* Show Marketplace for EVERYONE */}
                                            <NavLink href="/marketplace" active={pathname === '/marketplace'}>{t('common.marketplace')}</NavLink>

                                            {/* Show Tools ONLY for Farmers */}
                                            {user.role === 'farmer' && (
                                                <>
                                                    <NavLink href="/calendar" active={pathname === '/calendar'}>{t('common.calendar')}</NavLink>
                                                    <NavLink href="/irrigation" active={pathname === '/irrigation'}>{t('common.irrigation')}</NavLink>
                                                    <NavLink href="/doctor" active={pathname === '/doctor'}>{t('common.doctor')}</NavLink>
                                                    <NavLink href="/market" active={pathname === '/market'}>{t('common.market')}</NavLink>
                                                    <NavLink href="/estimator" active={pathname === '/estimator'}>{t('common.estimator')}</NavLink>
                                                </>
                                            )}

                                            <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-200">
                                                <LanguageSwitcher />
                                                <div className="text-right">
                                                    <div className="text-brand-dark font-bold leading-none">{user.full_name ? user.full_name.split(' ')[0] : 'User'}</div>
                                                    <div className="text-xs text-subtle capitalize">{user.role}</div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('farm_user');
                                                        setUser(null);
                                                        router.push('/');
                                                    }}
                                                    className="text-xs font-semibold text-subtle hover:text-brand-dark px-3 py-1.5 rounded-lg hover:bg-black/5 transition-colors"
                                                >
                                                    {t('common.logout')}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <LanguageSwitcher />
                                            <Link href="/register" className="btn-primary py-2 px-5 text-sm shadow-none">
                                                {t('common.login')}
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </nav>
                        )}

                        <main className={`flex-grow ${pathname !== '/register' ? 'pt-20' : ''}`}>
                            {children}
                        </main>

                        {pathname !== '/register' && (
                            <footer className="py-12 border-t border-slate-200 text-center text-subtle text-sm">
                                <p>&copy; 2026 FarmMind Lite. Growing a better future for Uzbekistan.</p>
                            </footer>
                        )}
                    </div>
                )}
            </body>
        </html>
    );
}

function NavLink({ href, active, children }) {
    return (
        <Link
            href={href}
            className={`px-4 py-2 rounded-lg transition-all duration-200 ${active
                ? 'text-brand-green bg-brand-green/10 font-bold'
                : 'text-subtle hover:text-brand-dark hover:bg-black/5'
                }`}
        >
            {children}
        </Link>
    );
}
