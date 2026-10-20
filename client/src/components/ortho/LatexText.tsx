import React, { useMemo } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material';

/**
 * Strips LaTeX and math syntax into clean, standard Unicode plain text.
 * Perfect for clipboard copying, PDF exports, and print views.
 */
export function cleanLatexText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    // Remove block math $$...$$ and inline math $...$
    .replace(/\$\$([\s\S]*?)\$\$/g, '$1')
    .replace(/\$([^\$]+?)\$/g, '$1')
    // Standard mathematical symbols
    .replace(/\\ge\b/g, '≥')
    .replace(/\\geq\b/g, '≥')
    .replace(/\\le\b/g, '≤')
    .replace(/\\leq\b/g, '≤')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\ne\b/g, '≠')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\to\b/g, '→')
    .replace(/\\in\b/g, '∈')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\sum\b/g, '∑')
    .replace(/\^\\circ\b/g, '°')
    .replace(/\\circ\b/g, '°')
    // Greek letters
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\mu\b/g, 'μ')
    // LaTeX text commands
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\textbf\{([^}]+)\}/g, '$1')
    .replace(/\\textit\{([^}]+)\}/g, '$1')
    .replace(/\\mathrm\{([^}]+)\}/g, '$1')
    // Escaped symbols
    .replace(/\\%/g, '%')
    .replace(/\\_/g, '_')
    .replace(/\\&/g, '&')
    .replace(/\\#/g, '#')
    .replace(/\\\$/g, '$')
    // Clean redundant spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * Transforms a string containing mixed text, markdown bold, and LaTeX formulas ($...$ or $$...$$ or loose LaTeX)
 * into safe HTML with KaTeX rendered math.
 */
export function renderLatexToHtml(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';

  // Split into math segments ($$...$$ or $...$) and standard text
  const parts = text.split(/(\$\$[\s\S]*?\$\$|\$[^\$]+?\$)/g);

  return parts
    .map(part => {
      // Display Math $$...$$
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const formula = part.slice(2, -2).trim();
        try {
          return katex.renderToString(formula, { displayMode: true, throwOnError: false, strict: false });
        } catch {
          return `<span class="katex-error">${cleanLatexText(formula)}</span>`;
        }
      }

      // Inline Math $...$
      if (part.startsWith('$') && part.endsWith('$')) {
        const formula = part.slice(1, -1).trim();
        try {
          return katex.renderToString(formula, { displayMode: false, throwOnError: false, strict: false });
        } catch {
          return `<span class="katex-error">${cleanLatexText(formula)}</span>`;
        }
      }

      // Standard text with loose LaTeX commands (e.g. \ge 1.5–3.0\text{ Тл} or \alpha \ge 60^\circ)
      let formatted = part;

      if (/\\(ge|le|pm|times|approx|alpha|beta|gamma|Delta|theta|lambda|mu|circ|text|ne|cdot|to|in)\b/.test(formatted)) {
        formatted = formatted
          .replace(/\\ge\b/g, '≥')
          .replace(/\\geq\b/g, '≥')
          .replace(/\\le\b/g, '≤')
          .replace(/\\leq\b/g, '≤')
          .replace(/\\approx\b/g, '≈')
          .replace(/\\pm\b/g, '±')
          .replace(/\\times\b/g, '×')
          .replace(/\\cdot\b/g, '·')
          .replace(/\\to\b/g, '→')
          .replace(/\\in\b/g, '∈')
          .replace(/\^\\circ\b/g, '°')
          .replace(/\\circ\b/g, '°')
          .replace(/\\alpha\b/g, 'α')
          .replace(/\\beta\b/g, 'β')
          .replace(/\\gamma\b/g, 'γ')
          .replace(/\\Delta\b/g, 'Δ')
          .replace(/\\theta\b/g, 'θ')
          .replace(/\\lambda\b/g, 'λ')
          .replace(/\\mu\b/g, 'μ')
          .replace(/\\text\{([^}]+)\}/g, '$1');
      }

      // Simple Markdown support: **bold** and `code`
      formatted = formatted
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/`([^`]+)`/g, '<code style="background: #F1F5F9; padding: 2px 4px; border-radius: 4px; font-size: 0.85em;">$1</code>')
        .replace(/\n/g, '<br />');

      return formatted;
    })
    .join('');
}

export interface LatexTextProps {
  text?: string | null;
  component?: React.ElementType;
  sx?: SxProps<Theme>;
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption' | 'overline';
  color?: string;
  className?: string;
  cleanOnly?: boolean;
}

/**
 * LatexText Component
 * Dynamically parses and renders mathematical notation using KaTeX onscreen,
 * ensuring high typographic fidelity for angles, degrees, Greek letters, and formulas.
 */
export const LatexText: React.FC<LatexTextProps> = ({
  text,
  component = 'span',
  sx,
  variant,
  color,
  className,
  cleanOnly = false
}) => {
  if (!text) return null;

  if (cleanOnly) {
    const cleaned = cleanLatexText(text);
    if (variant) {
      return (
        <Typography component={component} variant={variant} color={color} sx={sx} className={className}>
          {cleaned}
        </Typography>
      );
    }
    return (
      <Box component={component} sx={{ color, ...sx }} className={className}>
        {cleaned}
      </Box>
    );
  }

  const html = useMemo(() => renderLatexToHtml(text), [text]);

  const defaultSx: SxProps<Theme> = {
    display: component === 'div' || component === 'p' ? 'block' : 'inline',
    lineHeight: 'inherit',
    '& .katex': {
      fontSize: '1.02em',
      lineHeight: 1
    },
    '& .katex-display': {
      margin: '0.4em 0'
    },
    ...sx
  };

  if (variant) {
    return (
      <Typography
        component={component}
        variant={variant}
        color={color}
        sx={defaultSx}
        className={className}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <Box
      component={component}
      sx={defaultSx}
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default LatexText;
