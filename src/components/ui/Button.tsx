import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        "rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        "border active:scale-[0.98] dark:backdrop-blur-xl",
        variant === "primary" &&
          "border-transparent bg-primary text-white hover:bg-primary-dark dark:border-primary-light/30 dark:bg-primary/80 dark:shadow-glow-primary dark:hover:bg-primary",
        variant === "secondary" &&
          "border-transparent bg-secondary-blue text-gray-900 hover:opacity-90 dark:border-white/15 dark:bg-white/[0.08] dark:text-gray-100 dark:hover:bg-white/[0.14]",
        variant === "danger" &&
          "border-transparent bg-danger text-white hover:opacity-90 dark:border-danger/30 dark:bg-danger/80 dark:hover:bg-danger",
        variant === "ghost" &&
          "border-transparent bg-transparent text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:border-white/10 dark:hover:bg-white/[0.06]",
        className
      )}
      {...props}
    />
  );
}
