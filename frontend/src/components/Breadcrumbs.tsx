import { Link } from "react-router-dom";

interface BreadcrumbsProps {
  path: { label: string }[];
  onHome?: () => void;
}

export function Breadcrumbs({ path, onHome }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-2 text-sm text-star-500"
    >
      <Link to="/" onClick={onHome} className="hover:text-star-700">
        Home
      </Link>
      {path.map((item, index) => (
        <span key={`${item.label}-${index}`}>/ {item.label}</span>
      ))}
    </nav>
  );
}
