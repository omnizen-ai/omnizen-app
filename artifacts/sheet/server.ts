import { myProvider } from '@/lib/ai/providers';
import { sheetPrompt, updateDocumentPrompt } from '@/lib/ai/prompts';
import { createDocumentHandler } from '@/lib/artifacts/server';
import { streamObject } from 'ai';
import { z } from 'zod';

export const sheetDocumentHandler = createDocumentHandler<'sheet'>({
  kind: 'sheet',
  onCreateDocument: async ({ title, instructions, data, dataStream }) => {
    let draftContent = '';

    // Sheet artifacts REQUIRE data - no generation without data
    if (!data) {
      // Inform the user that data is required
      const errorMessage = 'Error: Sheet artifact requires data to be provided. Please fetch the data first using appropriate database tools.';
      
      dataStream.write({
        type: 'data-sheetDelta',
        data: errorMessage,
        transient: true,
      });
      
      return errorMessage;
    }

    // Use AI to format the provided data into a professional spreadsheet
    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: sheetPrompt,
      prompt: `Title: ${title}
Instructions: ${instructions || 'Format this data into a professional spreadsheet'}
Data: ${JSON.stringify(data)}`,
      schema: z.object({
        csv: z.string().describe('CSV formatted data'),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.write({
            type: 'data-sheetDelta',
            data: csv,
            transient: true,
          });

          draftContent = csv;
        }
      }
    }

    dataStream.write({
      type: 'data-sheetDelta',
      data: draftContent,
      transient: true,
    });

    return draftContent;
  },
  onUpdateDocument: async ({ document, description, dataStream }) => {
    let draftContent = '';

    // For updates, work with existing content
    const { fullStream } = streamObject({
      model: myProvider.languageModel('artifact-model'),
      system: updateDocumentPrompt(document.content, 'sheet'),
      prompt: description,
      schema: z.object({
        csv: z.string(),
      }),
    });

    for await (const delta of fullStream) {
      const { type } = delta;

      if (type === 'object') {
        const { object } = delta;
        const { csv } = object;

        if (csv) {
          dataStream.write({
            type: 'data-sheetDelta',
            data: csv,
            transient: true,
          });

          draftContent = csv;
        }
      }
    }

    return draftContent;
  },
});
