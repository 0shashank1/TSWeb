import { Link, useNavigate } from "@tanstack/react-router";
import { paths } from "@/config/paths";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const logout = useLogout();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSettled: () => navigate({ to: paths.login }),
    });
  };

  return (
    <div className="app">
      <header className="app__nav">
        <Link to={paths.home} className="app__brand">
          TextShare
        </Link>
        <nav className="app__links">
          {isAuthenticated ? (
            <>
              <Link to={paths.snippets}>Snippets</Link>
              <span className="app__user">{user?.displayName}</span>
              <Button variant="ghost" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Link to={paths.login}>Log in</Link>
              <Link to={paths.register}>Register</Link>
            </>
          )}
        </nav>
      </header>
      <main className="app__content">{children}</main>
    </div>
  );
}
