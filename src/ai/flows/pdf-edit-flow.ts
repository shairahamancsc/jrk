
'use server';
/**
 * @fileOverview An AI flow for editing PDFs by adding a new page or redacting content.
 *
 * - modifyPdf - A function that handles the PDF modification process.
 * - ModifyPdfInput - The input type for the flow.
 * - ModifyPdfOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModifyPdfInputSchema = z.object({
  pdfTextContent: z.string().describe('The extracted text content of the original PDF.'),
  userPrompt: z.string().describe("The user's instructions for what to do."),
});
export type ModifyPdfInput = z.infer<typeof ModifyPdfInputSchema>;

const ModifyPdfOutputSchema = z.object({
  action: z.enum(['ADD_PAGE', 'REDACT_CONTENT', 'NO_ACTION']).describe("The action to perform based on the user's prompt."),
  generatedText: z.string().optional().describe('The AI-generated text for a new page, if action is ADD_PAGE.'),
  redactions: z.array(z.string()).optional().describe('A list of exact text strings to find and redact, if action is REDACT_CONTENT.'),
});
export type ModifyPdfOutput = z.infer<typeof ModifyPdfOutputSchema>;


export async function modifyPdf(input: ModifyPdfInput): Promise<ModifyPdfOutput> {
  return pdfModifyFlow(input);
}

const pdfModifyPrompt = ai.definePrompt({
  name: 'pdfModifyPrompt',
  input: { schema: ModifyPdfInputSchema },
  output: { schema: ModifyPdfOutputSchema },
  prompt: `You are an AI assistant that edits PDF documents based on user instructions.
Analyze the user's request and the document's content. Decide whether the user wants to ADD a new page or REDACT (remove/whiteout) content from the existing page.

1.  **If the user's request is to add new content like a summary, conclusion, or title page:**
    *   Set the 'action' field to 'ADD_PAGE'.
    *   Generate the requested text and put it in the 'generatedText' field. Be thorough and write complete content as requested.
    *   Leave the 'redactions' field empty.

2.  **If the user's request is to remove, delete, hide, or redact specific information (like names, addresses, IDs, dates):**
    *   Set the 'action' field to 'REDACT_CONTENT'.
    *   Identify the *exact* strings from the document content that need to be removed.
    *   Put these exact strings into the 'redactions' array.
    *   Leave the 'generatedText' field empty.

3.  **If the user's request is unclear or does not seem to be about adding a page or redacting content:**
    *   Set the 'action' field to 'NO_ACTION'.

User Request:
"{{userPrompt}}"

Original PDF Content (for context):
---
{{pdfTextContent}}
---

Now, provide your response in the required JSON format.`,
});

const pdfModifyFlow = ai.defineFlow(
  {
    name: 'pdfModifyFlow',
    inputSchema: ModifyPdfInputSchema,
    outputSchema: ModifyPdfOutputSchema,
  },
  async (input) => {
    const { output } = await pdfModifyPrompt(input);
    return output!;
  }
);
