import * as React from "react"
import { cn } from "@/lib/utils"

export type StorageIconName =
  | "alert"
  | "arrow-left"
  | "arrow-right"
  | "arrow-up-right"
  | "bell"
  | "calendar"
  | "calendar-check"
  | "check"
  | "chevron"
  | "close"
  | "dashboard"
  | "save"
  | "exclamation"
  | "alert-sign"
  | "eye"
  | "eye-off"
  | "file"
  | "filter"
  | "group"
  | "handshake"
  | "log-in"
  | "logout"
  | "search"
  | "mail"
  | "graduation-cap"
  | "book"
  | "pie-chart"
  | "lock"
  | "send"
  | "shield"
  | "shield-check"
  | "shield-kepsek"
  | "kepsek"
  | "ai"
  | "lightning"
  | "magic-wand"
  | "spreadsheet"
  | "trend-up"
  | "trend-down"
  | "chevron-up"
  | "user"
  | "user-check"

const iconMap: Record<StorageIconName, string> = {
  alert: "/storage/icon/alert.png",
  "arrow-left": "/storage/icon/arrow(1).png",
  "arrow-right": "/storage/icon/right-arrow.png",
  "arrow-up-right": "/storage/icon/top-right.png",
  bell: "/storage/icon/bell.png",
  calendar: "/storage/icon/calendar(1).png",
  "calendar-check": "/storage/icon/calendar(2).png",
  check: "/storage/icon/check(1).png",
  chevron: "/storage/icon/chevron.png",
  close: "/storage/icon/close.png",
  dashboard: "/storage/icon/dashboard(1).png",
  save: "/storage/icon/diskette.png",
  exclamation: "/storage/icon/exclamation-mark.png",
  "alert-sign": "/storage/icon/exclamation-sign.png",
  eye: "/storage/icon/eye.png",
  "eye-off": "/storage/icon/hidden.png",
  file: "/storage/icon/file(1).png",
  filter: "/storage/icon/filter(1).png",
  group: "/storage/icon/group.png",
  handshake: "/storage/icon/handshake.png",
  "log-in": "/storage/icon/log-in.png",
  logout: "/storage/icon/logout.png",
  search: "/storage/icon/magnifying-glass.png",
  mail: "/storage/icon/mail.png",
  "graduation-cap": "/storage/icon/mortarboard.png",
  book: "/storage/icon/open-book.png",
  "pie-chart": "/storage/icon/pie-chart.png",
  lock: "/storage/icon/protect.png",
  send: "/storage/icon/send.png",
  shield: "/storage/icon/shield.png",
  "shield-check": "/storage/icon/shield(1).png",
  "shield-kepsek": "/storage/icon/shield(2).png",
  kepsek: "/storage/icon/shield(2).png",
  ai: "/storage/icon/ai(1).png",
  lightning: "/storage/icon/lightning.png",
  "magic-wand": "/storage/icon/magic-wand.png",
  spreadsheet: "/storage/icon/spreadsheet.png",
  "trend-up": "/storage/icon/trend(1).png",
  "trend-down": "/storage/icon/trend.png",
  "chevron-up": "/storage/icon/up-arrows.png",
  user: "/storage/icon/user.png",
  "user-check": "/storage/icon/user-check.png",
}

export interface StorageIconProps extends React.HTMLAttributes<HTMLSpanElement> {
  name: StorageIconName
  size?: number | string
}

export const StorageIcon = React.forwardRef<HTMLSpanElement, StorageIconProps>(
  ({ name, className, style, size, ...props }, ref) => {
    const src = iconMap[name] || iconMap.alert
    const sizeStyle = size
      ? {
          width: typeof size === "number" ? `${size}px` : size,
          height: typeof size === "number" ? `${size}px` : size,
        }
      : {}

    const hasExplicitWidth = className?.includes("w-") || className?.includes("size-") || size
    const hasExplicitHeight = className?.includes("h-") || className?.includes("size-") || size

    return (
      <span
        ref={ref}
        className={cn(
          "inline-block shrink-0 bg-current align-middle",
          !hasExplicitWidth && "w-4",
          !hasExplicitHeight && "h-4",
          className
        )}
        style={{
          maskImage: `url("${src}")`,
          WebkitMaskImage: `url("${src}")`,
          maskSize: "contain",
          WebkitMaskSize: "contain",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskPosition: "center",
          WebkitMaskPosition: "center",
          ...sizeStyle,
          ...style,
        }}
        {...props}
      />
    )
  }
)
StorageIcon.displayName = "StorageIcon"

// Drop-in Named Components
export const IconAlert = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="alert" {...props} />
)
IconAlert.displayName = "IconAlert"

export const IconArrowLeft = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="arrow-left" {...props} />
)
IconArrowLeft.displayName = "IconArrowLeft"

export const IconArrowRight = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="arrow-right" {...props} />
)
IconArrowRight.displayName = "IconArrowRight"

export const IconArrowUpRight = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="arrow-up-right" {...props} />
)
IconArrowUpRight.displayName = "IconArrowUpRight"

export const IconBell = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="bell" {...props} />
)
IconBell.displayName = "IconBell"

export const IconCalendar = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="calendar" {...props} />
)
IconCalendar.displayName = "IconCalendar"

export const IconCalendarCheck = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="calendar-check" {...props} />
)
IconCalendarCheck.displayName = "IconCalendarCheck"

export const IconCheck = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="check" {...props} />
)
IconCheck.displayName = "IconCheck"

export const IconCheckCircle = IconCheck

export const IconChevron = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="chevron" {...props} />
)
IconChevron.displayName = "IconChevron"

export const IconChevronRight = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  ({ className, ...props }, ref) => (
    <StorageIcon ref={ref} name="chevron" className={cn("-rotate-90", className)} {...props} />
  )
)
IconChevronRight.displayName = "IconChevronRight"

export const IconChevronDown = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="chevron" {...props} />
)
IconChevronDown.displayName = "IconChevronDown"

export const IconChevronUp = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="chevron-up" {...props} />
)
IconChevronUp.displayName = "IconChevronUp"

export const IconClose = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="close" {...props} />
)
IconClose.displayName = "IconClose"

export const IconX = IconClose

export const IconDashboard = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="dashboard" {...props} />
)
IconDashboard.displayName = "IconDashboard"

export const IconSave = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="save" {...props} />
)
IconSave.displayName = "IconSave"

export const IconExclamation = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="exclamation" {...props} />
)
IconExclamation.displayName = "IconExclamation"

export const IconAlertSign = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="alert-sign" {...props} />
)
IconAlertSign.displayName = "IconAlertSign"

export const IconEye = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="eye" {...props} />
)
IconEye.displayName = "IconEye"

export const IconEyeOff = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="eye-off" {...props} />
)
IconEyeOff.displayName = "IconEyeOff"

export const IconFile = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="file" {...props} />
)
IconFile.displayName = "IconFile"

export const IconFilter = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="filter" {...props} />
)
IconFilter.displayName = "IconFilter"

export const IconGroup = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="group" {...props} />
)
IconGroup.displayName = "IconGroup"

export const IconUsers = IconGroup

export const IconHandshake = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="handshake" {...props} />
)
IconHandshake.displayName = "IconHandshake"

export const IconLogIn = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="log-in" {...props} />
)
IconLogIn.displayName = "IconLogIn"

export const IconLogOut = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="logout" {...props} />
)
IconLogOut.displayName = "IconLogOut"

export const IconSearch = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="search" {...props} />
)
IconSearch.displayName = "IconSearch"

export const IconMail = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="mail" {...props} />
)
IconMail.displayName = "IconMail"

export const IconGraduationCap = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="graduation-cap" {...props} />
)
IconGraduationCap.displayName = "IconGraduationCap"

export const IconBook = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="book" {...props} />
)
IconBook.displayName = "IconBook"

export const IconPieChart = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="pie-chart" {...props} />
)
IconPieChart.displayName = "IconPieChart"

export const IconLock = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="lock" {...props} />
)
IconLock.displayName = "IconLock"

export const IconSend = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="send" {...props} />
)
IconSend.displayName = "IconSend"

export const IconShare = IconSend

export const IconShield = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="shield" {...props} />
)
IconShield.displayName = "IconShield"

export const IconShieldCheck = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="shield-check" {...props} />
)
IconShieldCheck.displayName = "IconShieldCheck"

export const IconSpreadsheet = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="spreadsheet" {...props} />
)
IconSpreadsheet.displayName = "IconSpreadsheet"

export const IconTrendUp = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="trend-up" {...props} />
)
IconTrendUp.displayName = "IconTrendUp"

export const IconTrendDown = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="trend-down" {...props} />
)
IconTrendDown.displayName = "IconTrendDown"

export const IconUser = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="user" {...props} />
)
IconUser.displayName = "IconUser"

export const IconUserCheck = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="user-check" {...props} />
)
IconUserCheck.displayName = "IconUserCheck"

export const IconShieldKepsek = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="shield-kepsek" {...props} />
)
IconShieldKepsek.displayName = "IconShieldKepsek"

export const IconKepsek = IconShieldKepsek

export const IconAi = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="ai" {...props} />
)
IconAi.displayName = "IconAi"

export const IconSparkles = IconAi

export const IconLightning = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="lightning" {...props} />
)
IconLightning.displayName = "IconLightning"

export const IconZap = IconLightning

export const IconMagicWand = React.forwardRef<HTMLSpanElement, Omit<StorageIconProps, "name">>(
  (props, ref) => <StorageIcon ref={ref} name="magic-wand" {...props} />
)
IconMagicWand.displayName = "IconMagicWand"

export const IconWand = IconMagicWand

export const IconRefresh = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4 shrink-0", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  )
)
IconRefresh.displayName = "IconRefresh"

export const IconLoader = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(
  ({ className, ...props }, ref) => (
    <svg
      ref={ref}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("w-4 h-4 shrink-0 animate-spin", className)}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  )
)
IconLoader.displayName = "IconLoader"

