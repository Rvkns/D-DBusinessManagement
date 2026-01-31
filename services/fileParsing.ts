import { LoreDocument } from "../types";

// Declare global types for external libraries loaded via CDN
declare const pdfjsLib: any;
declare const mammoth: any;

export const parseFile = async (file: File): Promise<LoreDocument> => {
  const fileType = file.name.split('.').pop()?.toLowerCase();
  let content = "";
  let type: 'pdf' | 'docx' | 'txt' = 'txt';

  try {
    if (fileType === 'pdf') {
      type = 'pdf';
      content = await parsePdf(file);
    } else if (fileType === 'docx') {
      type = 'docx';
      content = await parseDocx(file);
    } else {
      type = 'txt';
      content = await parseText(file);
    }

    return {
      id: crypto.randomUUID(),
      name: file.name,
      content: content,
      type: type,
      size: file.size
    };
  } catch (error) {
    console.error("Error parsing file", error);
    throw new Error(`Failed to parse ${file.name}`);
  }
};

const parseText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result as string || "");
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

const parsePdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += `[Page ${i}]\n${pageText}\n\n`;
  }
  return fullText;
};

const parseDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
  return result.value;
};