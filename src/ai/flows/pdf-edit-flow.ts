
'use server';
/**
 * @fileOverview An AI flow for editing PDFs by adding a new page with generated content.
 *
 * - generatePdfPage - A function that handles the content generation for a new PDF page.
 * - GeneratePdfPageInput - The input type for the flow.
 * - GeneratePdfPageOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

export const GeneratePdfPageInputSchema = z.object({
  pdfTextContent: z.string().describe('The extracted text content of the original PDF.'),
  userPrompt: z.string().describe("The user's instructions for what content to generate for the new page."),
});
export type GeneratePdfPageInput = z.infer<typeof GeneratePdfPageInputSchema>;

export const GeneratePdfPageOutputSchema = z.object({
  generatedText: z.string().describe('The AI-generated text to be placed on the new page.'),
});
export type GeneratePdfPageOutput = z.infer<typeof GeneratePdfPageOutputSchema>;


export async function generatePdfPage(input: GeneratePdfPageInput): Promise<GeneratePdfPageOutput> {
  return pdfEditFlow(input);
}

const pdfEditPrompt = ai.definePrompt({
  name: 'pdfEditPrompt',
  input: { schema: GeneratePdfPageInputSchema },
  output: { schema: GeneratePdfPageOutputSchema },
  prompt: `You are an AI assistant that adds content to PDF documents.
Based on the user's request and the document's content, you will generate text for a new page.

User Request:
"{{userPrompt}}"

Original PDF Content (for context):
---
{{pdfTextContent}}
---

Generate the text for the new page based on the user's request. Only return the text to be added to the new page. Be thorough and write complete paragraphs as requested.`,
});

const pdfEditFlow = ai.defineFlow(
  {
    name: 'pdfEditFlow',
    inputSchema: GeneratePdfPageInputSchema,
    outputSchema: GeneratePdfPageOutputSchema,
  },
  async (input) => {
    const { output } = await pdfEditPrompt(input);
    return output!;
  }
);
