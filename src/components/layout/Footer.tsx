export function Footer() {
  return (
    <footer className="h-11 bg-card border-t border-border hidden lg:flex items-center justify-between px-3 lg:px-4 text-[10px] sm:text-xs text-muted-foreground font-medium shrink-0">
      <div>© 2026 Super Steel ERP v1.0</div>
      <div>
        Design & Developed by{" "}
        <a
          href="https://7techitservices.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors font-semibold text-foreground underline decoration-dotted underline-offset-2"
        >
          7tech IT Services
        </a>
      </div>
    </footer>
  );
}
