import { Link } from "@tanstack/react-router";
import logo from "@/assets/logo.png";

type LogoProps = {
  className?: string;
  imageClassName?: string;
};

export function Logo({ className = "", imageClassName = "" }: LogoProps) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center shrink-0 ${className}`}
      aria-label="Wossol Export home"
    >
      <img
        src={logo}
        alt="Wossol Export"
        className={`h-12 w-auto object-contain md:h-14 ${imageClassName}`}
      />
    </Link>
  );
}
