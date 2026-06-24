"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";

interface ContentPlan {
  id: string;
  title: string;
  caption: string | null;
  imageUrl: string | null;
  scheduledAt: string;
  status: string;
  category: string | null;
  hashtags: string | null;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  posted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  skipped: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

const categoryOptions = [
  "Promotion",
  "Educational",
  "Entertainment",
  "Behind the Scenes",
  "User Generated",
  "Seasonal",
  "Engagement",
  "Other",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function ContentPlannerPage() {
  const [plans, setPlans] = useState<ContentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlan | null>(null);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formCaption, setFormCaption] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("12:00");
  const [formStatus, setFormStatus] = useState("draft");
  const [formCategory, setFormCategory] = useState("");
  const [formHashtags, setFormHashtags] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/content-planner");
      const data = await res.json();
      if (data.success) setPlans(data.plans);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const openNewDialog = (date?: string) => {
    setEditingPlan(null);
    setFormTitle("");
    setFormCaption("");
    setFormImageUrl("");
    setFormDate(date || new Date().toISOString().split("T")[0]);
    setFormTime("12:00");
    setFormStatus("draft");
    setFormCategory("");
    setFormHashtags("");
    setFormNotes("");
    setDialogOpen(true);
  };

  const openEditDialog = (plan: ContentPlan) => {
    setEditingPlan(plan);
    setFormTitle(plan.title);
    setFormCaption(plan.caption || "");
    setFormImageUrl(plan.imageUrl || "");
    const d = new Date(plan.scheduledAt);
    setFormDate(d.toISOString().split("T")[0]);
    setFormTime(d.toTimeString().slice(0, 5));
    setFormStatus(plan.status);
    setFormCategory(plan.category || "");
    setFormHashtags(plan.hashtags || "");
    setFormNotes(plan.notes || "");
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formTitle || !formDate) return;
    setSaving(true);

    const scheduledAt = new Date(`${formDate}T${formTime}:00`).toISOString();
    const body = {
      ...(editingPlan && { id: editingPlan.id }),
      title: formTitle,
      caption: formCaption || null,
      imageUrl: formImageUrl || null,
      scheduledAt,
      status: formStatus,
      category: formCategory || null,
      hashtags: formHashtags || null,
      notes: formNotes || null,
    };

    try {
      const res = await fetch("/api/content-planner", {
        method: editingPlan ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setDialogOpen(false);
        fetchPlans();
      }
    } catch {} finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/content-planner?id=${id}`, { method: "DELETE" });
      fetchPlans();
    } catch {}
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await fetch("/api/content-planner", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      fetchPlans();
    } catch {}
  };

  // Calendar logic
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  const getPlansForDate = (dateStr: string) =>
    plans.filter((p) => p.scheduledAt.startsWith(dateStr));

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  const selectedPlans = selectedDate ? getPlansForDate(selectedDate) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Post Schedule
            </CardTitle>
            <CardDescription>
              Plan and schedule your Instagram content
            </CardDescription>
          </div>
          <Button onClick={() => openNewDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Add Post
          </Button>
        </CardHeader>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(new Date(year, month - 1, 1))
                }
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-semibold">{monthName}</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  setCurrentMonth(new Date(year, month + 1, 1))
                }
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-muted-foreground py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 sm:h-24" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const dayPlans = getPlansForDate(dateStr);
                const isToday = dateStr === today;
                const isSelected = dateStr === selectedDate;

                return (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDate(isSelected ? null : dateStr)
                    }
                    className={`h-20 sm:h-24 p-1 rounded-lg border text-left text-xs transition-colors hover:bg-muted ${
                      isToday ? "border-primary bg-primary/5" : "border-border"
                    } ${isSelected ? "ring-2 ring-primary" : ""}`}
                  >
                    <div
                      className={`font-medium mb-1 ${isToday ? "text-primary" : ""}`}
                    >
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayPlans.slice(0, 2).map((p) => (
                        <div
                          key={p.id}
                          className={`truncate rounded px-1 py-0.5 text-[10px] font-medium ${
                            statusColors[p.status] || "bg-muted"
                          }`}
                          title={p.title}
                        >
                          {p.title}
                        </div>
                      ))}
                      {dayPlans.length > 2 && (
                        <div className="text-[10px] text-muted-foreground text-center">
                          +{dayPlans.length - 2} more
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected date details / Upcoming */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">
              {selectedDate
                ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })
                : "Upcoming Posts"}
            </h3>

            {selectedDate ? (
              <>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => openNewDialog(selectedDate)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add for this day
                </Button>
                {selectedPlans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No posts planned
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selectedPlans.map((plan) => (
                      <div
                        key={plan.id}
                        className="rounded-lg border p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {plan.title}
                          </h4>
                          <span
                            className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                              statusColors[plan.status] || ""
                            }`}
                          >
                            {plan.status}
                          </span>
                        </div>
                        {plan.caption && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {plan.caption}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {new Date(plan.scheduledAt).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                          {plan.category && ` · ${plan.category}`}
                        </p>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => openEditDialog(plan)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {plan.status !== "posted" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              onClick={() =>
                                handleStatusChange(plan.id, "posted")
                              }
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-destructive"
                            onClick={() => handleDelete(plan.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No content planned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {plans.slice(0, 8).map((plan) => (
                      <div
                        key={plan.id}
                        className="flex items-center gap-3 rounded-lg border p-2 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          setSelectedDate(plan.scheduledAt.split("T")[0]);
                        }}
                      >
                        <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
                          {new Date(plan.scheduledAt).getDate()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {plan.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(plan.scheduledAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })}
                            {plan.category && ` · ${plan.category}`}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            statusColors[plan.status] || ""
                          }`}
                        >
                          {plan.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? "Edit Post" : "Add New Post"}
            </DialogTitle>
            <DialogDescription>
              {editingPlan
                ? "Update your content plan"
                : "Schedule a new post for your content calendar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="text-sm font-medium">Title *</label>
              <Input
                placeholder="Post title..."
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date *</label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time</label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select value={formStatus} onValueChange={setFormStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="skipped">Skipped</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Caption</label>
              <Textarea
                placeholder="Write your caption..."
                value={formCaption}
                onChange={(e) => setFormCaption(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Image URL</label>
              <Input
                placeholder="https://..."
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Hashtags</label>
              <Input
                placeholder="#hashtag1 #hashtag2"
                value={formHashtags}
                onChange={(e) => setFormHashtags(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="Internal notes..."
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={saving || !formTitle || !formDate}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {editingPlan ? "Update" : "Add Post"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
