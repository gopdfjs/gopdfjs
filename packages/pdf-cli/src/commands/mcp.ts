import fs from "node:fs";
import path from "node:path";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { compressPdf, grayscalePdf, linearizePdf } from "@gopdfjs/engine";
import { analyzePdf } from "../analyze.ts";
import { pdfToImages } from "@gopdfjs/extract";
import { ocrPdf } from "@gopdfjs/extract";
import {
  formatComparisonReport,
  measurePdfTokenComparison,
} from "./compareTokens.ts";

/**
 * Runs MCP Server over Stdio.
 * Auxiliary output should use stderr, so stdout is completely reserved for JSON-RPC messages.
 */
export async function runMcpServer(): Promise<number> {
  // Use stderr for debug messages to avoid polluting stdout
  console.error("Starting gopdf-mcp-server...");

  const server = new Server(
    {
      name: "gopdf-mcp-server",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Register tools list
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "compress_pdf",
        description: "Compresses a local PDF file, reducing its file size.",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the input PDF file" },
            outputPath: { type: "string", description: "Absolute path where compressed PDF will be saved" },
            level: {
              type: "string",
              enum: ["low", "recommended", "extreme"],
              description: "Compression strength. Default: recommended",
            },
          },
          required: ["inputPath", "outputPath"],
        },
      },
      {
        name: "grayscale_pdf",
        description: "Converts all pages of a PDF to grayscale.",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the input PDF file" },
            outputPath: { type: "string", description: "Absolute path where grayscale PDF will be saved" },
          },
          required: ["inputPath", "outputPath"],
        },
      },
      {
        name: "linearize_pdf",
        description: "Linearizes a PDF for Fast Web View optimization.",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the input PDF file" },
            outputPath: { type: "string", description: "Absolute path where linearized PDF will be saved" },
          },
          required: ["inputPath", "outputPath"],
        },
      },
      {
        name: "analyze_pdf",
        description: "Performs diagnostic analysis of the PDF's internal elements (font, image, and page counts).",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the PDF file to analyze" },
          },
          required: ["inputPath"],
        },
      },
      {
        name: "pdf_to_jpg",
        description: "Converts PDF pages into JPEG files using Node-native canvas.",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the input PDF file" },
            outputPath: {
              type: "string",
              description: "Absolute output base prefix or path (files will be appended with -page-<num>.jpg)",
            },
            quality: {
              type: "number",
              minimum: 0.1,
              maximum: 1.0,
              description: "JPEG compression quality from 0.1 to 1.0 (default: 0.92)",
            },
            scale: {
              type: "number",
              minimum: 0.5,
              maximum: 5.0,
              description: "Render scaling factor (default: 2)",
            },
          },
          required: ["inputPath", "outputPath"],
        },
      },
      {
        name: "ocr_pdf",
        description: "Extracts text from a local PDF by running OCR with tesseract.js.",
        inputSchema: {
          type: "object",
          properties: {
            inputPath: { type: "string", description: "Absolute path to the input PDF file" },
            outputPath: { type: "string", description: "Absolute path where the extracted text file will be saved" },
            lang: { type: "string", description: "OCR language library, e.g., 'eng' (default: eng)" },
          },
          required: ["inputPath", "outputPath"],
        },
      },
      {
        name: "compare_pdf_tokens",
        description:
          "Compares estimated AI input tokens for multimodal, full-text, and smart MCP PDF reading strategies.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Absolute path to the input PDF file" },
            targetPages: {
              type: "number",
              minimum: 1,
              description: "Pages fetched in the smart MCP path (default: 2)",
            },
            startPage: {
              type: "number",
              minimum: 1,
              description: "First page for measured sliced-text tokens (default: 1)",
            },
            endPage: {
              type: "number",
              minimum: 1,
              description: "Last page for measured sliced-text tokens (default: start + targetPages - 1)",
            },
          },
          required: ["path"],
        },
      },
    ],
  }));

  // Handle tool executions
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "compress_pdf": {
          const { inputPath, outputPath, level = "recommended" } = args as any;
          if (!fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }
          const bytes = new Uint8Array(fs.readFileSync(inputPath));
          const compressed = await compressPdf(bytes, level);
          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          fs.writeFileSync(outputPath, compressed);
          return {
            content: [
              {
                type: "text",
                text: `Successfully compressed PDF.\nInput: ${bytes.byteLength.toLocaleString()} bytes\nOutput: ${compressed.byteLength.toLocaleString()} bytes\nSaved: ${outputPath}`,
              },
            ],
          };
        }

        case "grayscale_pdf": {
          const { inputPath, outputPath } = args as any;
          if (!fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }
          const bytes = new Uint8Array(fs.readFileSync(inputPath));
          const result = await grayscalePdf(bytes);
          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          fs.writeFileSync(outputPath, result);
          return {
            content: [
              {
                type: "text",
                text: `Successfully grayscaled PDF and saved to: ${outputPath}`,
              },
            ],
          };
        }

        case "linearize_pdf": {
          const { inputPath, outputPath } = args as any;
          if (!fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }
          const bytes = new Uint8Array(fs.readFileSync(inputPath));
          const result = await linearizePdf(bytes);
          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          fs.writeFileSync(outputPath, result);
          return {
            content: [
              {
                type: "text",
                text: `Successfully linearized PDF and saved to: ${outputPath}`,
              },
            ],
          };
        }

        case "analyze_pdf": {
          const { inputPath } = args as any;
          const report = await analyzePdf(inputPath);
          const sizeMb = (report.sizeBytes / 1024 / 1024).toFixed(2);
          const reportText = [
            `=== PDF Diagnostic Report ===`,
            `File: ${report.fileName}`,
            `Size: ${sizeMb} MB (${report.sizeBytes.toLocaleString()} bytes)`,
            `Pages: ${report.pageCount}`,
            `Fonts: ${report.fontCount}`,
            `Form XObjects: ${report.formCount}`,
            `Image XObjects: ${report.imageCount}`,
            `=============================`,
          ].join("\n");
          return {
            content: [{ type: "text", text: reportText }],
          };
        }

        case "pdf_to_jpg": {
          const { inputPath, outputPath, quality = 0.92, scale = 2 } = args as any;
          if (!fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }
          const bytes = new Uint8Array(fs.readFileSync(inputPath));
          const results = await pdfToImages(bytes, quality, scale);

          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          const createdFiles: string[] = [];

          for (const { bytes: imgBytes, page } of results) {
            let pagePath: string;
            const lower = outputPath.toLowerCase();
            if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
              const ext = path.extname(outputPath);
              const base = outputPath.slice(0, -ext.length);
              pagePath = `${base}-page-${page}${ext}`;
            } else {
              pagePath = `${outputPath}-page-${page}.jpg`;
            }
            fs.writeFileSync(pagePath, imgBytes);
            createdFiles.push(pagePath);
          }

          return {
            content: [
              {
                type: "text",
                text: `Successfully rendered ${results.length} page(s) to JPG.\nFiles created:\n${createdFiles.join("\n")}`,
              },
            ],
          };
        }

        case "ocr_pdf": {
          const { inputPath, outputPath, lang = "eng" } = args as any;
          if (!fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }
          const bytes = new Uint8Array(fs.readFileSync(inputPath));
          const text = await ocrPdf(bytes, lang);

          fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
          fs.writeFileSync(outputPath, text, "utf8");

          return {
            content: [
              {
                type: "text",
                text: `Successfully executed OCR and wrote full text to: ${outputPath}`,
              },
            ],
          };
        }

        case "compare_pdf_tokens": {
          const {
            path: inputPath,
            targetPages = 2,
            startPage = 1,
            endPage,
          } = args as {
            path: string;
            targetPages?: number;
            startPage?: number;
            endPage?: number;
          };

          if (!inputPath || !fs.existsSync(inputPath)) {
            throw new McpError(ErrorCode.InvalidParams, `Input file not found: ${inputPath}`);
          }

          const resolvedEnd = endPage ?? startPage + targetPages - 1;
          if (resolvedEnd < startPage) {
            throw new McpError(
              ErrorCode.InvalidParams,
              "endPage must be greater than or equal to startPage",
            );
          }

          const payload = await measurePdfTokenComparison(inputPath, {
            targetPages,
            startPage,
            endPage: resolvedEnd,
            includeOneImage: true,
          });

          return {
            content: [
              {
                type: "text",
                text: formatComparisonReport(
                  payload.fileName,
                  payload,
                  payload.sliceRange,
                ),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      console.error(`Error in tool execution ${name}:`, error);
      return {
        content: [
          {
            type: "text",
            text: `Error executing tool ${name}: ${error?.message || error}`,
          },
        ],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("gopdf-mcp-server connected to Stdio transport.");

  // Keep process running (mcp-sdk connection handles stdio events)
  return new Promise(() => {});
}
