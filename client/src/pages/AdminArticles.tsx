import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2, Plus, Pencil, Trash2, Eye, EyeOff, Star, ArrowLeft, LogOut,
  X, ImageIcon, Languages, Save, FileText, Sparkles, Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import RichTextEditor from "@/components/RichTextEditor";
import ArticlePreview from "@/components/ArticlePreview";
import { useAutoSaveDraft } from "@/hooks/useAutoSaveDraft";
import { isWeChatHtml, cleanWeChatHtml, extractWeChatImages } from "@shared/wechatCleaner";

const CATEGORY_LABELS: Record<string, { zh: string; en: string }> = {
  "global-growth": { zh: "出海洞察", en: "Global Growth Insights" },
  "geopolitical-trends": { zh: "地缘趋势", en: "Geopolitical Trends" },
  "unicorn-analysis": { zh: "独角兽拆解", en: "Unicorn Analysis" },
};

type ArticleFormData = {
  slug: string;
  category: "global-growth" | "geopolitical-trends" | "unicorn-analysis";
  titleZH: string;
  titleEN: string;
  subtitleZH: string;
  subtitleEN: string;
  contentZH: string;
  contentEN: string;
  coverImage: string;
  author: string;
  published: boolean;
  featured: boolean;
  publishedAt: string; // YYYY-MM-DD, empty means use default behavior
};

const emptyForm: ArticleFormData = {
  slug: "",
  category: "global-growth",
  titleZH: "",
  titleEN: "",
  subtitleZH: "",
  subtitleEN: "",
  contentZH: "",
  contentEN: "",
  coverImage: "",
  author: "Monica Wang",
  published: false,
  featured: false,
  publishedAt: "",
};

/* ===== Cover Image Upload ===== */
function CoverImageUpload({
  value,
  onChange,
  onUpload,
  onGenerate,
}: {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  onGenerate?: () => Promise<string>;
}) {
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast.error("请选择图片文件");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片大小不能超过 10MB");
        return;
      }
      setUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
        toast.success("封面图片上传成功！");
      } catch (err) {
        toast.error("上传失败：" + (err as Error).message);
      } finally {
        setUploading(false);
      }
      e.target.value = "";
    },
    [onChange, onUpload]
  );

  const handleGenerate = useCallback(async () => {
    if (!onGenerate) return;
    setGenerating(true);
    try {
      const url = await onGenerate();
      onChange(url);
      toast.success("封面图片生成成功！");
    } catch (err) {
      toast.error("生成失败：" + (err as Error).message);
    } finally {
      setGenerating(false);
    }
  }, [onGenerate, onChange]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>封面图片</Label>
        {onGenerate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={generating || uploading}
            className="text-xs h-7"
          >
            {generating ? (
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="mr-1 h-3 w-3" />
            )}
            {generating ? "生成中..." : "AI 生成封面"}
          </Button>
        )}
      </div>
      {value ? (
        <div className="relative group">
          <img
            src={value}
            alt="封面预览"
            className="w-full h-48 object-cover rounded-md border border-gray-200"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading || generating}
          />
          {uploading || generating ? (
            <>
              <Loader2 className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              <span className="text-sm text-gray-500">{generating ? "AI 生成中..." : "上传中..."}</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-500">点击上传封面图片</span>
              <span className="text-xs text-gray-400 mt-1">支持 JPG、PNG、WebP，最大 10MB</span>
            </>
          )}
        </label>
      )}
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="或直接输入图片 URL"
          className="text-xs"
        />
      </div>
    </div>
  );
}

/* ===== Article Form with all new features ===== */
function ArticleForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting,
  draftKey,
}: {
  initialData: ArticleFormData;
  onSubmit: (data: ArticleFormData) => Promise<boolean>;
  onCancel: () => void;
  isSubmitting: boolean;
  draftKey: string;
}) {
  const [form, setForm] = useState<ArticleFormData>(initialData);
  const [showPreview, setShowPreview] = useState(false);
  const [translatingZH, setTranslatingZH] = useState(false);
  const [translatingEN, setTranslatingEN] = useState(false);
  const [rehostingImages, setRehostingImages] = useState(false);
  const formRef = useRef(form);
  formRef.current = form;

  const uploadMutation = trpc.upload.image.useMutation();
  const translateMutation = trpc.translate.article.useMutation();
  const rehostMutation = trpc.rehostImage.fromUrl.useMutation();
  const generateImageMutation = trpc.generateImage.cover.useMutation();

  // Auto-save draft
  const draft = useAutoSaveDraft(draftKey, () => formRef.current);

  // Prompt to restore draft on mount
  const [draftChecked, setDraftChecked] = useState(false);
  useEffect(() => {
    if (draftChecked) return;
    setDraftChecked(true);
    if (draft.hasDraft) {
      const saved = draft.loadDraft<ArticleFormData>();
      if (saved && (saved.titleZH || saved.titleEN || saved.contentZH || saved.contentEN)) {
        const shouldRestore = window.confirm(
          "检测到未保存的草稿，是否恢复？\n\n点击【确定】恢复草稿，点击【取消】使用原始内容。"
        );
        if (shouldRestore) {
          setForm(saved);
          toast.success("草稿已恢复");
        } else {
          draft.clearDraft();
        }
      }
    }
  }, [draftChecked, draft]);

  const updateField = <K extends keyof ArticleFormData>(key: K, value: ArticleFormData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    draft.markDirty();
  };

  // Auto-generate slug from English title
  const generateSlug = () => {
    const slug = form.titleEN
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
    updateField("slug", slug);
  };

  // Upload image to S3 via tRPC
  const handleImageUpload = useCallback(
    async (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64 = (reader.result as string).split(",")[1];
            const result = await uploadMutation.mutateAsync({
              base64,
              mimeType: file.type,
              fileName: file.name,
            });
            resolve(result.url);
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
    },
    [uploadMutation]
  );

  // ===== Auto-Translate =====
  const handleTranslate = async (direction: "zh-to-en" | "en-to-zh") => {
    const sourceContent = direction === "zh-to-en" ? form.contentZH : form.contentEN;
    if (!sourceContent || sourceContent.trim().length < 10) {
      toast.error(direction === "zh-to-en" ? "请先输入中文内容" : "Please enter English content first");
      return;
    }

    const setLoading = direction === "zh-to-en" ? setTranslatingEN : setTranslatingZH;
    setLoading(true);

    try {
      const result = await translateMutation.mutateAsync({
        content: sourceContent,
        direction,
      });

      if (result.translated) {
        if (direction === "zh-to-en") {
          updateField("contentEN", result.translated);
          // Also translate title and subtitle if empty
          if (!form.titleEN && form.titleZH) {
            const titleResult = await translateMutation.mutateAsync({
              content: form.titleZH,
              direction: "zh-to-en",
            });
            if (titleResult.translated) updateField("titleEN", titleResult.translated);
          }
          if (!form.subtitleEN && form.subtitleZH) {
            const subResult = await translateMutation.mutateAsync({
              content: form.subtitleZH,
              direction: "zh-to-en",
            });
            if (subResult.translated) updateField("subtitleEN", subResult.translated);
          }
        } else {
          updateField("contentZH", result.translated);
          if (!form.titleZH && form.titleEN) {
            const titleResult = await translateMutation.mutateAsync({
              content: form.titleEN,
              direction: "en-to-zh",
            });
            if (titleResult.translated) updateField("titleZH", titleResult.translated);
          }
          if (!form.subtitleZH && form.subtitleEN) {
            const subResult = await translateMutation.mutateAsync({
              content: form.subtitleEN,
              direction: "en-to-zh",
            });
            if (subResult.translated) updateField("subtitleZH", subResult.translated);
          }
        }
        toast.success(direction === "zh-to-en" ? "已自动翻译为英文" : "已自动翻译为中文");
      }
    } catch (err) {
      toast.error("翻译失败：" + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ===== WeChat Paste Handler =====
  const handleWeChatPaste = useCallback(
    async (html: string, targetField: "contentZH" | "contentEN") => {
      if (!isWeChatHtml(html)) return false;

      toast.info("检测到微信公众号内容，正在自动清理格式...");

      // Clean the HTML
      let cleaned = cleanWeChatHtml(html);

      // Extract and re-host WeChat images
      const wechatImages = extractWeChatImages(html);
      if (wechatImages.length > 0) {
        setRehostingImages(true);
        toast.info(`正在转存 ${wechatImages.length} 张图片...`);

        for (const imgUrl of wechatImages) {
          try {
            const result = await rehostMutation.mutateAsync({ imageUrl: imgUrl });
            // Replace all occurrences of the old URL with the new one
            cleaned = cleaned.replace(new RegExp(imgUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), result.url);
          } catch (err) {
            console.warn("Failed to re-host image:", imgUrl, err);
            // Keep original URL if re-hosting fails
          }
        }
        setRehostingImages(false);
        toast.success(`${wechatImages.length} 张图片已转存`);
      }

      updateField(targetField, cleaned);
      toast.success("微信文章内容已导入并格式化");
      return true;
    },
    [rehostMutation, updateField]
  );

  // ===== AI Cover Image Generation =====
  const handleGenerateCoverImage = useCallback(async (): Promise<string> => {
    if (!form.titleZH && !form.titleEN) {
      throw new Error("请先输入文章标题");
    }
    const result = await generateImageMutation.mutateAsync({
      titleZH: form.titleZH,
      titleEN: form.titleEN,
    });
    return result.url;
  }, [form.titleZH, form.titleEN, generateImageMutation]);

  // Handle form submit with draft cleanup
  const handleSubmit = async () => {
    const success = await onSubmit(form);
    if (success) {
      draft.clearDraft();
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-save status bar */}
      <div className="flex items-center justify-between text-xs text-gray-400 border-b border-gray-100 pb-2">
        <div className="flex items-center gap-2">
          {draft.statusText && (
            <>
              <Save className="h-3 w-3" />
              <span>{draft.statusText}</span>
            </>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
            className="text-xs h-7"
          >
            <Eye className="mr-1 h-3 w-3" /> 预览
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => draft.saveNow()}
            className="text-xs h-7"
          >
            <Save className="mr-1 h-3 w-3" /> 保存草稿
          </Button>
        </div>
      </div>

      {/* Title row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>中文标题 *</Label>
          <Input
            value={form.titleZH}
            onChange={e => updateField("titleZH", e.target.value)}
            placeholder="文章中文标题"
          />
        </div>
        <div className="space-y-2">
          <Label>English Title *</Label>
          <Input
            value={form.titleEN}
            onChange={e => updateField("titleEN", e.target.value)}
            placeholder="Article English Title"
          />
        </div>
      </div>

      {/* Slug & Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>URL Slug *</Label>
          <div className="flex gap-2">
            <Input
              value={form.slug}
              onChange={e => updateField("slug", e.target.value)}
              placeholder="article-url-slug"
            />
            <Button type="button" variant="outline" size="sm" onClick={generateSlug}>
              Auto
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>分类 *</Label>
          <Select
            value={form.category}
            onValueChange={(v) => updateField("category", v as ArticleFormData["category"])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label.zh} / {label.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Subtitle */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>中文副标题</Label>
          <Input
            value={form.subtitleZH}
            onChange={e => updateField("subtitleZH", e.target.value)}
            placeholder="可选"
          />
        </div>
        <div className="space-y-2">
          <Label>English Subtitle</Label>
          <Input
            value={form.subtitleEN}
            onChange={e => updateField("subtitleEN", e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>

      {/* Author & Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>作者</Label>
          <Input
            value={form.author}
            onChange={e => updateField("author", e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            发布日期
          </Label>
          <Input
            type="date"
            value={form.publishedAt}
            onChange={e => updateField("publishedAt", e.target.value)}
            placeholder="留空则自动设为当前时间"
          />
          <p className="text-xs text-gray-400">留空时，发布文章将自动使用当前时间</p>
        </div>
      </div>

      {/* Cover Image */}
      <CoverImageUpload
        value={form.coverImage}
        onChange={(url) => updateField("coverImage", url)}
        onUpload={handleImageUpload}
        onGenerate={handleGenerateCoverImage}
      />

      {/* Chinese Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>中文内容 *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTranslate("en-to-zh")}
              disabled={translatingZH || !form.contentEN}
              className="text-xs h-7"
            >
              {translatingZH ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Languages className="mr-1 h-3 w-3" />
              )}
              EN → 中文
            </Button>
          </div>
        </div>
        <RichTextEditor
          content={form.contentZH}
          onChange={(html) => updateField("contentZH", html)}
          placeholder="开始编辑中文文章内容...（支持从微信公众号直接粘贴）"
          onImageUpload={handleImageUpload}
          onPasteHtml={(html) => handleWeChatPaste(html, "contentZH")}
        />
        {rehostingImages && (
          <div className="flex items-center gap-2 text-xs text-amber-600">
            <Loader2 className="h-3 w-3 animate-spin" />
            正在转存微信图片到CDN...
          </div>
        )}
      </div>

      {/* English Content */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>English Content *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleTranslate("zh-to-en")}
              disabled={translatingEN || !form.contentZH}
              className="text-xs h-7"
            >
              {translatingEN ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <Languages className="mr-1 h-3 w-3" />
              )}
              中文 → EN
            </Button>
          </div>
        </div>
        <RichTextEditor
          content={form.contentEN}
          onChange={(html) => updateField("contentEN", html)}
          placeholder="Start editing English article content..."
          onImageUpload={handleImageUpload}
          onPasteHtml={(html) => handleWeChatPaste(html, "contentEN")}
        />
      </div>

      {/* Publish & Featured switches */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Switch
            checked={form.published}
            onCheckedChange={v => updateField("published", v)}
          />
          <Label>发布</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={form.featured}
            onCheckedChange={v => updateField("featured", v)}
          />
          <Label>置顶</Label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存
        </Button>
        <Button variant="outline" onClick={onCancel}>
          取消
        </Button>
      </div>

      {/* Preview Modal */}
      <ArticlePreview
        open={showPreview}
        onOpenChange={setShowPreview}
        titleZH={form.titleZH}
        titleEN={form.titleEN}
        subtitleZH={form.subtitleZH}
        subtitleEN={form.subtitleEN}
        contentZH={form.contentZH}
        contentEN={form.contentEN}
        author={form.author}
        category={form.category}
        coverImage={form.coverImage}
      />
    </div>
  );
}

/* ===== Main Admin Articles Page ===== */
export default function AdminArticles() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const articlesQuery = trpc.article.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });
  const createMutation = trpc.article.create.useMutation();
  const updateMutation = trpc.article.update.useMutation();
  const deleteMutation = trpc.article.delete.useMutation();
  const utils = trpc.useUtils();

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold mb-4">请先登录</h2>
            <p className="text-gray-500 mb-6">您需要管理员权限才能访问文章管理后台</p>
            <Button asChild>
              <a href={getLoginUrl("/admin/articles")}>登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not admin
  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold mb-4">权限不足</h2>
            <p className="text-gray-500 mb-6">只有管理员可以管理文章</p>
            <Link href="/">
              <Button variant="outline">返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleCreate = async (data: ArticleFormData): Promise<boolean> => {
    try {
      await createMutation.mutateAsync({
        ...data,
        subtitleZH: data.subtitleZH || null,
        subtitleEN: data.subtitleEN || null,
        coverImage: data.coverImage || null,
        publishedAt: data.publishedAt ? new Date(data.publishedAt) : (data.published ? new Date() : null),
      });
      toast.success("文章创建成功！");
      setShowCreate(false);
      utils.article.listAll.invalidate();
      return true;
    } catch (err) {
      toast.error("创建失败：" + (err as Error).message);
      return false;
    }
  };

  const handleUpdate = async (data: ArticleFormData): Promise<boolean> => {
    if (editingId === null) return false;
    try {
      await updateMutation.mutateAsync({
        id: editingId,
        data: {
          ...data,
          subtitleZH: data.subtitleZH || null,
          subtitleEN: data.subtitleEN || null,
          coverImage: data.coverImage || null,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : (data.published ? new Date() : null),
        },
      });
      toast.success("文章更新成功！");
      setEditingId(null);
      utils.article.listAll.invalidate();
      return true;
    } catch (err) {
      toast.error("更新失败：" + (err as Error).message);
      return false;
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确定要删除这篇文章吗？此操作不可撤销。")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("文章已删除");
      utils.article.listAll.invalidate();
    } catch (err) {
      toast.error("删除失败：" + (err as Error).message);
    }
  };

  const articles = articlesQuery.data ?? [];

  // Editing mode
  if (editingId !== null) {
    const article = articles.find(a => a.id === editingId);
    if (!article) return null;
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container max-w-4xl py-8">
          <Button variant="ghost" onClick={() => setEditingId(null)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>编辑文章</CardTitle>
            </CardHeader>
            <CardContent>
              <ArticleForm
                initialData={{
                  slug: article.slug,
                  category: article.category,
                  titleZH: article.titleZH,
                  titleEN: article.titleEN,
                  subtitleZH: article.subtitleZH ?? "",
                  subtitleEN: article.subtitleEN ?? "",
                  contentZH: article.contentZH,
                  contentEN: article.contentEN,
                  coverImage: article.coverImage ?? "",
                  author: article.author,
                  published: article.published,
                  featured: article.featured,
                  publishedAt: article.publishedAt
                    ? new Date(article.publishedAt).toISOString().split("T")[0]
                    : "",
                }}
                onSubmit={handleUpdate}
                onCancel={() => setEditingId(null)}
                isSubmitting={updateMutation.isPending}
                draftKey={`edit-${article.id}`}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Create mode
  if (showCreate) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="container max-w-4xl py-8">
          <Button variant="ghost" onClick={() => setShowCreate(false)} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> 返回列表
          </Button>
          <Card>
            <CardHeader>
              <CardTitle>新建文章</CardTitle>
            </CardHeader>
            <CardContent>
              <ArticleForm
                initialData={emptyForm}
                onSubmit={handleCreate}
                onCancel={() => setShowCreate(false)}
                isSubmitting={createMutation.isPending}
                draftKey="new"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // List mode
  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">文章管理</h1>
            <p className="text-gray-500 text-sm mt-1">
              管理 ChinabyMonica 洞察页面的文章内容
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="mr-2 h-4 w-4" /> 新建文章
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); }}>
              <LogOut className="mr-2 h-4 w-4" /> 登出
            </Button>
          </div>
        </div>

        {articlesQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : articles.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500 mb-4">还没有文章</p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" /> 创建第一篇文章
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {articles.map(article => (
              <Card key={article.id} className="hover:shadow-md transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between gap-4">
                    {article.coverImage && (
                      <div className="shrink-0">
                        <img
                          src={article.coverImage}
                          alt=""
                          className="w-16 h-16 object-cover rounded-md border border-gray-200"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                          {CATEGORY_LABELS[article.category]?.zh ?? article.category}
                        </span>
                        {article.featured && (
                          <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        )}
                        {article.published ? (
                          <span className="flex items-center gap-1 text-xs text-green-600">
                            <Eye className="h-3 w-3" /> 已发布
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <EyeOff className="h-3 w-3" /> 草稿
                          </span>
                        )}
                      </div>
                      <h3 className="font-medium truncate">{article.titleZH}</h3>
                      <p className="text-sm text-gray-500 truncate">{article.titleEN}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingId(article.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
