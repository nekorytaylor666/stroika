import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export const { Link, redirect, usePathname, useRouter } = createSharedPathnamesNavigation({ locales });