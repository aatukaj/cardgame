import { twMerge } from "tailwind-merge";

type ButtonProps = { variant: keyof typeof buttonVariants } & React.ButtonHTMLAttributes<HTMLButtonElement>;

const buttonVariants = {
    "blue": "bg-blue-500 border-blue-400",
    "red": "bg-red-500 border-red-400",
    "green": "bg-green-500 border-green-400",
}


export default function Button({ variant, className, ...props }: ButtonProps) {
    return (
        <button className={twMerge("appearance-none cursor-pointer border text-center text-l h-8", buttonVariants[variant], className)}{...props} />
    )
}
