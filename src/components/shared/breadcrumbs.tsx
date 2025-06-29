
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split('/').filter(Boolean);

  const formatSegment = (segment: string) => {
    // Handle specific acronyms or weird casing
    if (segment.toLowerCase() === 'jpg-to-pdf') return 'JPG to PDF';
    if (segment.toLowerCase() === 'pdf-to-jpg') return 'PDF to JPG';
    if (segment.toLowerCase() === 'pdf-edit') return 'PDF Editor';
    if (segment.toLowerCase() === 'pdf-merge') return 'PDF Merger';
    if (segment.toLowerCase() === 'pdf-split') return 'PDF Splitter';
    if (segment.toLowerCase() === 'locations') return 'Locations';

    // General case: replace hyphens and capitalize words
    return segment
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Don't show breadcrumbs on the dashboard itself
  if (pathname === '/dashboard') {
    return null;
  }

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center space-x-2 text-sm text-muted-foreground"
    >
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 transition-colors hover:text-primary"
      >
        <Home className="h-4 w-4" />
        Dashboard
      </Link>
      {pathSegments.map((segment, index) => {
        // The root 'dashboard' segment is already handled by the Home link
        if (segment.toLowerCase() === 'dashboard') {
          return null;
        }

        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="h-4 w-4 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-foreground">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link href={href} className="transition-colors hover:text-primary">
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
