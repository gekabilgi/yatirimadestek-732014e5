interface ChatHeaderProps {
  sessionTitle: string;
}

export function ChatHeader({ sessionTitle }: ChatHeaderProps) {
  return (
    <div className="border-b bg-background">
      <div className="flex items-center justify-center p-4">
        <h1 className="text-xl font-semibold">{sessionTitle}</h1>
      </div>
    </div>
  );
}
