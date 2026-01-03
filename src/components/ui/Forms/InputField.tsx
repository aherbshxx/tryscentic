import { Eye, EyeOff } from "lucide-react";
import React, {
    type ChangeEvent,
    type ReactNode,
    useState, // 1. Import useState
    useMemo // 2. Optional: useMemo for icon selection
} from "react";
// 3. Import necessary icons (replace these with your actual icon library imports)
// I'm using placeholder names here (EyeIcon, EyeOffIcon). 
// You will need to import these from your chosen library (e.g., Lucide, Heroicons, Material Icons).

// Assuming you have a way to import icons. 
// For demonstration, I'll use simple text for the icons for now, 
// but you should replace them with actual SVG or component imports.

/* // Example of how you might import them:
import { Eye as EyeIcon, EyeOff as EyeOffIcon } from 'lucide-react'; 
*/

// Placeholder for Eye Icons (You MUST replace this with real icon components)
const EyeIcon: React.FC<{ className?: string }> = ({ className }) => <Eye size={16} className={className} />;
const EyeOffIcon: React.FC<{ className?: string }> = ({ className }) => <EyeOff size={16} className={className} />;
// ---

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    icon: ReactNode;
    // placeholder, value, onChange are covered by InputHTMLAttributes but we can keep them explicit if we want to enforce them
    // but typically extending covers it.
    // Let's keep them explicit if they were required, but InputHTMLAttributes makes them optional.
    // So let's just add the specific ones we need or make the interface extend it.
}

export const InputField: React.FC<InputFieldProps> = ({
    icon,
    type = "text", // defaulting type here
    className, // explicit extraction if needed, though usually passed in rest
    ...props
}) => {
    // 4. State to manage password visibility (only relevant if type is 'password')
    const isPasswordField = type === "password";
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // 5. Function to toggle visibility state
    const togglePasswordVisibility = () => {
        setIsPasswordVisible(prev => !prev);
    };

    // 6. Determine the actual input type to use
    const actualInputType = useMemo(() => {
        if (!isPasswordField) {
            return type; // Use the provided type if not a password field
        }
        return isPasswordVisible ? "text" : "password"; // Toggle type for password field
    }, [isPasswordField, isPasswordVisible, type]);

    // 7. Determine the toggle icon to display
    const ToggleIconComponent = isPasswordVisible ? EyeOffIcon : EyeIcon;

    const isDisabled = props.disabled;

    return (
        // Added 'flex' class to the container to ensure proper layout if needed, 
        // but 'relative w-full' is still the key for positioning.
        <div className="relative w-full">
            {/* Left Icon (Original Icon) */}
            <div className={`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-colors ${isDisabled ? 'text-white/70' : 'text-[#511624]'}`}>
                {icon}
            </div>

            <input
                // 8. Use the actualInputType
                type={actualInputType}
                {...props}
                // All input styling converted to Tailwind. Added 'pr-12' for space for the toggle icon.
                className={`
                    bg-white/90 text-sm text-gray-900 border border-gray-300 placeholder:text-gray-500
                    shadow-inner
                    w-full py-3 pl-10 rounded-lg 
                    transition-all duration-200
                    focus:outline-none focus:border-[#511624] 
                    focus:ring-3 focus:ring-[#511624]/10 
                    ${isPasswordField ? 'pr-12' : 'pr-4'}
                    ${isDisabled ? '!bg-gray-700 !border !border-red !text-white' : ''}
                `}
            />

            {/* 9. Conditional rendering for the Password Toggle Icon */}
            {isPasswordField && (
                <button
                    type="button" // Important: Prevent button from submitting a form
                    onClick={togglePasswordVisibility}
                    // Styling and positioning for the toggle button
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#511624] hover:text-[#511624]/80 z-20 transition-colors duration-200"
                    aria-label={isPasswordVisible ? "Hide password" : "Show password"}
                >
                    <ToggleIconComponent className="w-5 h-5" />
                </button>
            )}
        </div>
    );
};