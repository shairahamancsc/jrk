
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, BugPlay, Lightbulb, TerminalSquare } from 'lucide-react';
import { fixCodeProblem, type CodeFixerOutput } from '@/ai/flows/code-fixer-flow';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function CodeFixerPage() {
  const [codeSnippet, setCodeSnippet] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState<string>('');
  const [aiResponse, setAiResponse] = useState<CodeFixerOutput | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      const response = await fixCodeProblem({ codeSnippet, problemDescription });
      setAiResponse(response);
    } catch (err) {
      console.error("Error calling code fixer flow:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred. Check the console.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
          <BugPlay size={32} /> AI Code Fixer & Assistant
        </h1>
        <p className="text-muted-foreground">
          Paste your code snippet, describe the problem, and let AI help you find a solution.
        </p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Describe Your Code Issue</CardTitle>
          <CardDescription>Provide the code and a description of the problem you're facing.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="codeSnippet" className="text-lg font-semibold text-foreground mb-2 block">
                Code Snippet
              </Label>
              <Textarea
                id="codeSnippet"
                value={codeSnippet}
                onChange={(e) => setCodeSnippet(e.target.value)}
                placeholder="Paste your HTML, TSX, CSS, or JavaScript code here..."
                className="min-h-[200px] font-mono text-sm bg-muted/30 border-input focus:border-primary"
                rows={10}
              />
            </div>
            <div>
              <Label htmlFor="problemDescription" className="text-lg font-semibold text-foreground mb-2 block">
                Problem Description
              </Label>
              <Textarea
                id="problemDescription"
                value={problemDescription}
                onChange={(e) => setProblemDescription(e.target.value)}
                placeholder="Describe the error, unexpected behavior, or what you're trying to achieve..."
                className="min-h-[100px] border-input focus:border-primary"
                rows={5}
              />
            </div>
            <Button type="submit" disabled={isLoading} className="w-full md:w-auto bg-primary hover:bg-primary/90 text-base py-3 px-6">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing...
                </>
              ) : (
                <>
                  <BugPlay className="mr-2 h-5 w-5" /> Get AI Suggestion
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="shadow-md">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {aiResponse && (
        <Card className="shadow-lg mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl text-primary">
              <Lightbulb /> AI Suggestion
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {aiResponse.suggestedCode && aiResponse.suggestedCode.trim() !== '' && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                  <TerminalSquare /> Suggested Code:
                </h3>
                <div className="bg-muted/50 p-4 rounded-md overflow-x-auto">
                  <pre className="text-sm font-mono whitespace-pre-wrap">
                    <code>{aiResponse.suggestedCode}</code>
                  </pre>
                </div>
              </div>
            )}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-2">Explanation:</h3>
              <div 
                className="prose prose-sm max-w-none p-4 border rounded-md bg-background"
                dangerouslySetInnerHTML={{ __html: aiResponse.explanation.replace(/\\n/g, '<br />') }} 
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
