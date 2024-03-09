import { twMerge } from "tailwind-merge"


export default function UICard({ children, className }: { children: React.ReactNode, className?: string }) {
    return <div className={twMerge("bg-zinc-900 border border-zinc-700", className)}>
        {children}
    </div>
}


UICard.Header = ({ children }: { children: React.ReactNode }) => <div className="text-lg p-2 bg-zinc-800 text-center">{children}</div>
UICard.Body = ({ children }: { children: React.ReactNode }) => <div className="p-2 text-sm">{children}</div>
UICard.Footer = ({ children }: { children: React.ReactNode }) => <div className="border-t border-zinc-800 p-2">{children}</div>
