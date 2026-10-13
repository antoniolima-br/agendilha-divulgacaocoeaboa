import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AppShell } from './AppShell';

const state = vi.hoisted(() => ({ mobile: false }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => state.mobile }));
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: { id: 'owner' } }) }));
vi.mock('@/hooks/useAppPermissions', () => ({ useAppPermissions: () => ({ isAdmin: true }) }));
vi.mock('@/components/Header', () => ({ default: ({ onMobileMenuToggle }: { onMobileMenuToggle: () => void }) => <button onClick={onMobileMenuToggle}>Menu</button> }));
vi.mock('@/components/SidebarMenu', () => ({ SidebarMenu: () => <nav>Navigation</nav> }));
vi.mock('@/components/AppErrorBoundary', () => ({ AppErrorBoundary: ({ children }: { children: React.ReactNode }) => children }));
vi.mock('./SiteFooter', () => ({ SiteFooter: () => null }));
vi.mock('@/components/ui/sheet', () => ({
  Sheet: ({ open, children }: { open: boolean; children: React.ReactNode }) => open ? <div role="dialog">{children}</div> : null,
  SheetContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

afterEach(() => { cleanup(); state.mobile = false; });
const shell = () => <MemoryRouter><AppShell><p>Conteúdo</p></AppShell></MemoryRouter>;

describe('AppShell sidebar layout', () => {
  it('keeps the desktop sidebar mounted with a matching content offset and no drawer', () => {
    render(shell());
    const sidebar = screen.getByRole('complementary', { name: 'Menu principal' });
    expect(sidebar).toHaveClass('fixed', 'w-72', 'md:block');
    expect(screen.getByRole('main').parentElement).toHaveClass('md:pl-72');
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('keeps mobile drawers separate and closes them on desktop resize', () => {
    state.mobile = true;
    const view = render(shell());
    expect(screen.getByRole('complementary')).toHaveClass('hidden', 'md:block');
    fireEvent.click(screen.getByText('Menu'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    state.mobile = false;
    view.rerender(shell());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    state.mobile = true;
    view.rerender(shell());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});