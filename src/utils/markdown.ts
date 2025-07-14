import { marked } from 'marked';
import DOMPurify from 'dompurify';

/**
 * MarkdownをHTMLに変換し、サニタイズする
 * @param md Markdown文字列
 * @returns サニタイズされたHTML文字列
 */
export const mdToHtml = (md: string): string => {
  if (!md) return '';
  const html = marked.parse(md) as string;
  return DOMPurify.sanitize(html);
}; 