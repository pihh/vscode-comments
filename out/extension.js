"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activate = activate;
const vscode = __importStar(require("vscode"));
function activate(context) {
    // Format Comment Headers (Ctrl+Alt+C)
    const formatComments = vscode.commands.registerCommand("extension.formatCommentHeaders", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor");
            return;
        }
        const doc = editor.document;
        const languageId = doc.languageId;
        const selection = editor.selection;
        const selectedText = doc.getText(selection);
        const formatted = formatSectionHeaders(selectedText, languageId);
        editor.edit((editBuilder) => {
            editBuilder.replace(selection, formatted);
        });
    });
    // Format Code Block (Ctrl+Alt+F)
    const formatCode = vscode.commands.registerCommand("extension.formatCodeBlock", () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor");
            return;
        }
        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        const formatted = formatSelectedBlock(selectedText);
        editor.edit((editBuilder) => {
            editBuilder.replace(selection, formatted);
        });
    });
    context.subscriptions.push(formatComments, formatCode);
}
// ===== COMMENT HEADER FORMATTER =====
function formatSectionHeaders(code, languageId, totalLength = 43, symbol = "=") {
    const lines = code.split("\n");
    // Choose comment style
    const commentPrefix = languageId === "python" ? "#" : "//";
    const formatted = lines.map((line) => {
        const trimmed = line.trim();
        // If it's a comment or any line with content
        if ((trimmed.startsWith(commentPrefix) || trimmed.length > 0) &&
            !trimmed.startsWith("#!") // skip Python shebang
        ) {
            const content = trimmed.startsWith(commentPrefix)
                ? trimmed.slice(commentPrefix.length).trim()
                : trimmed;
            const contentUpper = content.toUpperCase();
            const prefix = `${commentPrefix} ${contentUpper} `;
            const padding = symbol.repeat(Math.max(0, totalLength - prefix.length));
            return prefix + padding;
        }
        return line;
    });
    return formatted.join("\n");
}
// ===== CODE FORMATTER =====
function formatSelectedBlock(code) {
    const lines = code.split("\n");
    // Step 1: Align `=`
    const eqLines = lines.filter((line) => line.includes("="));
    const maxLhsLen = Math.max(...eqLines.map((line) => line.split("=")[0].trim().length), 0);
    const alignedLines = lines.map((line) => {
        if (!line.includes("="))
            return line;
        const [lhs, rhs] = line.split("=");
        const lhsClean = lhs.trim();
        const rhsClean = rhs.trim();
        const paddedLhs = lhsClean.padEnd(maxLhsLen, " ");
        return `${paddedLhs} = ${rhsClean}`;
    });
    // Step 2: Multiline RHS if complex expr
    const expandedLines = [];
    for (const line of alignedLines) {
        if (!line.includes("=")) {
            expandedLines.push(line);
            continue;
        }
        const [lhs, rhs] = line.split("=");
        const trimmedRhs = rhs.trim();
        const tokens = splitExpression(trimmedRhs);
        if (tokens.length <= 1) {
            expandedLines.push(line);
        }
        else {
            expandedLines.push(`${lhs.trim()} = (`);
            for (let i = 0; i < tokens.length; i++) {
                const isLast = i === tokens.length - 1;
                expandedLines.push(`  ${tokens[i]}${isLast ? "" : " " + tokens[i + 1]}`);
                i++; // Skip operator
            }
            expandedLines.push(")");
        }
    }
    return expandedLines.join("\n");
}
function splitExpression(expr) {
    return expr
        .split(/(\+|\-|\*|\/)/)
        .map((p) => p.trim())
        .filter(Boolean);
}
//# sourceMappingURL=extension.js.map