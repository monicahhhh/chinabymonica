import { useMemo, useState, type FormEvent } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useLanguage } from "@/contexts/LanguageContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function EmailCaptureGate() {
  const { lang } = useLanguage();
  const isEN = lang === "en";
  const [location] = useLocation();
  const [dismissed, setDismissed] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(false);
  const [errorText, setErrorText] = useState("");

  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const captureMutation = trpc.auth.captureEmail.useMutation({
    onSuccess: async () => {
      setErrorText("");
      await utils.auth.me.invalidate();
    },
    onError: (error) => {
      setErrorText(error.message || (isEN ? "Failed to save email." : "邮箱保存失败，请重试。"));
    },
  });

  const isAdminPath = location.startsWith("/admin");
  const needsEmail = !meQuery.isLoading && !isAdminPath && (!meQuery.data || !meQuery.data.email);
  const open = needsEmail && !dismissed;

  const helperText = useMemo(
    () =>
      isEN
        ? "You can close this for now, but we will ask again next time until an email is submitted."
        : "你可以先关闭，但下次打开网站仍会再次提示，直到提交邮箱为止。",
    [isEN],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorText("");
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setErrorText(isEN ? "Please enter your email." : "请先填写邮箱。");
      return;
    }
    await captureMutation.mutateAsync({
      email: normalizedEmail,
      subscribeNewsletter,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setDismissed(true);
      }}
    >
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle style={{ fontFamily: isEN ? "var(--font-display)" : "var(--font-serif-cn)" }}>
            {isEN ? "One-click Email Login" : "一键邮箱登录"}
          </DialogTitle>
          <DialogDescription>
            {isEN
              ? "Enter your email to continue. Once submitted, you'll stay signed in by default."
              : "填写邮箱后即可继续浏览，提交后将默认保持登录。"}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={onSubmit}>
          <Input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isEN ? "you@example.com" : "请输入邮箱地址"}
          />

          <label className="flex items-start gap-2 text-sm text-[var(--color-ink-light)]">
            <Checkbox
              checked={subscribeNewsletter}
              onCheckedChange={(checked) => setSubscribeNewsletter(checked === true)}
            />
            <span>
              {isEN
                ? "I want to receive periodic updates."
                : "我愿意接收网站定期资讯。"}
            </span>
          </label>

          {errorText ? (
            <p className="text-sm text-destructive">{errorText}</p>
          ) : (
            <p className="text-xs text-[var(--color-ink-muted)]">{helperText}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDismissed(true)}
            >
              {isEN ? "Close" : "暂时关闭"}
            </Button>
            <Button type="submit" disabled={captureMutation.isPending}>
              {captureMutation.isPending
                ? (isEN ? "Saving..." : "提交中...")
                : (isEN ? "Continue" : "继续访问")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
