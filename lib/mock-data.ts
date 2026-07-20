import {
  BookOpen,
  Calendar,
  CreditCard,
  FileText,
  Gift,
  Headphones,
  MessageSquare,
  Users,
  Video,
  Wallet,
} from "lucide-react";

export const avatar =
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=256&q=80";

export const people = [
  { id: "68bc1f12308dbfc9c09303d6", name: "Darrell", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 25, subscription: "IMMERSION++", avatar },
  { id: "2", name: "Jerome Bell", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 23, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=256&q=80" },
  { id: "3", name: "Bessie Cooper", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 32, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=256&q=80" },
  { id: "4", name: "Ralph Edwards", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 23, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&w=256&q=80" },
  { id: "5", name: "Marvin McKinney", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 32, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=256&q=80" },
  { id: "6", name: "Esther Howard", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 27, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80" },
  { id: "7", name: "Annette Black", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 29, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=256&q=80" },
  { id: "8", name: "Brooklyn Simmons", email: "abc@bcd.com", location: "Jenaer\nStrasse 39.", age: 27, subscription: "IMMERSION++", avatar: "https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=256&q=80" },
];

export const revenueData = [
  { name: "Mon", value: 2400 },
  { name: "Tue", value: 1400 },
  { name: "Wed", value: 9800 },
  { name: "Thu", value: 3900 },
  { name: "Fri", value: 4800 },
  { name: "Sat", value: 3800 },
  { name: "Sun", value: 4300 },
];

export const groups = [
  { id: "g1", title: "Spanish Beginners A1", instructor: "Elena Rodriguez", color: "#3b82f6", flag: "🇪🇸", students: 24, messages: 156 },
  { id: "g2", title: "French Intermediate B1", instructor: "Robert Chen", color: "#6366f1", flag: "🇫🇷", students: 24, messages: 156 },
  { id: "g3", title: "English Conversation", instructor: "Sarah Jenkins", color: "#10b981", flag: "🇬🇧", students: 24, messages: 156 },
  { id: "g4", title: "German Advanced C1", instructor: "Hans Mueller", color: "#f59e0b", flag: "🇩🇪", students: 24, messages: 156 },
];

export const liveClasses = [1, 2, 3].map((id) => ({
  id: String(id),
  title: "Spanish Conversation Practice",
  group: "Spanish Beginners A1",
  instructor: "Elena Rodriguez",
  date: "Today",
  time: "14:00 PM",
  going: 18,
  maybe: 4,
  no: 2,
}));

export const plans = [
  { id: "p1", name: "3 Months", price: 59, popular: false },
  { id: "p2", name: "6 Months", price: 109, popular: false },
  { id: "p3", name: "9 Months", price: 149, popular: true },
  { id: "p4", name: "12 Months", price: 199, popular: false },
];

export const payments = people.slice(0, 5).map((p, index) => ({
  id: `TRX-982${index + 1}`,
  user: p.name,
  type: "Subscription (12m)",
  amount: 199,
  method: index === 2 ? "Manual" : "Stripe",
  date: "2023-10-24",
  status: ["Completed", "Pending", "Completed", "Refunded", "Completed"][index],
}));

export const wallets = [
  { user: "Sarah Jenkins", email: "sarah.j@example.com", balance: 150, updated: "2023-10-20" },
  { user: "Jenny Wilson", email: "sarah.j@example.com", balance: 342, updated: "2023-10-20" },
  { user: "Cameron Williamson", email: "camj@example.com", balance: 450, updated: "2023-10-20" },
  { user: "Albert Flores", email: "floresj@example.com", balance: 532, updated: "2023-10-20" },
];

export const referrals = [1, 2, 3].map((id) => ({
  id: String(id),
  referrer: "Sarah\nJenkins",
  invited: "David Lee",
  date: "2023-10-2022",
  status: "Completed",
  reward: 10,
}));

export const lessons = [
  "Spanish A1 - Greetings",
  "French B1 - Past Tense",
  "English - Business Vocab",
].map((title) => ({ title, meta: "3 Audio files • 1 Quiz • 2 Exercises" }));

export const quickAdd = [
  { label: "Audio", icon: Headphones, color: "text-blue-500" },
  { label: "Text", icon: FileText, color: "text-amber-500" },
  { label: "Create Quiz", icon: BookOpen, color: "text-emerald-500" },
];

export const statIcons = { users: Users, video: Video, wallet: Wallet, gift: Gift, calendar: Calendar, card: CreditCard, message: MessageSquare };
