'use client';

import React from 'react';
import { ContentBlock } from '@/types/database';
import HeroEditor from './block-editors/HeroEditor';
import StatsEditor from './block-editors/StatsEditor';
import TestimonialsEditor from './block-editors/TestimonialsEditor';
import GalleryEditor from './block-editors/GalleryEditor';
import ContactEditor from './block-editors/ContactEditor';
import GeneralEditor from './block-editors/GeneralEditor';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface BlockEditorProps {
  block: ContentBlock;
  onChange: (newData: any) => void;
  tenantId: string;
  userRole: string;
}

export default function BlockEditor({
  block,
  onChange,
  tenantId,
  userRole,
}: BlockEditorProps) {
  const displayName = block.data?.title || `Sección ${block.block_type.replace('_', ' ')}`;

  const renderEditor = () => {
    switch (block.block_type) {
      case 'hero':
        return (
          <HeroEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
          />
        );
      case 'stats':
        return (
          <StatsEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
          />
        );
      case 'testimonial':
        return (
          <TestimonialsEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
          />
        );
      case 'gallery':
        return (
          <GalleryEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
          />
        );
      case 'map':
        return (
          <ContactEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
          />
        );
      default:
        // Editor genérico para why_us, education_levels, custom, etc.
        return (
          <GeneralEditor
            data={block.data}
            onChange={onChange}
            tenantId={tenantId}
            userRole={userRole}
          />
        );
    }
  };

  return (
    <Card className="border border-border shadow-sm">
      <CardHeader className="border-b bg-muted/20">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold capitalize">
              Editar: {displayName}
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              Modifica los textos, imágenes y configuraciones de esta sección.
            </CardDescription>
          </div>
          <span className="text-[10px] font-mono font-extrabold uppercase bg-muted border border-border px-2 py-0.5 rounded text-muted-foreground">
            {block.block_type}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-6 max-h-[calc(100vh-16rem)] overflow-y-auto">
        {renderEditor()}
      </CardContent>
    </Card>
  );
}
