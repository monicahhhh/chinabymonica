import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Code,
  Pilcrow,
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  onImageUpload?: (file: File) => Promise<string>;
  /** Optional handler for pasted HTML (e.g., WeChat article detection). Return true if handled. */
  onPasteHtml?: (html: string) => Promise<boolean>;
}

function MenuBar({
  editor,
  onImageUpload,
}: {
  editor: ReturnType<typeof useEditor>;
  onImageUpload?: (file: File) => Promise<string>;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const handleImageUpload = useCallback(async () => {
    if (onImageUpload) {
      fileInputRef.current?.click();
    } else {
      const url = prompt("输入图片 URL:");
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onImageUpload]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onImageUpload) return;
      try {
        const url = await onImageUpload(file);
        editor?.chain().focus().setImage({ src: url }).run();
      } catch (err) {
        console.error("Image upload failed:", err);
      }
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [editor, onImageUpload]
  );

  const handleLink = useCallback(() => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = prompt("输入链接 URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  }, [editor]);

  const btnClass = (active: boolean) =>
    `h-8 w-8 p-0 ${active ? "bg-gray-200 text-gray-900" : "text-gray-600 hover:bg-gray-100"}`;

  return (
    <div className="flex flex-wrap gap-0.5 p-2 border-b border-gray-200 bg-gray-50 rounded-t-md">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Text format */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="粗体"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="斜体"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="下划线"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="删除线"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("code"))}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="行内代码"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Headings */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("heading", { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="标题1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("heading", { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="标题2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("heading", { level: 3 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="标题3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("paragraph"))}
        onClick={() => editor.chain().focus().setParagraph().run()}
        title="正文"
      >
        <Pilcrow className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Alignment */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        title="左对齐"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        title="居中"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        title="右对齐"
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Lists & blocks */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="无序列表"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="有序列表"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="引用"
      >
        <Quote className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="分割线"
      >
        <Minus className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Media */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass(editor.isActive("link"))}
        onClick={handleLink}
        title="链接"
      >
        <LinkIcon className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
        onClick={handleImageUpload}
        title="插入图片"
      >
        <ImageIcon className="h-4 w-4" />
      </Button>

      <div className="w-px h-8 bg-gray-200 mx-1" />

      {/* Undo/Redo */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="撤销"
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 p-0 text-gray-600 hover:bg-gray-100"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="重做"
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "开始编辑文章内容...",
  onImageUpload,
  onPasteHtml,
}: RichTextEditorProps) {
  const onPasteHtmlRef = useRef(onPasteHtml);
  onPasteHtmlRef.current = onPasteHtml;
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Image.configure({
        HTMLAttributes: { class: "max-w-full h-auto rounded-md" },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-600 underline cursor-pointer" },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Underline,
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose max-w-none min-h-[300px] p-4 focus:outline-none [&_p]:my-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-4 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:my-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_hr]:my-4",
      },
      handlePaste: (view, event) => {
        const html = event.clipboardData?.getData("text/html");
        if (html && onPasteHtmlRef.current) {
          // Let the callback decide if it wants to handle this paste
          onPasteHtmlRef.current(html).then(handled => {
            // If handled, the parent will update content via onChange
          }).catch(() => {});
          // Don't prevent default here — let TipTap handle normal paste
          // The parent will override content if it detects WeChat HTML
        }
        return false; // Let TipTap handle the paste normally
      },
    },
  });

  // Sync external content changes (e.g., when switching between articles)
  const prevContentRef = useRef(content);
  useEffect(() => {
    if (editor && content !== prevContentRef.current) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== content) {
        editor.commands.setContent(content);
      }
      prevContentRef.current = content;
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <MenuBar editor={editor} onImageUpload={onImageUpload} />
      <EditorContent editor={editor} />
    </div>
  );
}
