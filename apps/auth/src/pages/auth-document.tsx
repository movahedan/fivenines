import type { ReactNode } from "react";

interface AuthDocumentProps {
	readonly title: string;
	readonly brandHref?: string;
	readonly children: ReactNode;
}

const AUTH_SHELL_CSS = `
  :root {
    --background: #050912;
    --foreground: #e2e8f0;
    --card: #0a1228;
    --primary: #00ff88;
    --primary-foreground: #050912;
    --muted-foreground: #64748b;
    --destructive: #f87171;
    --info: #60a5fa;
    --border: #1e3a5f;
    --radius: 0.625rem;
  }
  * { box-sizing: border-box; }
  html, body { min-height: 100%; }
  body {
    margin: 0;
    font-family: Inter, system-ui, sans-serif;
    background: var(--background);
    color: var(--foreground);
  }
  main {
    max-width: 24rem;
    margin: 4rem auto;
    padding: 1.5rem;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: var(--radius);
  }
  .brand {
    margin: 0 0 1.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }
  .brand a { color: var(--foreground); text-decoration: none; }
  h1 {
    margin: 0 0 1rem;
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }
  label { display: block; margin-top: 1rem; font-size: 0.875rem; color: var(--muted-foreground); }
  input {
    width: 100%;
    margin-top: 0.35rem;
    padding: 0.55rem 0.7rem;
    color: var(--foreground);
    background: var(--background);
    border: 1px solid var(--border);
    border-radius: calc(var(--radius) - 2px);
  }
  input:focus {
    outline: 2px solid var(--primary);
    outline-offset: 1px;
  }
  button[type="submit"] {
    margin-top: 1.5rem;
    width: 100%;
    padding: 0.65rem;
    font-weight: 600;
    color: var(--primary-foreground);
    background: var(--primary);
    border: 0;
    border-radius: calc(var(--radius) - 2px);
    cursor: pointer;
  }
  button[type="submit"]:hover { filter: brightness(1.05); }
  button[type="submit"]:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }
  .error { color: var(--destructive); margin: 0.75rem 0 0; font-size: 0.9rem; }
  .info { color: var(--info); margin: 0.75rem 0 0; font-size: 0.9rem; }
  .links { margin: 1.5rem 0 0; font-size: 0.875rem; }
  .links a { color: var(--primary); margin-right: 1rem; }
`;

export function AuthDocument({ title, brandHref = "/login", children }: AuthDocumentProps) {
	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta content="width=device-width, initial-scale=1" name="viewport" />
				<meta content="#050912" name="theme-color" />
				<title>{title}</title>
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap"
					rel="stylesheet"
				/>
				<style>{AUTH_SHELL_CSS}</style>
			</head>
			<body>
				<main>
					<p className="brand">
						<a href={brandHref}>Five Nines</a>
					</p>
					{children}
				</main>
			</body>
		</html>
	);
}
