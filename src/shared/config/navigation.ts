import {
  CalendarDays,
  GalleryVerticalEnd,
  Home,
  Users,
} from "lucide-react";

export const appNavigation = [
  { href: "/", label: "대시보드", icon: Home },
  { href: "/players", label: "선수 관리", icon: Users },
  { href: "/formations", label: "포메이션 템플릿", icon: GalleryVerticalEnd },
  { href: "/matches", label: "경기 목록", icon: CalendarDays },
];
