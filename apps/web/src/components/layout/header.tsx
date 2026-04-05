import { UserButton } from "@clerk/nextjs";

interface HeaderProps {
  title: string;
  action?: React.ReactNode;
}

export function Header({ title, action }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <div className="flex items-center gap-3">
          {action}
          <UserButton />
        </div>
      </div>
    </header>
  );
}
