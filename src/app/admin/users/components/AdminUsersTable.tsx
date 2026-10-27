"use client";

import React from "react";
import {
  User,
  Shield,
  Utensils,
  GraduationCap,
  Mail,
  Phone,
  Building2,
  Calendar,
  Pencil,
  Trash2,
} from "lucide-react";
import { Avatar, Button } from "@/components/ui";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  role: "STUDENT" | "COORDINATOR" | "FOOD_COORDINATOR" | "ADMIN";
  avatarUrl?: string | null;
  createdAt: string;
  assignedEvents?: {
    id: string;
    name: string;
    category?: string;
  }[];
  _count: {
    registrations: number;
    coordEvents: number;
  };
}

interface AdminUsersTableProps {
  users: UserItem[];
  currentUserId?: string;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
}

export default function AdminUsersTable({
  users,
  currentUserId,
  onEdit,
  onDelete,
}: AdminUsersTableProps) {
  if (users.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-2xl shadow-card p-12 text-center text-xs text-ink-muted">
        No accounts match your current filter criteria.
      </div>
    );
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-danger-surface text-danger-ink border border-danger-border">
            <Shield className="w-3 h-3" />
            <span>Admin</span>
          </span>
        );
      case "COORDINATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-warning-surface text-warning-ink border border-warning-border">
            <GraduationCap className="w-3 h-3" />
            <span>Coordinator</span>
          </span>
        );
      case "FOOD_COORDINATOR":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-success-surface text-success-ink border border-success-border">
            <Utensils className="w-3 h-3" />
            <span>Food Desk</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-surface-raised text-ink border border-border">
            <User className="w-3 h-3 text-accent" />
            <span>Student</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-raised text-[11px] font-bold text-ink-muted uppercase tracking-wider">
              <th className="py-3 px-4">User</th>
              <th className="py-3 px-4">Role</th>
              <th className="py-3 px-4">College Affiliation</th>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4 text-center">Registrations</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const isCurrentUser = currentUserId === u.id;
              return (
                <tr key={u.id} className="hover:bg-surface-raised/60 transition-colors">
                  {/* User info */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={u.name} src={u.avatarUrl} size="sm" />
                      <div>
                        <div className="font-bold text-sm text-ink flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isCurrentUser && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-accent text-accent-ink">
                              YOU
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-ink-muted flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3" />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {getRoleBadge(u.role)}
                    {u.assignedEvents && u.assignedEvents.length > 0 && (
                      <div className="mt-1 text-[10px] text-ink-muted">
                        Assigned to {u.assignedEvents.length} arena(s)
                      </div>
                    )}
                  </td>

                  {/* College */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-start gap-1.5 max-w-xs">
                      <Building2 className="w-3.5 h-3.5 text-ink-muted shrink-0 mt-0.5" />
                      <span className="text-xs text-ink line-clamp-1">
                        {u.college || "—"}
                      </span>
                    </div>
                  </td>

                  {/* Phone */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {u.phone ? (
                      <span className="inline-flex items-center gap-1 text-xs text-ink-muted">
                        <Phone className="w-3 h-3" />
                        <span>{u.phone}</span>
                      </span>
                    ) : (
                      <span className="text-ink-muted italic">—</span>
                    )}
                  </td>

                  {/* Registrations count */}
                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-raised border border-border">
                      {u._count.registrations}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(u)}
                        title="Edit user"
                        className="h-8 px-2 text-xs"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      {!isCurrentUser && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(u)}
                          title="Delete user"
                          className="h-8 px-2 text-xs hover:text-danger"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-danger" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

