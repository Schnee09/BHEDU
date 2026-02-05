import * as fs from "fs";
import * as path from "path";

const TOKENS_PATH = path.join(__dirname, "../design_tokens.json");
const TS_OUTPUT = path.join(__dirname, "../../web/lib/design-tokens.ts");
const DART_OUTPUT = path.join(
    __dirname,
    "../../flutter_app/lib/config/design_tokens.dart",
);

function hexToDartColor(hex: string): string {
    if (hex.startsWith("#")) {
        hex = hex.substring(1);
    }
    if (hex.length === 6) {
        hex = "FF" + hex;
    }
    return `Color(0x${hex.toUpperCase()})`;
}

function generateTS(tokens: any): string {
    return `/**
 * GENERATED CODE - DO NOT MODIFY BY HAND
 * Synchronized with .shared/design_tokens.json
 */

export const DESIGN_TOKENS = ${JSON.stringify(tokens, null, 2)} as const;

export type DesignTokens = typeof DESIGN_TOKENS;
`;
}

function generateDart(tokens: any): string {
    let output = `import 'package:flutter/material.dart';

/**
 * GENERATED CODE - DO NOT MODIFY BY HAND
 * Synchronized with .shared/design_tokens.json
 */

class DesignTokens {
  DesignTokens._();

  static const String brandName = '${tokens.brand.name}';
  static const String brandVersion = '${tokens.brand.version}';

`;

    // Colors
    output += "  // Colors\n";
    const colors = tokens.colors;

    // Primary
    for (const [key, value] of Object.entries(colors.primary)) {
        if (typeof value === "string") {
            output += `  static const Color primary${
                key.charAt(0).toUpperCase() + key.slice(1)
            } = ${hexToDartColor(value)};\n`;
        }
    }

    // Neutral
    output += "\n  // Neutral Slate\n";
    for (const [key, value] of Object.entries(colors.neutral.slate)) {
        output += `  static const Color slate${key} = ${
            hexToDartColor(value as string)
        };\n`;
    }

    output += "\n  // Semantic\n";
    output += `  static const Color success = ${
        hexToDartColor(colors.semantic.success)
    };\n`;
    output += `  static const Color warning = ${
        hexToDartColor(colors.semantic.warning)
    };\n`;
    output += `  static const Color error = ${
        hexToDartColor(colors.semantic.error)
    };\n`;
    output += `  static const Color info = ${
        hexToDartColor(colors.semantic.info)
    };\n`;

    output += "\n  // Theme Specific\n";
    output += `  static const Color darkBackground = ${
        hexToDartColor(colors.dark.background)
    };\n`;
    output += `  static const Color darkSurface = ${
        hexToDartColor(colors.dark.surface)
    };\n`;

    output += "}\n";
    return output;
}

function main() {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, "utf-8"));

    // Ensure directories exist
    [path.dirname(TS_OUTPUT), path.dirname(DART_OUTPUT)].forEach((dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    });

    fs.writeFileSync(TS_OUTPUT, generateTS(tokens));
    fs.writeFileSync(DART_OUTPUT, generateDart(tokens));

    console.log("✅ Tokens generated successfully!");
}

main();
