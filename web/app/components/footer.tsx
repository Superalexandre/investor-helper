import { Link } from "react-router";

export function Footer() {
    return (
        <div className="h-20 bg-navbar-background text-navbar-foreground">
            <div className="flex flex-col gap-1">
                <Link to="/contact" className="underline">Contact</Link>
                <Link to="/privacy" className="underline">Privacy</Link>
                <Link to="/terms" className="underline">Terms</Link>
            </div>
        </div>
    )
}