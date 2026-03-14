"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { name: "Calendar", href: "calendar" },
  { name: "Travel", href: "travel" },
  { name: "Stays", href: "stays" },
  { name: "Ideas", href: "ideas" },
  { name: "People", href: "people" },
];

export default function TripNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex overflow-x-auto border-b border-gray-200 bg-white px-4 sm:px-6">
      {tabs.map((tab) => {
        const href = `/trips/${tripId}/${tab.href}`;
        const isActive = pathname === href;
        return (
          <Link
            key={tab.href}
            href={href}
            className={`shrink-0 px-3 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </nav>
  );
}
