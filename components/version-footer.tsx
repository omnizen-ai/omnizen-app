'use client';
import { motion } from 'framer-motion';
import { useWindowSize } from 'usehooks-ts';
import { useRestoreDocumentVersion } from '@/lib/api/hooks/use-chat-documents';

import type { Document } from '@/lib/types/database';
import { getDocumentTimestampByIndex } from '@/lib/utils';

import { LoaderIcon } from './icons';
import { Button } from './ui/button';
import { useArtifact } from '@/hooks/use-artifact';

interface VersionFooterProps {
  handleVersionChange: (type: 'next' | 'prev' | 'toggle' | 'latest') => void;
  documents: Array<Document> | undefined;
  currentVersionIndex: number;
}

export const VersionFooter = ({
  handleVersionChange,
  documents,
  currentVersionIndex,
}: VersionFooterProps) => {
  const { artifact } = useArtifact();

  const { width } = useWindowSize();
  const isMobile = width < 768;

  const restoreVersion = useRestoreDocumentVersion();

  if (!documents) return;

  return (
    <motion.div
      className="absolute flex flex-col gap-4 lg:flex-row bottom-0 bg-background p-4 w-full border-t z-50 justify-between"
      initial={{ y: isMobile ? 200 : 77 }}
      animate={{ y: 0 }}
      exit={{ y: isMobile ? 200 : 77 }}
      transition={{ type: 'spring', stiffness: 140, damping: 20 }}
    >
      <div>
        <div>You are viewing a previous version</div>
        <div className="text-muted-foreground text-sm">
          Restore this version to make edits
        </div>
      </div>

      <div className="flex flex-row gap-4">
        <Button
          disabled={restoreVersion.isPending}
          onClick={() => {
            const timestamp = getDocumentTimestampByIndex(
              documents,
              currentVersionIndex,
            );
            
            if (timestamp) {
              restoreVersion.mutate(
                { 
                  documentId: artifact.documentId, 
                  timestamp 
                },
                {
                  onSuccess: () => {
                    handleVersionChange('latest');
                  }
                }
              );
            }
          }}
        >
          <div>Restore this version</div>
          {restoreVersion.isPending && (
            <div className="animate-spin">
              <LoaderIcon />
            </div>
          )}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            handleVersionChange('latest');
          }}
        >
          Back to latest version
        </Button>
      </div>
    </motion.div>
  );
};
