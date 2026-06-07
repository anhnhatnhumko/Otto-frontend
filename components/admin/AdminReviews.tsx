import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Star, Search, Eye, Trash2, Flag, MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";

interface Review {
  id: string;
  customerName: string;
  taskerName: string;
  service: string;
  orderId: string;
  rating: number;
  comment: string;
  reply?: string;
  status: "published" | "hidden" | "flagged";
  date: string;
  helpful: number;
}

const initialReviews: Review[] = [
  { id: "REV001", customerName: "Nguyễn Văn A", taskerName: "Lê Thị Hương", service: "Dọn dẹp nhà", orderId: "ORD003", rating: 5, comment: "Dọn dẹp rất sạch sẽ, tỉ mỉ. Chị Hương rất thân thiện và chuyên nghiệp!", reply: "Cảm ơn bạn đã tin tưởng ạ!", status: "published", date: "2026-01-14", helpful: 12 },
  { id: "REV002", customerName: "Trần Thị B", taskerName: "Nguyễn Thị Kim", service: "Nấu ăn", orderId: "ORD005", rating: 4, comment: "Nấu ngon, đúng giờ. Tuy nhiên hơi ít gia vị.", status: "published", date: "2026-01-13", helpful: 5 },
  { id: "REV003", customerName: "Hoàng Văn E", taskerName: "Trần Văn Minh", service: "Vệ sinh máy lạnh", orderId: "ORD006", rating: 5, comment: "Anh Minh làm việc rất chuyên nghiệp, máy lạnh chạy mát hẳn!", status: "published", date: "2026-01-12", helpful: 8 },
  { id: "REV004", customerName: "Lê Văn C", taskerName: "Phạm Thị Lan", service: "Chăm sóc người già", orderId: "ORD008", rating: 2, comment: "Đến trễ 30 phút, thái độ không nhiệt tình.", status: "flagged", date: "2026-01-11", helpful: 1 },
  { id: "REV005", customerName: "Phạm Thị D", taskerName: "Lê Thị Hương", service: "Giặt ủi", orderId: "ORD010", rating: 3, comment: "Giặt sạch nhưng ủi chưa thẳng lắm.", status: "published", date: "2026-01-10", helpful: 3 },
  { id: "REV006", customerName: "Test Spam", taskerName: "Lê Thị Hương", service: "Dọn dẹp nhà", orderId: "ORD999", rating: 1, comment: "Spam content nhảm nhí quảng cáo...", status: "hidden", date: "2026-01-09", helpful: 0 },
];

const AdminReviews = () => {
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const filtered = reviews.filter(r => {
    const matchSearch = r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.taskerName.toLowerCase().includes(search.toLowerCase()) || r.comment.toLowerCase().includes(search.toLowerCase());
    const matchRating = ratingFilter === "all" || r.rating === parseInt(ratingFilter);
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchRating && matchStatus;
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : "0";

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      published: { label: "Hiển thị", className: "bg-green-100 text-green-800 border-green-200" },
      hidden: { label: "Đã ẩn", className: "bg-muted text-muted-foreground border-border" },
      flagged: { label: "Cần xem xét", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
    };
    const c = config[status] || { label: status, className: "" };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))}
    </div>
  );

  const handleToggleVisibility = (id: string) => {
    setReviews(prev => prev.map(r =>
      r.id === id ? { ...r, status: r.status === "published" ? "hidden" as const : "published" as const } : r
    ));
    toast({ title: "Thành công", description: "Đã cập nhật trạng thái đánh giá" });
  };

  const handleDelete = (id: string) => {
    setReviews(prev => prev.filter(r => r.id !== id));
    toast({ title: "Thành công", description: "Đã xóa đánh giá" });
  };

  const handleApprove = (id: string) => {
    setReviews(prev => prev.map(r =>
      r.id === id ? { ...r, status: "published" as const } : r
    ));
    toast({ title: "Thành công", description: "Đã duyệt đánh giá" });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" />Quản lý đánh giá</CardTitle>
          <CardDescription>Xem và quản lý các đánh giá từ khách hàng</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
              <div className="text-2xl font-bold text-yellow-700 flex items-center justify-center gap-1">
                <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />{avgRating}
              </div>
              <p className="text-xs text-yellow-600">Đánh giá TB</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-center">
              <div className="text-2xl font-bold text-green-700">{reviews.filter(r => r.status === "published").length}</div>
              <p className="text-xs text-green-600">Đang hiển thị</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200 text-center">
              <div className="text-2xl font-bold text-yellow-700">{reviews.filter(r => r.status === "flagged").length}</div>
              <p className="text-xs text-yellow-600">Cần xem xét</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-center">
              <div className="text-2xl font-bold text-blue-700">{reviews.filter(r => r.rating >= 4).length}</div>
              <p className="text-xs text-blue-600">Tích cực (4-5⭐)</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Tìm theo tên, nội dung..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Số sao" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sao</SelectItem>
                {[5, 4, 3, 2, 1].map(s => <SelectItem key={s} value={s.toString()}>{s} sao</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Trạng thái" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="published">Hiển thị</SelectItem>
                <SelectItem value="flagged">Cần xem xét</SelectItem>
                <SelectItem value="hidden">Đã ẩn</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead className="hidden md:table-cell">Tasker</TableHead>
                  <TableHead>Đánh giá</TableHead>
                  <TableHead className="hidden md:table-cell">Nội dung</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Không có đánh giá nào</TableCell></TableRow>
                ) : (
                  filtered.map(r => (
                    <TableRow key={r.id} className={r.status === "flagged" ? "bg-yellow-50/50" : ""}>
                      <TableCell className="font-medium">{r.customerName}</TableCell>
                      <TableCell className="hidden md:table-cell">{r.taskerName}</TableCell>
                      <TableCell>{renderStars(r.rating)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-[200px] truncate text-sm text-muted-foreground">{r.comment}</TableCell>
                      <TableCell>{getStatusBadge(r.status)}</TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-1">
                          <Button variant="ghost" size="icon" onClick={() => { setSelectedReview(r); setIsDetailOpen(true); }}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {r.status === "flagged" && (
                            <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleApprove(r.id)}>
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className={r.status === "published" ? "text-yellow-600" : "text-green-600"} onClick={() => handleToggleVisibility(r.id)}>
                            {r.status === "published" ? <ThumbsDown className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chi tiết đánh giá</DialogTitle>
            <DialogDescription>Đơn hàng #{selectedReview?.orderId}</DialogDescription>
          </DialogHeader>
          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Trạng thái:</span>
                {getStatusBadge(selectedReview.status)}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted-foreground">Khách hàng</p><p className="font-medium">{selectedReview.customerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Tasker</p><p className="font-medium">{selectedReview.taskerName}</p></div>
                <div><p className="text-xs text-muted-foreground">Dịch vụ</p><p className="font-medium">{selectedReview.service}</p></div>
                <div><p className="text-xs text-muted-foreground">Ngày</p><p className="font-medium">{selectedReview.date}</p></div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Đánh giá</p>
                {renderStars(selectedReview.rating)}
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm">{selectedReview.comment}</p>
              </div>
              {selectedReview.reply && (
                <div className="p-4 bg-primary/5 border-l-2 border-primary rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Phản hồi từ Tasker:</p>
                  <p className="text-sm">{selectedReview.reply}</p>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ThumbsUp className="h-3 w-3" />{selectedReview.helpful} người thấy hữu ích
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviews;
