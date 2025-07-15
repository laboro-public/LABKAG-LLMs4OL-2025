"use client";

import { useState, useRef } from "react";
import {
  Upload,
  FileText,
  Zap,
  Send,
  Loader2,
  CheckCircle2,
  Download,
} from "lucide-react";

import { createTaxonomyPrompt } from "./Prompt";

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  jsonData?: any[];
}

interface ChatResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

const chatAPI = {
  sendMessage: async (
    messages: Array<{ role: string; content: string }>
  ): Promise<string> => {
    const response = await fetch(`${API_BASE_URL}/openai/chatCompletion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data: ChatResponse = await response.json();
    return data.choices[0].message.content;
  },
};

export default function TaxonomyDiscoveryTool() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [lastAnalysisResults, setLastAnalysisResults] = useState<any[] | null>(
    null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractJSON = (response: string): any[] | null => {
    const jsonArrayMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonArrayMatch) {
      try {
        const parsed = JSON.parse(jsonArrayMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.warn("Failed to parse matched JSON array:", error);
      }
    }

    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1]);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.warn("Failed to parse code block JSON:", error);
      }
    }

    try {
      const parsed = JSON.parse(response);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (error) {
      console.warn("Response is not valid JSON:", error);
    }

    return null;
  };

  const downloadJSON = (jsonData: any[], filename?: string) => {
    const dataStr = JSON.stringify(jsonData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName =
      filename ||
      `taxonomy-relationships-${new Date().toISOString().split("T")[0]}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setLastAnalysisResults(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);

      const lines = content.split("\n").filter((line) => line.trim()).length;
      const fileMessage: Message = {
        text: `📁 File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB, ${lines} lines)`,
        isUser: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fileMessage]);
    };
    reader.readAsText(file);
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const runTaxonomyAnalysis = async () => {
    if (!fileContent) {
      alert("Please upload a file first");
      return;
    }

    const lines = fileContent.split("\n").filter((line) => line.trim());

    setIsLoading(true);
    setLastAnalysisResults(null);

    const analysisMessage: Message = {
      text: `🔍 Analyzing taxonomy relationships from ${lines.length} terms...`,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, analysisMessage]);

    try {
      const prompt = createTaxonomyPrompt(fileContent);
      const response = await chatAPI.sendMessage([
        { role: "user", content: prompt },
      ]);

      const extractedJSON = extractJSON(response);

      if (extractedJSON && Array.isArray(extractedJSON)) {
        const uniqueParents = Array.from(
          new Set(extractedJSON.map((r) => r.parent))
        );
        const uniqueChildren = Array.from(
          new Set(extractedJSON.map((r) => r.child))
        );

        const stats = {
          totalRelationships: extractedJSON.length,
          uniqueParents: uniqueParents.length,
          uniqueChildren: uniqueChildren.length,
          totalInputLines: lines.length,
          coverageRatio:
            ((extractedJSON.length / lines.length) * 100).toFixed(2) + "%",
          parentChildOverlap: uniqueParents.filter((parent) =>
            uniqueChildren.includes(parent)
          ).length,
        };

        const successText = `✅ Analysis Complete!\n\n📊 Statistics:\n- Total relationships: ${stats.totalRelationships}\n- Unique parents: ${stats.uniqueParents}\n- Unique children: ${stats.uniqueChildren}\n- Coverage ratio: ${stats.coverageRatio}\n- Terms that are both parent and child: ${stats.parentChildOverlap}\n- Total input terms: ${lines.length}\n\n🎉 JSON Results Available for Download!`;

        setLastAnalysisResults(extractedJSON);

        const aiMessage: Message = {
          text: successText,
          isUser: false,
          timestamp: new Date(),
          jsonData: extractedJSON,
        };

        setMessages((prev) => [...prev, aiMessage]);
      } else {
        const errorMessage: Message = {
          text: `❌ Analysis failed: Could not extract valid JSON from the response. Please try again.`,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        text: `❌ Error during analysis: ${error instanceof Error ? error.message : "Something went wrong"}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: Message = {
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = fileContent
      ? `${inputMessage}\n\nFile content (snippet):\n${fileContent.substring(0, 2000)}...`
      : inputMessage;
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatAPI.sendMessage([
        { role: "user", content: messageToSend },
      ]);

      const aiMessage: Message = {
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        text: `❌ Error: ${error instanceof Error ? error.message : "Something went wrong"}`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Taxonomy Discovery Tool
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-blue-600" />
                Upload Data
              </h3>

              <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer hover:border-blue-400 hover:bg-blue-50 ${
                  isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.json"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {uploadedFile ? (
                  <div className="space-y-3">
                    <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                    <div>
                      <p className="font-semibold text-gray-900">
                        {uploadedFile.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(uploadedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Upload className="w-12 h-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="font-semibold text-gray-700">
                        Drop your file here
                      </p>
                      <p className="text-sm text-gray-500">
                        or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Supports .txt, .csv, .json
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={runTaxonomyAnalysis}
              disabled={!fileContent || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              <span>
                {isLoading ? "Analyzing..." : "Run Taxonomy Analysis"}
              </span>
            </button>

            {lastAnalysisResults && (
              <button
                onClick={() =>
                  downloadJSON(
                    lastAnalysisResults,
                    uploadedFile
                      ? `taxonomy-${uploadedFile.name.split(".")[0]}.json`
                      : undefined
                  )
                }
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Download className="w-5 h-5" />
                <span>Download JSON Results</span>
              </button>
            )}

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Analysis Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Messages</span>
                  <span className="font-semibold text-gray-900">
                    {messages.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">File Status</span>
                  <span
                    className={`font-semibold ${uploadedFile ? "text-green-600" : "text-gray-400"}`}
                  >
                    {uploadedFile ? "Ready" : "None"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Analysis State</span>
                  <span
                    className={`font-semibold ${isLoading ? "text-blue-600" : "text-gray-400"}`}
                  >
                    {isLoading ? "Running" : "Idle"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Results Available</span>
                  <span
                    className={`font-semibold ${lastAnalysisResults ? "text-green-600" : "text-gray-400"}`}
                  >
                    {lastAnalysisResults ? "Yes" : "No"}
                  </span>
                </div>
                {fileContent && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Lines</span>
                    <span className="font-semibold text-gray-900">
                      {
                        fileContent.split("\n").filter((line) => line.trim())
                          .length
                      }
                    </span>
                  </div>
                )}
                {lastAnalysisResults && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Relationships</span>
                    <span className="font-semibold text-gray-900">
                      {lastAnalysisResults.length}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-[600px] flex flex-col">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  Analysis Results
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  View your taxonomy discovery results and chat with the AI
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-lg font-medium mb-2">
                      Ready to analyze your data
                    </p>
                    <p className="text-gray-400 text-sm">
                      Upload a file and run taxonomy analysis to get started
                    </p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-2xl shadow-sm ${
                          message.isUser
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                            : "bg-gray-50 text-gray-800 border border-gray-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.text}
                        </p>
                        {message.jsonData && !message.isUser && (
                          <button
                            onClick={() =>
                              downloadJSON(
                                message.jsonData!,
                                `message-${index}-results.json`
                              )
                            }
                            className="mt-3 inline-flex items-center space-x-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded-lg transition-colors duration-200"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download</span>
                          </button>
                        )}
                        <p
                          className={`text-xs mt-2 ${message.isUser ? "text-blue-100" : "text-gray-500"}`}
                        >
                          {message.timestamp.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-2xl shadow-sm">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500">
                          AI is processing chunks...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100">
                <div className="flex space-x-3">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask questions about your data or taxonomy analysis..."
                    className="flex-1 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    rows={2}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputMessage.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
                  >
                    <Send className="w-4 h-4" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
