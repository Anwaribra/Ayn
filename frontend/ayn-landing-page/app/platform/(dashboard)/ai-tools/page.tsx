"use client"

import type React from "react"

import { Header } from "@/components/platform/header"
import { api } from "@/lib/api"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Sparkles, FileText, MessageSquare, HelpCircle, Search, Loader2, Copy, Check } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AIToolsPage() {
  const [activeTab, setActiveTab] = useState("generate")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false)

  // Form states
  const [prompt, setPrompt] = useState("")
  const [context, setContext] = useState("")
  const [content, setContent] = useState("")
  const [maxLength, setMaxLength] = useState("100")
  const [text, setText] = useState("")
  const [focus, setFocus] = useState("")
  const [topic, setTopic] = useState("")
  const [level, setLevel] = useState<"basic" | "intermediate" | "advanced">("intermediate")
  const [extractText, setExtractText] = useState("")
  const [criteria, setCriteria] = useState("")

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerateAnswer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.generateAnswer(prompt, context)
      setResult(response.result)
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Failed to generate"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSummarize = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.summarize(content, Number.parseInt(maxLength))
      setResult(response.result)
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Failed to summarize"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateComment = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.generateComment(text, focus)
      setResult(response.result)
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Failed to generate comment"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.explain(topic, level)
      setResult(response.result)
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Failed to explain"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleExtractEvidence = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const response = await api.extractEvidence(extractText, criteria)
      setResult(response.result)
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Failed to extract"))
    } finally {
      setIsLoading(false)
    }
  }

  const tools = [
    { id: "generate", label: "Generate Answer", icon: Sparkles },
    { id: "summarize", label: "Summarize", icon: FileText },
    { id: "comment", label: "Generate Comments", icon: MessageSquare },
    { id: "explain", label: "Explain", icon: HelpCircle },
    { id: "extract", label: "Extract Evidence", icon: Search },
  ]

  return (
    <div className="min-h-screen">
      <Header title="AI Tools" description="AI-powered assistance for quality assurance" />

      <div className="p-4 md:p-[var(--spacing-content)]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tools Panel */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-5 mb-6">
                {tools.map((tool) => (
                  <TabsTrigger key={tool.id} value={tool.id} className="text-xs px-2">
                    <tool.icon className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">{tool.label.split(" ")[0]}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="generate">
                <form onSubmit={handleGenerateAnswer} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Prompt *</Label>
                    <Textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Enter your question or prompt..."
                      rows={4}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Context (optional)</Label>
                    <Textarea
                      value={context}
                      onChange={(e) => setContext(e.target.value)}
                      placeholder="Additional context..."
                      rows={3}
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading || !prompt}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Generate Answer
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="summarize">
                <form onSubmit={handleSummarize} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Content to Summarize *</Label>
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Paste the content you want to summarize..."
                      rows={6}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Words</Label>
                    <Input
                      type="number"
                      value={maxLength}
                      onChange={(e) => setMaxLength(e.target.value)}
                      min="50"
                      max="500"
                      className="bg-background/50 w-32"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading || !content}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4 mr-2" />
                    )}
                    Summarize
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="comment">
                <form onSubmit={handleGenerateComment} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Text to Comment On *</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Enter the text you want to generate comments for..."
                      rows={6}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Focus Area (optional)</Label>
                    <Input
                      value={focus}
                      onChange={(e) => setFocus(e.target.value)}
                      placeholder="e.g., quality, clarity, completeness"
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading || !text}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 mr-2" />
                    )}
                    Generate Comments
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="explain">
                <form onSubmit={handleExplain} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Topic *</Label>
                    <Input
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="Enter the topic to explain..."
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Explanation Level</Label>
                    <Select value={level} onValueChange={(v) => setLevel(v as typeof level)}>
                      <SelectTrigger className="bg-background/50 w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" disabled={isLoading || !topic}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <HelpCircle className="w-4 h-4 mr-2" />
                    )}
                    Explain
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="extract">
                <form onSubmit={handleExtractEvidence} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Text to Extract From *</Label>
                    <Textarea
                      value={extractText}
                      onChange={(e) => setExtractText(e.target.value)}
                      placeholder="Paste the text to extract evidence from..."
                      rows={6}
                      className="bg-background/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Specific Criteria (optional)</Label>
                    <Input
                      value={criteria}
                      onChange={(e) => setCriteria(e.target.value)}
                      placeholder="e.g., leadership, documentation"
                      className="bg-background/50"
                    />
                  </div>
                  <Button type="submit" disabled={isLoading || !extractText}>
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Extract Evidence
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>

          {/* Result Panel */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Result</h3>
              {result && (
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              )}
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : result ? (
              <div className="bg-muted/30 rounded-lg p-4 min-h-[300px]">
                <p className="text-foreground whitespace-pre-wrap">{result}</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                <p className="text-muted-foreground">AI-generated results will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
