"use strict";
/**
 * Pihhthon Header Formatter
 * Copyright (C) 2025 Filipe Sá
 *
 * This file is part of Pihhthon Header Formatter.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License,
 * or (at your option) any later version.
 */
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
    // Step 2: Expand arithmetic expressions only
    const expandedLines = [];
    for (const line of alignedLines) {
        if (!line.includes("=")) {
            expandedLines.push(line);
            continue;
        }
        const [lhs, rhsRaw] = line.split("=");
        const rhs = rhsRaw.trim();
        // Don't expand if it's:
        const isString = /^["'].*["']$/.test(rhs);
        const isArray = /^\[.*\]$/.test(rhs);
        const isObject = /^\{.*\}$/.test(rhs);
        const isNumber = /^[\d.\-+eE]+$/.test(rhs); // handles scientific notation
        if (isString || isArray || isObject || isNumber) {
            expandedLines.push(line);
            continue;
        }
        const tokens = splitExpression(rhs);
        const operators = ["+", "-", "*", "/"];
        const isSimpleExpr = tokens.length > 1 && tokens.some((t) => operators.includes(t));
        if (!isSimpleExpr) {
            expandedLines.push(line);
            continue;
        }
        // Expand expression
        expandedLines.push(`${lhs.trim()} = (`);
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            const nextToken = tokens[i + 1] || "";
            if (operators.includes(nextToken)) {
                expandedLines.push(`  ${token} ${nextToken}`);
                i++; // skip operator
            }
            else {
                expandedLines.push(`  ${token}`);
            }
        }
        expandedLines.push(")");
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