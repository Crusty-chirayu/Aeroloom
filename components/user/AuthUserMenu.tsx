'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Chip } from '@/components/ui/Chip';
import { getSupabaseBrowserClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { ImportWatchlistDialog } from './ImportWatchlistDialog';
import { siteConfig } from '@/lib/site-config';

interface UserProfile {
  email?: string;
  name?: string;
  avatarUrl?: string;
}

export function AuthUserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authMethod, setAuthMethod] = useState<'magic' | 'password'>('magic');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Check auth state on mount
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUser({
          email: data.user.email,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
          avatarUrl: data.user.user_metadata?.avatar_url,
        });
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          email: session.user.email,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          avatarUrl: session.user.user_metadata?.avatar_url,
        });
      } else {
        setUser(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true);
    setAuthError(null);
    setAuthMessage(null);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteConfig.url}/auth/callback`,
        },
      });
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'OAuth sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthError('Supabase is not configured on this instance.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${siteConfig.url}/auth/callback`,
        },
      });

      if (error) {
        setAuthError(error.message);
      } else {
        setAuthMessage('Login link sent! Please check your email inbox.');
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Failed to send login link');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setIsLoading(true);
    setAuthError(null);
    setAuthMessage(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setAuthError('Supabase is not configured on this instance.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        // If login failed, attempt signup
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          const { error: signUpErr, data: signUpData } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
              data: {
                full_name: email.split('@')[0],
              },
            },
          });

          if (signUpErr) {
            setAuthError(signUpErr.message);
          } else if (signUpData?.user && !signUpData.session) {
            setAuthMessage('Account created! Please check your email to confirm registration.');
          } else {
            setAuthMessage('Account registered and logged in successfully.');
          }
        } else {
          setAuthError(error.message);
        }
      }
    } catch (err: unknown) {
      setAuthError(err instanceof Error ? err.message : 'Sign-in failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
      setUser(null);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Menu Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-[var(--r-sm)] border border-[var(--line-strong)] bg-[var(--surface)] hover:bg-[var(--paper-2)] text-[var(--ink)] text-xs font-mono transition-colors shadow-sm"
        aria-label="User account menu"
        aria-expanded={isOpen}
      >
        {user ? (
          <>
            <span className="w-5 h-5 rounded-full bg-[var(--signal)] text-[var(--paper)] flex items-center justify-center font-bold text-[10px]">
              {(user.name || user.email || 'U')[0].toUpperCase()}
            </span>
            <span className="hidden sm:inline font-semibold">{user.name || 'Account'}</span>
          </>
        ) : (
          <>
            <Icon name="user" className="w-3.5 h-3.5 text-[var(--ink-2)]" />
            <span className="hidden sm:inline">Guest</span>
            <Chip variant="neutral" className="hidden md:inline-flex text-[9px] py-0 px-1">
              LOCAL
            </Chip>
          </>
        )}
        <Icon name="chevron-down" className="w-3 h-3 text-[var(--ink-3)]" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-[var(--surface)] border border-[var(--line-strong)] rounded-[var(--r-md)] shadow-xl p-3 z-50 text-xs font-mono space-y-3 animate-fade-in">
          {/* Header section */}
          <div className="border-b border-[var(--line)] pb-2.5">
            <span className="text-[10px] text-[var(--ink-3)] uppercase block tracking-wider font-semibold">PERSISTENCE MODE</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold text-[var(--ink)] text-xs">
                {user ? 'Cloud Synced' : 'Device Local Storage'}
              </span>
              <Chip variant={user ? 'ok' : 'neutral'} dot>
                {user ? 'AUTH' : 'GUEST'}
              </Chip>
            </div>
            {user && (
              <span className="text-[11px] text-[var(--ink-3)] block mt-0.5 truncate">
                {user.email}
              </span>
            )}
          </div>

          {/* Action Links */}
          <div className="space-y-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setIsImportOpen(true);
              }}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded hover:bg-[var(--paper-2)] text-[var(--ink)] transition-colors text-left"
            >
              <Icon name="upload" className="w-3.5 h-3.5 text-[var(--ink-3)]" />
              <span>Import / Export Backup</span>
            </button>
          </div>

          {/* Auth Providers or Sign Out */}
          <div className="border-t border-[var(--line)] pt-2.5 space-y-2.5">
            {!user ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[var(--ink-3)] uppercase tracking-wider font-semibold">
                    SIGN IN TO SYNC
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAuthMethod('magic')}
                      className={`hover:underline ${authMethod === 'magic' ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink-3)]'}`}
                    >
                      Magic Link
                    </button>
                    <span className="text-[var(--line-strong)]">|</span>
                    <button
                      type="button"
                      onClick={() => setAuthMethod('password')}
                      className={`hover:underline ${authMethod === 'password' ? 'font-bold text-[var(--ink)]' : 'text-[var(--ink-3)]'}`}
                    >
                      Password
                    </button>
                  </div>
                </div>

                {/* Email Sign In Form */}
                <form
                  onSubmit={authMethod === 'magic' ? handleMagicLinkLogin : handlePasswordSignIn}
                  className="space-y-2"
                >
                  <input
                    type="email"
                    required
                    placeholder="pilot@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading || !isSupabaseConfigured()}
                    className="w-full px-2.5 py-1.5 rounded bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] placeholder:text-[var(--ink-3)] text-xs font-mono focus:outline-none focus:border-[var(--signal)] disabled:opacity-50"
                  />

                  {authMethod === 'password' && (
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading || !isSupabaseConfigured()}
                      className="w-full px-2.5 py-1.5 rounded bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] placeholder:text-[var(--ink-3)] text-xs font-mono focus:outline-none focus:border-[var(--signal)] disabled:opacity-50"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || !isSupabaseConfigured()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded bg-[var(--signal)] text-[var(--paper)] hover:opacity-90 font-bold transition-opacity disabled:opacity-50 text-xs"
                  >
                    <Icon name="compass" className="w-3 h-3" />
                    <span>
                      {isLoading
                        ? 'Verifying…'
                        : authMethod === 'magic'
                          ? 'Send Magic Link'
                          : 'Sign In / Register'}
                    </span>
                  </button>
                </form>

                {/* Status and Error Messages */}
                {authMessage && (
                  <div className="p-2 rounded bg-[var(--ok-ink)]/10 border border-[var(--ok-ink)]/20 text-[var(--ok-ink)] text-[10px] leading-tight">
                    {authMessage}
                  </div>
                )}
                {authError && (
                  <div className="p-2 rounded bg-[var(--bad-ink)]/10 border border-[var(--bad-ink)]/20 text-[var(--bad-ink)] text-[10px] leading-tight">
                    {authError}
                  </div>
                )}

                {/* OAuth Alternatives */}
                <div className="relative py-1 flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[var(--line)]"></div>
                  </div>
                  <span className="relative px-2 bg-[var(--surface)] text-[9px] text-[var(--ink-3)] uppercase tracking-wider">
                    Or Social OAuth
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('google')}
                    disabled={isLoading || !isSupabaseConfigured()}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-2)] text-[var(--ink)] transition-colors disabled:opacity-50 text-[11px]"
                  >
                    <Icon name="globe" className="w-3 h-3" />
                    <span>Google</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuthLogin('github')}
                    disabled={isLoading || !isSupabaseConfigured()}
                    className="flex items-center justify-center gap-1.5 px-2 py-1.5 rounded border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--paper-2)] text-[var(--ink)] transition-colors disabled:opacity-50 text-[11px]"
                  >
                    <Icon name="activity" className="w-3 h-3" />
                    <span>GitHub</span>
                  </button>
                </div>

                {!isSupabaseConfigured() && (
                  <span className="text-[9px] text-[var(--ink-3)] block italic text-center pt-1">
                    Cloud sync requires Supabase keys
                  </span>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded border border-[var(--bad-ink)]/30 text-[var(--bad-ink)] hover:bg-[var(--paper-2)] transition-colors"
              >
                <Icon name="logout" className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      <ImportWatchlistDialog
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
      />
    </div>
  );
}
