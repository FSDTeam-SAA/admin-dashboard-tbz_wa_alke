"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Camera,
  Check,
  DollarSign,
  Edit,
  Eye,
  EyeOff,
  Filter,
  Gift,
  Link2,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Trash2,
  Users,
  Video,
  Wallet,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogBody, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton, TableSkeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { adminApi, authApi } from "@/lib/api";
import { cn, money } from "@/lib/utils";

type ChartPoint = { name: string; value: number };
type PersonRow = {
  id: string;
  name: string;
  email: string;
  location: string;
  age: number | string;
  subscription: string;
  avatar?: string;
};
type DashboardPayload = {
  kpis?: {
    totalLearners?: number;
    totalInstructors?: number;
    activeSubscribers?: number;
    monthlyRevenue?: number;
    todayClasses?: number;
    weekClasses?: number;
    totalGroups?: number;
  };
  revenueChart?: unknown[];
  recentActivity?: Array<{ type?: string; message?: string; at?: string }>;
  usersTable?: Array<{
    id?: string;
    name?: string;
    email?: string;
    userId?: string;
    status?: string;
    subscriptionStatus?: string;
    totalWorkDone?: number;
    totalAmount?: number;
  }>;
};

function PageHead({ title, subtitle, badge, action }: { title: string; subtitle?: string; badge?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <h1 className="break-words text-2xl font-bold tracking-normal text-slate-950 sm:text-[28px]">{title}</h1>
          {badge ? <Badge className="bg-slate-900 text-white">{badge}</Badge> : null}
        </div>
        {subtitle ? <p className="mt-2 text-base text-slate-500">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

function useFallbackQuery<T>(key: unknown[], fn: () => Promise<unknown>, fallback: T) {
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      try {
        const data = await fn();
        return (Array.isArray(data) || data ? data : fallback) as T;
      } catch {
        return fallback;
      }
    },
  });
}

function Pager({ page, setPage, total = 48 }: { page: number; setPage: (page: number) => void; total?: number }) {
  const max = Math.max(1, Math.ceil(total / 8));
  return (
    <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(page - 1)}>
        Previous
      </Button>
      <span className="rounded-md bg-white px-3 py-1 text-sm text-slate-600">
        {page} / {max}
      </span>
      <Button variant="outline" size="sm" disabled={page === max} onClick={() => setPage(page + 1)}>
        Next
      </Button>
    </div>
  );
}

function SearchBar({ placeholder }: { placeholder: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
      <Input placeholder={placeholder} className="max-w-[448px] bg-slate-50" />
      <Button variant="outline">
        <Filter className="h-4 w-4" />
        Filter
      </Button>
    </div>
  );
}

function normalizeRevenueData(data: unknown): ChartPoint[] {
  const raw =
    Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { chartData?: unknown }).chartData)
        ? (data as { chartData: unknown[] }).chartData
        : [];

  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      return { name: String(index + 1), value: 0 };
    }

    const point = item as { name?: unknown; date?: unknown; value?: unknown; revenue?: unknown };
    return {
      name: formatChartLabel(point.name ?? point.date ?? index + 1),
      value: Number(point.value ?? point.revenue ?? 0),
    };
  });
}

function normalizePeopleData(data: unknown): PersonRow[] {
  const raw =
    Array.isArray(data)
      ? data
      : data && typeof data === "object" && Array.isArray((data as { users?: unknown }).users)
        ? (data as { users: unknown[] }).users
        : [];

  return raw.map((item, index) => {
    if (!item || typeof item !== "object") {
      return { id: String(index), name: "", email: "", location: "", age: "", subscription: "" };
    }

    const user = item as {
      id?: unknown;
      _id?: unknown;
      fullName?: unknown;
      name?: unknown;
      email?: unknown;
      address?: unknown;
      country?: unknown;
      dateOfBirth?: unknown;
      subscription?: { plan?: unknown; status?: unknown };
      profileImage?: { url?: unknown };
    };
    const dateOfBirth = typeof user.dateOfBirth === "string" ? new Date(user.dateOfBirth) : null;
    const age = dateOfBirth && !Number.isNaN(dateOfBirth.getTime())
      ? new Date().getFullYear() - dateOfBirth.getFullYear()
      : "";

    return {
      id: String(user._id ?? user.id ?? ""),
      name: String(user.fullName ?? user.name ?? ""),
      email: String(user.email ?? ""),
      location: String(user.address ?? user.country ?? ""),
      age,
      subscription: String(user.subscription?.plan ?? user.subscription?.status ?? ""),
      avatar: typeof user.profileImage?.url === "string" ? user.profileImage.url : undefined,
    };
  });
}

function normalizeDashboardData(data: unknown): DashboardPayload {
  return data && typeof data === "object" ? data as DashboardPayload : {};
}

function formatChartLabel(value: unknown) {
  if (typeof value !== "string") return String(value);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("en-US").format(Number(value ?? 0));
}

function formatPlan(value: unknown) {
  const plan = String(value ?? "none");
  return plan
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimeAgo(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getArrayField<T = Record<string, unknown>>(data: unknown, field: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>)[field])) {
    return (data as Record<string, unknown>)[field] as T[];
  }
  return [];
}

function formatDate(value: unknown) {
  if (typeof value !== "string") return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function userName(value: unknown) {
  if (value && typeof value === "object") {
    return String((value as { fullName?: unknown; name?: unknown; email?: unknown }).fullName ?? (value as { name?: unknown }).name ?? (value as { email?: unknown }).email ?? "");
  }
  return "";
}

function getObjectField(data: unknown, field: string): Record<string, unknown> {
  if (!data || typeof data !== "object") return {};
  const value = (data as Record<string, unknown>)[field];
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return data as Record<string, unknown>;
}

export function DashboardPage() {
  const stats = useFallbackQuery(["dashboard"], adminApi.dashboard, null);
  const revenue = useFallbackQuery(["revenue"], adminApi.revenue, []);
  const dashboard = normalizeDashboardData(stats.data);
  const kpis = dashboard.kpis ?? {};
  const chartData = normalizeRevenueData(dashboard.revenueChart ?? revenue.data);
  const hasRevenue = chartData.some((point) => point.value > 0);
  const recentActivity = dashboard.recentActivity?.length ? dashboard.recentActivity : [
    { type: "new_user", message: "No recent activity yet", at: "" },
  ];
  const usersTable = dashboard.usersTable?.length ? dashboard.usersTable : [];
  const cards = [
    { title: "Total Revenue", value: money(kpis.monthlyRevenue ?? 0), sub: "This month", icon: DollarSign, bar: "bg-sky-500" },
    { title: "Total Users", value: formatNumber((kpis.totalLearners ?? 0) + (kpis.totalInstructors ?? 0)), sub: `${formatNumber(kpis.activeSubscribers)} active subscribers`, icon: Users, bar: "bg-emerald-600" },
    { title: "Active Classes", value: formatNumber(kpis.weekClasses ?? 0), sub: `${formatNumber(kpis.todayClasses)} today`, icon: Video, bar: "bg-yellow-400" },
  ];

  return (
    <>
      <PageHead title="Dashboard" />
      <div className="grid gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold text-slate-500">{card.title}</p>
                <div className="mt-2 text-2xl font-bold text-slate-900">{stats.isLoading ? <Skeleton className="h-7 w-24" /> : card.value}</div>
                <p className="mt-2 text-lg text-slate-500">{card.sub}</p>
              </div>
              <div className="grid h-14 w-14 place-items-center rounded-full bg-violet-100 text-violet-600">
                <card.icon className="h-7 w-7" />
              </div>
            </div>
            <div className={cn("mt-5 h-1 rounded-full", card.bar)} />
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-5 xl:grid-cols-[1fr_445px]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-bold">Revenue Overview</h2>
            <Button variant="ghost">This Week</Button>
          </CardHeader>
          <CardContent className="relative h-[380px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#dbe3ef" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, (dataMax: number) => Math.max(1, dataMax)]} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={4} fill="url(#revenueFill)" />
              </AreaChart>
            </ResponsiveContainer>
            {!hasRevenue ? (
              <div className="pointer-events-none absolute inset-x-6 top-1/2 -translate-y-1/2 text-center">
                <p className="text-sm font-semibold text-slate-500">No revenue recorded for this period</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-xl font-bold">Recent Activity</h2>
            <Button variant="ghost" className="text-violet-600">View all</Button>
          </CardHeader>
          <CardContent className="space-y-7">
            {recentActivity.map((item, index) => (
              <div key={`${item.message}-${index}`} className="flex gap-4">
                <div className={cn("grid h-10 w-10 place-items-center rounded-full", item.type === "payment" ? "bg-sky-100 text-sky-600" : item.type === "class_live" ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
                  {item.type === "payment" ? <DollarSign className="h-5 w-5" /> : item.type === "class_live" ? <Video className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-semibold text-slate-700">{item.message}</p>
                  {item.at ? <p className="mt-2 text-sm text-slate-400">{formatTimeAgo(item.at)}</p> : null}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="mt-8 overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <h2 className="text-xl font-bold">Users</h2>
          <Button variant="ghost">See all</Button>
        </CardHeader>
        <SimpleRows
          rows={usersTable.slice(0, 5).map((user) => [
            user.userId ?? user.id ?? "",
            user.name ?? "",
            user.email ?? "",
            formatNumber(user.totalWorkDone ?? 0),
            money(user.totalAmount ?? 0),
            formatPlan(user.subscriptionStatus ?? user.status),
          ])}
          headers={["Service ID", "Name", "Email", "Total Work Done", "Total Amount", "Status"]}
        />
      </Card>
    </>
  );
}

function SimpleRows({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-left">
        <thead className="bg-slate-50 text-sm text-slate-500">
          <tr>{headers.map((h) => <th key={h} className="px-7 py-5 font-bold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index} className="border-t border-slate-200">
              {row.map((cell, i) => (
                <td key={i} className="px-7 py-5 text-sm text-slate-700">
                  {cell === "Active" ? <Badge className="bg-emerald-100 text-emerald-700">{cell}</Badge> : cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PeopleListPage({ kind }: { kind: "users" | "instructors" | "submissions" }) {
  const [page, setPage] = useState(1);
  const query = useFallbackQuery([kind, page], () => adminApi.users({ page, limit: 8, ...(kind === "instructors" ? { role: "instructor" } : { role: "learner" }) }), { users: [] });
  const queryClient = useQueryClient();
  const action = useMutation({
    mutationFn: async ({ id, type }: { id: string; type: "approve" | "reject" | "delete" }) => {
      if (type === "approve") return adminApi.approveUser(id);
      if (type === "reject") return adminApi.rejectUser(id);
      return adminApi.deleteUser(id);
    },
    onSuccess: () => {
      toast.success("Action completed");
      queryClient.invalidateQueries({ queryKey: [kind] });
    },
    onError: () => toast.error("Action failed"),
  });

  const title = kind === "users" ? "User list" : kind === "instructors" ? "Instructor list" : "User Submission";
  const rows = normalizePeopleData(query.data).slice(0, 8);

  return (
    <>
      <PageHead title={title} />
      <Card className="border-0 bg-transparent shadow-none">
        {query.isLoading ? <TableSkeleton rows={8} /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left">
              <thead>
                <tr className="text-[22px] font-bold text-slate-950">
                  <th className="pb-7"> {kind === "instructors" ? "Instructor Name" : "User Name"}</th>
                  <th className="pb-7">User Location</th>
                  {kind === "submissions" ? <><th className="pb-7">Video Rec.</th><th className="pb-7">Audio Rec.</th></> : <><th className="pb-7">Age</th><th className="pb-7">Subscription</th></>}
                  <th className="pb-7">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((person) => (
                  <tr key={person.id} className="border-b border-slate-200">
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12"><AvatarImage src={person.avatar} /><AvatarFallback>{person.name[0]}</AvatarFallback></Avatar>
                        <div><p className="text-lg font-bold">{person.name}</p><p className="text-base text-slate-400">{person.email}</p></div>
                      </div>
                    </td>
                    <td className="whitespace-pre-line py-5 text-lg text-slate-600">{person.location}</td>
                    {kind === "submissions" ? <><td className="py-5 text-lg text-slate-600">1/3</td><td className="py-5 text-lg text-slate-600">2/3</td></> : <><td className="py-5 text-lg text-slate-600">{person.age}</td><td className="py-5 text-lg text-slate-600">{formatPlan(person.subscription)}</td></>}
                    <td className="py-5">
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild><a href={`/${kind}/${person.id}`}><Eye className="h-5 w-5 text-slate-400" /></a></Button>
                        {kind === "users" ? <Button size="sm" asChild><a href={`/submissions/${person.id}`}>User Submission</a></Button> : null}
                        {kind !== "users" ? <><button onClick={() => action.mutate({ id: person.id, type: "approve" })}><Check className="h-6 w-6 text-emerald-500" /></button><button onClick={() => action.mutate({ id: person.id, type: "delete" })}><Trash2 className="h-6 w-6 text-rose-500" /></button></> : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <Pager page={page} setPage={setPage} />
    </>
  );
}

export function DetailPage({ title }: { title: string }) {
  const params = useParams<{ id?: string }>();
  const userId = params?.id ?? "";
  const query = useFallbackQuery(["detail", userId], () => adminApi.user(userId), { user: null });
  const person = getObjectField(query.data, "user");
  const profileImage = (person.profileImage as { url?: unknown } | undefined)?.url;
  const name = String(person.fullName ?? person.name ?? "");
  const email = String(person.email ?? "");
  return (
    <>
      <div className="mb-10 grid grid-cols-[40px_1fr] items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => history.back()}><ArrowLeft className="h-7 w-7" /></Button>
        <h1 className="text-center text-4xl font-bold text-slate-800">{title}</h1>
      </div>
      <div className="mb-20 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="flex flex-col items-center gap-8 sm:flex-row sm:pl-8">
          <Avatar className="h-48 w-48"><AvatarImage src={typeof profileImage === "string" ? profileImage : undefined} /><AvatarFallback>{name.slice(0, 2).toUpperCase() || "BZ"}</AvatarFallback></Avatar>
          <div><h2 className="text-5xl font-bold text-black">{name || "User"}</h2><p className="mt-4 flex items-center gap-3 text-3xl font-semibold text-slate-500"><MapPin />{String(person.country ?? person.address ?? "No location")}</p></div>
        </div>
        <div className="flex justify-center gap-4"><Button variant="success" size="lg">Approve</Button><Button variant="danger" size="lg">Reject</Button></div>
      </div>
      <Card className="p-6">
        <div className="grid gap-7 md:grid-cols-2">
          <Field label="Email" value={email} />
          <Field label="Phone Number" value={String(person.phone ?? "")} />
          <Field label="User ID" value={String(person.userId ?? person._id ?? userId)} />
          <Field label="Subscription" value={`${formatPlan((person.subscription as { plan?: unknown } | undefined)?.plan)} ${formatPlan((person.subscription as { status?: unknown } | undefined)?.status)}`.trim()} />
          <Field label="Address" value={String(person.address ?? person.country ?? "")} className="md:col-span-2" />
        </div>
      </Card>
    </>
  );
}

function Field({
  label,
  value,
  className,
  type = "text",
  readOnly = true,
  onChange,
}: {
  label: string;
  value: string;
  className?: string;
  type?: React.HTMLInputTypeAttribute;
  readOnly?: boolean;
  onChange?: (value: string) => void;
}) {
  return <label className={cn("block", className)}><span className="mb-3 block text-base font-bold text-slate-800 sm:text-xl">{label}</span><Input type={type} value={value} readOnly={readOnly} onChange={(event) => onChange?.(event.target.value)} className={cn("h-12 rounded-[8px] border-slate-300 bg-white text-base sm:h-14 sm:text-lg", readOnly ? "text-slate-500" : "text-slate-900")} /></label>;
}

export function SubmissionDetailPage() {
  const params = useParams<{ id?: string }>();
  const userId = params?.id ?? "";
  const query = useFallbackQuery(["submission-user", userId], () => adminApi.user(userId), { user: null });
  const person = getObjectField(query.data, "user");
  const profileImage = (person.profileImage as { url?: unknown } | undefined)?.url;
  const name = String(person.fullName ?? person.name ?? "");
  const email = String(person.email ?? "");
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-8"><Button variant="ghost" size="icon" onClick={() => history.back()}><ArrowLeft className="h-8 w-8" /></Button><h1 className="text-[28px] font-bold">User Submission</h1></div>
        <Select defaultValue="level"><SelectTrigger className="w-[105px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="level">Level</SelectItem><SelectItem value="a1">A1</SelectItem></SelectContent></Select>
      </div>
      <div className="mb-12 text-center">
        <Avatar className="mx-auto h-80 w-80 max-w-[70vw]"><AvatarImage src={typeof profileImage === "string" ? profileImage : undefined} /><AvatarFallback>{name.slice(0, 2).toUpperCase() || "BZ"}</AvatarFallback></Avatar>
        <h2 className="mt-4 text-2xl font-bold">{name || "User"}</h2><p className="text-xl text-slate-500">{email}</p>
      </div>
      <EmptyCard title="No Submissions Found" copy="Submission media will appear here when an API endpoint returns it." />
    </>
  );
}

export function GroupsPage() {
  const [open, setOpen] = useState(false);
  const query = useFallbackQuery(["groups"], adminApi.groups, { groups: [] });
  const rows = getArrayField<Record<string, unknown>>(query.data, "groups");
  return (
    <>
      <PageHead title="Class & Group Management" subtitle="Organize classes, assign instructors, and monitor group activity." action={<Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button><Plus className="h-4 w-4" />Create Group</Button></DialogTrigger><GroupDialog /></Dialog>} />
      <div className="grid gap-6 xl:grid-cols-3">
        {rows.map((group, index) => (
          <Card key={String(group._id ?? index)} className="overflow-hidden">
            <div className="h-24 p-4" style={{ background: String(group.themeColor ?? "#7c3aed") }}><span className="inline-grid h-12 w-12 place-items-center rounded-[8px] bg-white/20 text-2xl">{String(group.icon ?? "BZ")}</span><div className="float-right flex gap-2"><Button size="icon" className="bg-white/20"><Edit /></Button><Button size="icon" className="bg-white/20"><Trash2 /></Button></div></div>
            <CardContent><h3 className="text-lg font-bold">{String(group.name ?? "Untitled group")}</h3><p className="mt-3 text-sm text-slate-500">Instructor: <span className="ml-3 text-slate-700">{userName(group.instructorId)}</span></p><div className="mt-5 flex gap-6 border-t pt-4 text-sm text-slate-600"><span className="flex gap-2"><Users className="h-4 w-4 text-violet-600" />{formatNumber(group.activeStudentCount ?? group.totalStudents ?? 0)} Students</span><span className="flex gap-2"><MessageSquare className="h-4 w-4 text-blue-500" />{String(group.isActive ?? true) === "true" ? "Active" : "Inactive"}</span></div></CardContent>
          </Card>
        ))}
        {!query.isLoading && rows.length === 0 ? <EmptyCard title="No Groups Found" copy="Groups created in the backend will appear here." /> : null}
      </div>
    </>
  );
}

function GroupDialog() {
  return <DialogContent><DialogHeader><DialogTitle>Create New Group</DialogTitle></DialogHeader><DialogBody className="space-y-5"><label className="block text-sm font-medium">Class Name<Input className="mt-2" placeholder="e.g. Spanish Beginners A1" /></label><div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Icon (Emoji)<Input className="mt-2" defaultValue="🇪🇸" /></label><label className="block text-sm font-medium">Theme Color<Input className="mt-2" defaultValue="Blue" /></label></div><label className="block text-sm font-medium text-slate-400">Assign Instructor<Input className="mt-2" placeholder="Select Instructor..." /></label><div className="flex justify-end gap-3 pt-2"><Button variant="ghost">Cancel</Button><Button onClick={() => toast.success("Group created")}>Create Group</Button></div></DialogBody></DialogContent>;
}

export function LiveClassesPage() {
  const query = useFallbackQuery(["live-classes"], adminApi.liveClasses, { classes: [] });
  const rows = getArrayField<Record<string, unknown>>(query.data, "classes");
  return (
    <>
      <PageHead title="Live Classes" subtitle="Schedule Zoom classes and track student RSVPs." badge="IMMERSION++" action={<Dialog><DialogTrigger asChild><Button><Plus className="h-4 w-4" />Schedule Class</Button></DialogTrigger><LiveClassDialog /></Dialog>} />
      <div className="space-y-4">
        {rows.map((item, index) => <Card key={String(item._id ?? index)} className="grid gap-4 p-5 lg:grid-cols-[1fr_200px_122px] lg:items-center"><div className="flex gap-5"><div className="grid h-12 w-12 place-items-center rounded-[8px] bg-blue-50 text-blue-600"><Video /></div><div><h3 className="text-lg font-bold">{String(item.title ?? "Untitled class")}</h3><p className="mt-2 text-sm text-slate-500">{String((item.groupId as { name?: unknown } | undefined)?.name ?? "")} <span className="mx-4">•</span>{userName(item.instructorId)}</p><p className="mt-5 flex gap-6 text-sm text-slate-600"><span className="flex gap-2"><Calendar className="h-4 w-4" />{formatDate(item.scheduledAt)}</span><span>{String(item.status ?? "")}</span></p></div></div><div className="rounded-[8px] bg-slate-50 p-4"><p className="mb-4 flex gap-2 text-sm"><Users className="h-4 w-4" />RSVP Status</p><div className="grid grid-cols-3 text-center text-xs"><b className="text-lg text-emerald-600">{formatNumber(item.goingCount ?? 0)}</b><b className="text-lg text-amber-500">{formatNumber(item.maybeCount ?? 0)}</b><b className="text-lg text-rose-500">{formatNumber(item.notGoingCount ?? 0)}</b><span>Going</span><span>Maybe</span><span>No</span></div></div><div className="space-y-2"><Button variant="secondary" className="w-full"><Link2 className="h-4 w-4" />Copy Link</Button><Button variant="outline" className="w-full">Edit</Button></div></Card>)}
        {!query.isLoading && rows.length === 0 ? <EmptyCard title="No Live Classes Found" copy="Scheduled classes from the backend will appear here." /> : null}
      </div>
    </>
  );
}

function LiveClassDialog() {
  return <DialogContent><DialogHeader><DialogTitle>Schedule Live Class</DialogTitle></DialogHeader><DialogBody className="space-y-4"><label className="block text-sm font-medium">Class Title<Input className="mt-2" placeholder="e.g. Grammar Review" /></label><div className="grid grid-cols-2 gap-4"><label className="block text-sm font-medium">Date<Input className="mt-2" type="date" /></label><label className="block text-sm font-medium">Time<Input className="mt-2" type="time" /></label></div><label className="block text-sm font-medium">Zoom Meeting Link<Input className="mt-2" placeholder="https://zoom.us/j/..." /></label><div className="flex justify-end gap-3 pt-2"><Button variant="ghost">Cancel</Button><Button onClick={() => toast.success("Class scheduled")}>Schedule</Button></div></DialogBody></DialogContent>;
}

export function PaymentsPage() {
  const paymentQuery = useFallbackQuery(["payments"], adminApi.payments, { payments: [] });
  const planQuery = useFallbackQuery(["plans"], adminApi.plans, { plans: [] });
  const paymentRows = getArrayField<Record<string, unknown>>(paymentQuery.data, "payments");
  const planRows = getArrayField<Record<string, unknown>>(planQuery.data, "plans");
  const manualRows = paymentRows.filter((payment) => payment.isManual || payment.paymentMethod === "manual_mobile");
  const refundRows = paymentRows.filter((payment) => payment.status === "refunded");
  return (
    <>
      <PageHead title="Payments & Subscriptions" subtitle="Manage transactions, subscription plans, and manual approvals." />
      <Tabs defaultValue="transactions">
        <TabsList className="mb-6 overflow-x-auto"><TabsTrigger value="transactions">All Transactions</TabsTrigger><TabsTrigger value="plans">Subscription Plans</TabsTrigger><TabsTrigger value="manual">Manual Approvals</TabsTrigger><TabsTrigger value="refunds">Refunds (7-Day)</TabsTrigger></TabsList>
        <TabsContent value="transactions"><Card><SearchBar placeholder="Search by ID, User, or Type..." />{paymentRows.length ? <SimpleRows headers={["Transaction ID", "User", "Type", "Amount", "Method", "Date", "Status"]} rows={paymentRows.map((p) => [String(p.transactionId ?? p._id ?? ""), userName(p.userId), String(p.planName ?? (p.planId as { name?: unknown } | undefined)?.name ?? ""), money(Number(p.amount ?? 0)), String(p.paymentMethod ?? ""), formatDate(p.createdAt), formatPlan(p.status)])} /> : <EmptyCard title="No Payments Found" copy="The payments API returned no records." />}</Card></TabsContent>
        <TabsContent value="plans"><div className="grid gap-6 lg:grid-cols-4">{planRows.map((plan) => <Card key={String(plan._id ?? plan.slug)} className="relative p-6 text-center"><h3 className="text-xl font-bold">{String(plan.name ?? "Untitled plan")}</h3><p className="my-6 text-3xl font-bold">{money(Number((plan.price as { USD?: unknown } | undefined)?.USD ?? 0))}</p><p className="text-sm text-slate-500">{formatNumber(plan.subscriberCount ?? 0)} active subscribers</p><p className="mt-3 text-sm text-slate-500">{String(plan.type ?? plan.slug ?? "")}</p><Button variant="outline" className="mt-6 w-full">Edit Plan</Button></Card>)}{!planQuery.isLoading && planRows.length === 0 ? <EmptyCard title="No Plans Found" copy="Subscription plans from the backend will appear here." /> : null}</div></TabsContent>
        <TabsContent value="manual"><Card><CardHeader><h2 className="text-lg font-bold">Pending Manual Payments</h2><p className="mt-2 text-sm text-slate-500">Review uploaded transfer proofs to activate subscriptions.</p></CardHeader><CardContent className="space-y-6">{manualRows.length ? manualRows.map((payment) => <div key={String(payment._id)} className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center"><div><h3 className="font-bold">{userName(payment.userId)}</h3><p className="mt-2 text-sm text-slate-500">{String(payment.paymentProvider ?? payment.paymentMethod ?? "Manual")} • {money(Number(payment.amount ?? 0))} • {String(payment.planName ?? "")}</p><p className="mt-3 text-xs text-slate-400">Uploaded: {formatDate(payment.createdAt)}</p></div><div className="flex gap-3"><Button variant="secondary" className="text-emerald-700">Approve</Button><Button variant="secondary" className="text-rose-700">Reject</Button></div></div>) : <EmptyCard title="No Manual Payments" copy="Manual payment submissions will appear here." />}</CardContent></Card></TabsContent>
        <TabsContent value="refunds">{refundRows.length ? <Card><SimpleRows headers={["Transaction ID", "User", "Amount", "Date", "Status"]} rows={refundRows.map((payment) => [String(payment.transactionId ?? payment._id ?? ""), userName(payment.userId), money(Number(payment.amount ?? 0)), formatDate(payment.createdAt), formatPlan(payment.status)])} /></Card> : <EmptyCard title="No Pending Refund Requests" copy="Refund requests returned by the backend will appear here." />}</TabsContent>
      </Tabs>
    </>
  );
}

function EmptyCard({ title, copy }: { title: string; copy: string }) {
  return <Card className="grid min-h-60 place-items-center text-center"><div><RefreshCcwIcon /><h3 className="mt-4 text-lg font-semibold">{title}</h3><p className="mx-auto mt-3 max-w-sm text-slate-500">{copy}</p></div></Card>;
}

function RefreshCcwIcon() { return <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-300" />; }

export function WalletPage() {
  const query = useFallbackQuery(["wallets"], adminApi.wallets, { wallets: [], summary: {} });
  const rows = getArrayField<Record<string, unknown>>(query.data, "wallets");
  const summary = query.data && typeof query.data === "object" ? (query.data as { summary?: Record<string, unknown> }).summary ?? {} : {};
  return (
    <>
      <PageHead title="Wallet Management" subtitle="Manage user balances, rewards, and gifts." badge="BZ-WALLET" />
      <div className="grid gap-6 lg:grid-cols-3">{[{ t: "Total System Balance", v: money(Number(summary.totalSystemBalance ?? 0)), i: Wallet }, { t: "Rewards Given (30d)", v: money(Number(summary.rewardsGiven30d ?? 0)), i: Gift }, { t: "Reward Transactions", v: formatNumber(summary.rewardTransactionCount30d ?? 0), i: Calendar }].map((s) => <Card key={s.t} className="flex items-center gap-5 p-6"><div className="grid h-14 w-14 place-items-center rounded-full bg-violet-100 text-violet-600"><s.i /></div><div><p className="text-sm text-slate-500">{s.t}</p><p className="text-2xl font-bold">{s.v}</p></div></Card>)}</div>
      <Card className="mt-6"><SearchBar placeholder="Search users to manage wallet..." />{rows.length ? <SimpleRows headers={["User", "Balance", "Transactions", "Locked"]} rows={rows.map((w) => [`${userName(w.userId)}\n${String((w.userId as { email?: unknown } | undefined)?.email ?? "")}`, money(Number(w.balance ?? 0)), formatNumber((w.transactions as unknown[] | undefined)?.length ?? 0), String(w.isLocked ? "Yes" : "No")])} /> : <EmptyCard title="No Wallets Found" copy="Wallet records from the backend will appear here." />}</Card>
    </>
  );
}

export function ReferralPage() {
  const query = useFallbackQuery(["referrals"], adminApi.referrals, { referrals: [], stats: {} });
  const settings = useFallbackQuery(["referral-settings"], adminApi.referralSettings, {});
  const rows = getArrayField<Record<string, unknown>>(query.data, "referrals");
  const stats = query.data && typeof query.data === "object" ? (query.data as { stats?: Record<string, unknown> }).stats ?? {} : {};
  const settingData = settings.data && typeof settings.data === "object" ? settings.data as Record<string, unknown> : {};
  return (
    <>
      <PageHead title="Referral System" subtitle="Track invites and manage referral rewards." />
      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div><div className="mb-6 grid gap-6 md:grid-cols-2"><Card className="p-6"><p className="text-sm text-slate-600">Total Successful Referrals</p><p className="mt-6 text-3xl font-bold">{formatNumber(stats.totalSuccessfulReferrals ?? 0)}</p></Card><Card className="p-6"><p className="text-sm text-slate-600">Total Rewards Distributed</p><p className="mt-6 text-3xl font-bold">{money(Number(stats.totalRewardsDistributed ?? 0))}</p></Card></div><Card><SearchBar placeholder="Search by referrer or invited user..." />{rows.length ? <SimpleRows headers={["Referrer", "Invited User", "Date", "Status", "Reward Given"]} rows={rows.map((r) => [userName(r.referrerId), userName(r.invitedUserId), formatDate(r.createdAt), formatPlan(r.status), money(Number(r.rewardAmount ?? 0))])} /> : <EmptyCard title="No Referrals Found" copy="Referral records from the backend will appear here." />}</Card></div>
        <Card><CardContent><h2 className="mb-7 flex items-center gap-2 text-lg font-bold"><SettingsIcon />Reward Settings</h2><label className="block text-sm font-medium">Referrer Reward (BZ-Wallet)<Input value={String(settingData.referrerReward ?? 0)} readOnly className="mt-2" /></label><p className="mt-2 text-xs text-slate-400">Amount added to referrer&apos;s wallet when invitee subscribes.</p><label className="mt-6 block text-sm font-medium">Invitee Discount (%)<Input value={String(settingData.inviteeDiscount ?? 0)} readOnly className="mt-2" /></label><Button className="mt-8 w-full">Save Settings</Button></CardContent></Card>
      </div>
    </>
  );
}

function SettingsIcon() { return <Save className="h-5 w-5 text-slate-400" />; }

export function ContentPage() {
  const lessonQuery = useFallbackQuery(["lessons"], adminApi.lessons, { lessons: [] });
  const libraryQuery = useFallbackQuery(["library"], adminApi.library, { items: [] });
  const lessonRows = getArrayField<Record<string, unknown>>(lessonQuery.data, "lessons");
  const libraryRows = getArrayField<Record<string, unknown>>(libraryQuery.data, "items");
  return (
    <>
      <PageHead title="Content Management" subtitle="Manage lessons, quizzes, and the BZ-Library." />
      <Tabs defaultValue="lessons">
        <TabsList className="mb-6"><TabsTrigger value="lessons"><BookOpen className="mr-2 h-4 w-4" />Lessons & Quizzes</TabsTrigger><TabsTrigger value="library">BZ-Library (Discover I)</TabsTrigger></TabsList>
        <TabsContent value="lessons"><div className="grid gap-6 lg:grid-cols-[1fr_350px]"><div className="space-y-4">{lessonRows.length ? lessonRows.map((lesson) => <Card key={String(lesson._id ?? lesson.title)} className="flex items-center justify-between p-4"><div className="flex gap-4"><div className="grid h-10 w-10 place-items-center rounded-[8px] bg-violet-50 text-violet-600"><BookOpen /></div><div><h3 className="font-bold">{String(lesson.title ?? "Untitled lesson")}</h3><p className="text-xs text-slate-500">{String(lesson.planType ?? "")} • {String(lesson.isLocked ? "Locked" : "Unlocked")}</p></div></div><Button variant="ghost" className="text-violet-600">Edit</Button></Card>) : <EmptyCard title="No Lessons Found" copy="Lessons returned by the backend will appear here." />}</div><Card><CardContent><Button variant="outline" className="mb-4 h-14 w-full border-dashed"><Plus />Create New Lesson</Button><h3 className="mb-5 font-bold">Library Summary</h3><p className="text-sm text-slate-500">{formatNumber(libraryRows.length)} library items loaded from the backend.</p></CardContent></Card></div></TabsContent>
        <TabsContent value="library"><Card>{libraryRows.length ? <SimpleRows headers={["Word", "Folder", "Category", "Type", "Status"]} rows={libraryRows.map((item) => [String(item.word ?? item.title ?? item.name ?? ""), String(item.folder ?? ""), String(item.category ?? ""), String(item.type ?? ""), String(item.isActive ? "Active" : "Inactive")])} /> : <EmptyCard title="No Library Items Found" copy="Library items returned by the backend will appear here." />}</Card></TabsContent>
      </Tabs>
    </>
  );
}

export function SettingsPage() {
  const profile = useFallbackQuery(["me"], adminApi.me, { user: null });
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const imagePreviewRef = useRef<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    country: "",
  });
  const mutation = useMutation({
    mutationFn: adminApi.updateMe,
    onSuccess: () => {
      toast.success("Profile updated");
      setEditing(false);
      setSelectedImage(null);
      clearImagePreview();
      profile.refetch();
    },
    onError: () => toast.error("Update failed"),
  });
  const user = getObjectField(profile.data, "user");
  const profileImage = (user.profileImage as { url?: unknown } | undefined)?.url;
  const avatarSrc = imagePreview ?? (typeof profileImage === "string" ? profileImage : undefined);
  const fullName = String(user.fullName ?? user.name ?? "");
  const profileForm = {
      fullName,
      phone: String(user.phone ?? ""),
      dateOfBirth: typeof user.dateOfBirth === "string" ? user.dateOfBirth.slice(0, 10) : "",
      gender: String(user.gender ?? ""),
      address: String(user.address ?? ""),
      country: String(user.country ?? ""),
    };

  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current);
      }
    };
  }, []);

  function clearImagePreview() {
    if (imagePreviewRef.current) {
      URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = null;
    }
    setImagePreview(null);
  }

  function updateForm(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateProfileImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile image cannot exceed 5MB");
      event.target.value = "";
      return;
    }
    setForm(profileForm);
    setEditing(true);
    setSelectedImage(file);
    clearImagePreview();
    const nextPreview = URL.createObjectURL(file);
    imagePreviewRef.current = nextPreview;
    setImagePreview(nextPreview);
  }

  function saveProfile() {
    const payload = {
      fullName: form.fullName,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
      gender: form.gender,
      address: form.address,
      country: form.country,
    };

    if (!selectedImage) {
      mutation.mutate(payload);
      return;
    }

    const data = new FormData();
    Object.entries(payload).forEach(([key, value]) => data.append(key, value));
    data.append("profileImage", selectedImage);
    mutation.mutate(data);
  }

  function cancelEdit() {
    setEditing(false);
    setSelectedImage(null);
    clearImagePreview();
    setForm(profileForm);
  }

  return (
    <>
      <PageHead title="Settings" subtitle="Manage your admin profile and account security." />
      <div className="mx-auto max-w-[1040px]">
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="relative">
                  <Avatar className="h-28 w-28 ring-4 ring-violet-50 sm:h-32 sm:w-32">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-2xl font-bold">{fullName.slice(0, 2).toUpperCase() || "BZ"}</AvatarFallback>
                  </Avatar>
                  <label className="absolute bottom-1 right-1 grid h-10 w-10 cursor-pointer place-items-center rounded-full border border-white bg-violet-600 text-white shadow-sm transition hover:bg-violet-700">
                    <Camera className="h-5 w-5" />
                    <input type="file" accept="image/*" className="sr-only" onChange={updateProfileImage} />
                  </label>
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-2xl font-bold text-slate-950">{fullName || "Admin"}</h2>
                  <p className="mt-1 break-all text-sm text-slate-500">{String(user.userId ?? user._id ?? "")}</p>
                  <p className="mt-3 text-sm text-slate-500">JPG, PNG, or WebP. Max 5MB.</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => setPasswordOpen(true)}>Change Password</Button>
                <Button size="lg" className="w-full sm:w-auto" onClick={() => { setForm(profileForm); setEditing(true); }}><Edit className="h-4 w-4" />Update Profile</Button>
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid gap-5 md:grid-cols-2 md:gap-7">
          <Field label="Full Name" value={editing ? form.fullName : profileForm.fullName} readOnly={!editing} onChange={(value) => updateForm("fullName", value)} />
          <Field label="User ID" value={String(user.userId ?? user._id ?? "")} />
          <Field label="Email" value={String(user.email ?? "")} />
          <Field label="Phone Number" value={editing ? form.phone : profileForm.phone} readOnly={!editing} onChange={(value) => updateForm("phone", value)} />
          <Field label="Date of Birth" type={editing ? "date" : "text"} value={editing ? form.dateOfBirth : formatDate(user.dateOfBirth)} readOnly={!editing} onChange={(value) => updateForm("dateOfBirth", value)} />
          <Field label="Gender" value={editing ? form.gender : profileForm.gender} readOnly={!editing} onChange={(value) => updateForm("gender", value)} />
          <Field label="Address" value={editing ? form.address : profileForm.address || profileForm.country} readOnly={!editing} onChange={(value) => updateForm("address", value)} className="md:col-span-2" />
        </div>
        <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:gap-5"><Button variant="ghost" className="w-full text-violet-600 sm:w-auto" onClick={cancelEdit} disabled={!editing || mutation.isPending}><X className="h-4 w-4" />Cancel</Button><Button className="w-full sm:w-auto" onClick={saveProfile} disabled={!editing || mutation.isPending}><Save className="h-4 w-4" />{mutation.isPending ? "Saving..." : "Save"}</Button></div>
      </div>
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}

function PasswordField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <div className="relative mt-2">
        <Input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="pr-11"
          required
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
        >
          {visible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </label>
  );
}

function ChangePasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const mutation = useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success("Password changed");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      onOpenChange(false);
    },
    onError: () => toast.error("Password change failed"),
  });

  function update(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    mutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Change Password</DialogTitle></DialogHeader>
        <DialogBody>
          <form onSubmit={submit} className="space-y-4">
            <PasswordField label="Current Password" value={form.currentPassword} onChange={(value) => update("currentPassword", value)} />
            <PasswordField label="New Password" value={form.newPassword} onChange={(value) => update("newPassword", value)} />
            <PasswordField label="Confirm Password" value={form.confirmPassword} onChange={(value) => update("confirmPassword", value)} />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Changing..." : "Change Password"}</Button>
            </div>
          </form>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
