import * as React from "react";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";

/**
 * TextField - Styled input field for Kardit design system
 * 
 * Usage:
 * <TextField label="Email" placeholder="Enter email" />
 * <TextField label="Password" type="password" />
 */

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  hint?: string;
  size?: "sm" | "md" | "lg";
  border?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, type, label, error, hint, size, border, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;
    const sizeClasses = {
      sm: "h-9 text-sm",
      md: "h-11 text-sm",
      lg: "h-12 text-base rounded-lg",
    };
    const toneClasses = "border-[hsl(var(--input))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))]";
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-foreground" >
            {label} 
          </label>
        )}
        <div className="relative">
          <input
            type={inputType}
            className={cn(
              "flex w-full rounded-md border px-3 py-2 text-sm",
              sizeClasses[size || "lg"],
              toneClasses,
              "placeholder:text-[hsl(var(--muted-foreground))]",
              "focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))/0.4] focus:border-[hsl(var(--ring))]",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "transition-colors duration-200",
              error && "border-[hsl(var(--destructive))] focus:ring-[hsl(var(--destructive))/0.35] focus:border-[hsl(var(--destructive))]",
              isPassword && "pr-10",
              className
            )}
            ref={ref}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-muted-foreground">{hint}</p>
        )}
      </div>
    );
  }
);
TextField.displayName = "TextField";

export { TextField };
