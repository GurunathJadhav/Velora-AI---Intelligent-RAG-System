import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind classes with clsx for conditional class names.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
