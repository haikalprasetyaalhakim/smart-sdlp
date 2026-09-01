import * as React from "react"
import { Bell, GripVertical, Trash2, Archive, ChevronRight, Check } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

export interface NotificationItem {
  id: string
  title: string
  description: string
  time: string
  targetMenu?: string
}

interface NotificationsWithActionsProps {
  items?: NotificationItem[]
  placement?: "top" | "right" | "bottom" | "left"
  onItemClick?: (item: NotificationItem) => void
}

const defaultNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Laporan Masuk",
    description: "PJ Budi Santoso telah mengirimkan laporan realisasi Agustus 2026.",
    time: "10m yang lalu",
    targetMenu: "arsip-sp2d",
  },
  {
    id: "2",
    title: "Peringatan Serapan",
    description: "2 Kegiatan memilik progres fisik di bawah target 50%.",
    time: "1j yang lalu",
    targetMenu: "master",
  },
  {
    id: "3",
    title: "Verifikasi Berkas",
    description: "Dokumen SK Penugasan TA 2026 berhasil disetujui.",
    time: "Kemarin",
    targetMenu: "repositori",
  },
]

export default function NotificationsWithActions({
  items = defaultNotifications,
  placement = "bottom",
  onItemClick,
}: NotificationsWithActionsProps) {
  const [notifications, setNotifications] =
    React.useState<NotificationItem[]>(items)
  const [activeId, setActiveId] = React.useState<string | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  const handleArchive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setActiveId(null)
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    setActiveId(null)
  }

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications([])
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger
        className="relative inline-flex items-center justify-center rounded-lg p-2 text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition cursor-pointer focus:outline-none"
        title="Notifikasi Sistem SMART"
      >
        <Bell className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
        {notifications.length > 0 && (
          <Badge
            variant="default"
            className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] bg-rose-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ring-2 ring-[#143D32] shadow-xs"
          >
            {notifications.length}
          </Badge>
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 sm:w-90 p-0 border border-slate-200 shadow-2xl rounded-xl overflow-hidden bg-white z-50 text-slate-800"
        align="end"
        side={placement}
        sideOffset={8}
      >
        <div className="px-4 py-3 bg-[#143D32] text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-300" />
            <h3 className="text-xs font-bold text-white tracking-wide">
              Pemberitahuan Sistem
            </h3>
            {notifications.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full leading-none">
                {notifications.length}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[10.5px] font-semibold text-emerald-200 hover:text-white bg-emerald-800/80 hover:bg-emerald-800 px-2 py-0.5 rounded transition cursor-pointer flex items-center gap-1"
              title="Bersihkan semua notifikasi"
            >
              <Check className="w-3 h-3" />
              Tandai Semua
            </button>
          )}
        </div>

        <Card className="max-h-80 overflow-y-auto rounded-none border-none shadow-none bg-white">
          {notifications.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-medium text-slate-500">
                Tidak ada pemberitahuan baru
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {notifications.map((item) => {
                const isActive = activeId === item.id
                return (
                  <li
                    key={item.id}
                    onClick={() => {
                      if (onItemClick) {
                        onItemClick(item)
                        setIsOpen(false)
                      }
                    }}
                    className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition cursor-pointer relative group"
                  >
                    <motion.div
                      animate={{ x: isActive ? -44 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-1 min-w-0 pr-2"
                    >
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
                          {item.time}
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-600 leading-snug">
                        {item.description}
                      </p>
                    </motion.div>

                    <div className="ml-1 flex items-center flex-shrink-0">
                      {isActive ? (
                        <div className="flex items-center space-x-1.5 bg-slate-50 p-1 rounded-md border border-slate-200">
                          <button
                            className="p-1 rounded text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                            onClick={(e) => handleArchive(item.id, e)}
                            title="Arsipkan"
                          >
                            <Archive className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            onClick={(e) => handleDelete(item.id, e)}
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveId(null)
                            }}
                            title="Tutup Aksi"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveId(isActive ? null : item.id)
                          }}
                          title="Menu Aksi"
                        >
                          <GripVertical className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>

        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Sistem Monitoring SMART</span>
          <span className="text-[10px] text-slate-400 font-semibold">TA 2026</span>
        </div>
      </PopoverContent>
    </Popover>
  )
}
