import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, LogOut, Download, FileText } from "lucide-react";
import { Link } from "wouter";

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function downloadCsv(
  leads: Array<{
    email: string;
    subscribeNewsletter: boolean;
    createdAt: Date;
    updatedAt: Date;
  }>,
) {
  const header = "email,subscribeNewsletter,createdAt,updatedAt";
  const rows = leads.map((lead) => {
    const fields = [
      lead.email,
      lead.subscribeNewsletter ? "yes" : "no",
      new Date(lead.createdAt).toISOString(),
      new Date(lead.updatedAt).toISOString(),
    ];
    return fields.map((field) => `"${String(field).replace(/"/g, '""')}"`).join(",");
  });
  const blob = new Blob([[header, ...rows].join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `email-leads-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminEmailLeads() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const leadsQuery = trpc.emailLead.listAll.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold mb-4">请先登录</h2>
            <p className="text-gray-500 mb-6">您需要管理员权限才能查看邮箱列表</p>
            <Button asChild>
              <a href={getLoginUrl("/admin/emails")}>登录</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 text-center">
            <h2 className="text-xl font-semibold mb-4">权限不足</h2>
            <p className="text-gray-500 mb-6">只有管理员可以查看邮箱列表</p>
            <Link href="/">
              <Button variant="outline">返回首页</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const leads = leadsQuery.data ?? [];
  const subscribedCount = leads.filter((lead) => lead.subscribeNewsletter).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container max-w-5xl py-8">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">邮箱列表</h1>
            <p className="text-gray-500 text-sm mt-1">
              共 {leads.length} 条提交记录，其中 {subscribedCount} 条勾选订阅资讯
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button variant="outline" asChild>
              <Link href="/admin/articles">
                <FileText className="mr-2 h-4 w-4" /> 文章管理
              </Link>
            </Button>
            <Button
              variant="outline"
              disabled={leads.length === 0}
              onClick={() => downloadCsv(leads)}
            >
              <Download className="mr-2 h-4 w-4" /> 导出 CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); }}>
              <LogOut className="mr-2 h-4 w-4" /> 登出
            </Button>
          </div>
        </div>

        {leadsQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : leads.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">还没有用户提交邮箱</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>邮箱</TableHead>
                    <TableHead>订阅资讯</TableHead>
                    <TableHead>首次提交</TableHead>
                    <TableHead>最近更新</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">{lead.email}</TableCell>
                      <TableCell>
                        {lead.subscribeNewsletter ? (
                          <span className="text-green-600">是</span>
                        ) : (
                          <span className="text-gray-400">否</span>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(lead.createdAt)}</TableCell>
                      <TableCell>{formatDate(lead.updatedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
