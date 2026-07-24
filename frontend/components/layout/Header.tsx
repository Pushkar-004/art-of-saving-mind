'use client'

import Link from 'next/link'
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react'
import { useState, useEffect } from 'react'
import ThemeToggle from '@/components/shared/ThemeToggle'
import dynamic from 'next/dynamic'
import { useT } from '@/lib/i18n/useT'
import { useAuth } from '@/lib/context/AuthContext'

const LanguageSwitcher = dynamic(() => import('@/components/shared/LanguageSwitcher'), {
  ssr: false,
  loading: () => <div className="w-40 h-10 bg-muted rounded-lg animate-pulse" />,
})

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useT()
  const { isAuthenticated, user, logout } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const homeHref = isAuthenticated && user ? `/dashboard/${user.role}` : '/'

  const navLinks = [
    { href: homeHref, label: t('nav.home') },
    { href: '/about', label: t('nav.about') },
    { href: '/services', label: t('nav.services') },
    { href: '/resources', label: t('nav.resources') },
    { href: '/contact', label: t('nav.contact') },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href={mounted ? homeHref : '/'} className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <span className="text-sm font-bold text-white">A</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-bold text-foreground">{t('nav.brandName')}</p>
              <p className="text-xs text-muted-foreground">{t('nav.brandTagline')}</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {/* Auth Button */}
            {!mounted ? (
               <div className="hidden sm:inline-flex px-4 py-2 w-20 h-10 bg-muted rounded-lg animate-pulse" />
            ) : !isAuthenticated ? (
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary/90 transition-colors"
              >
                {t('nav.signIn')}
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link
                  href={homeHref}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    logout().then(() => {
                      window.location.href = '/'
                    })
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg hover:bg-muted p-2"
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <nav className="md:hidden border-t border-border/50 py-4 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {!mounted ? null : !isAuthenticated ? (
              <Link
                href="/auth/login"
                className="block px-4 py-2 text-sm font-medium text-center text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {t('nav.signIn')}
              </Link>
            ) : (
              <>
                <Link
                  href={homeHref}
                  className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    setIsOpen(false)
                    logout().then(() => {
                      window.location.href = '/'
                    })
                  }}
                  className="flex w-full items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}
