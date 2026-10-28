import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Avatar,
  EmptyState,
} from "@/components/ui";
import { CheckCircle2, Trophy, Edit, Phone, Mail } from "lucide-react";
import { ScoreRegistration } from "./CoordinatorScoreModal";

export interface ParticipantRow {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
  };
  delegation?: {
    collegeName: string;
  } | null;
  delegationMember?: {
    badgeCode: string;
    foodTokenCode: string;
    eventCheckedIn?: boolean;
  } | null;
  attended?: boolean;
  score?: number | null;
  result?: string | null;
}

interface CoordinatorParticipantTableProps {
  participants: ParticipantRow[];
  onToggleAttendance: (registrationId: string, currentAttended: boolean) => void;
  onOpenScoreModal: (reg: ScoreRegistration) => void;
  isProcessing: boolean;
}

export default function CoordinatorParticipantTable({
  participants,
  onToggleAttendance,
  onOpenScoreModal,
  isProcessing,
}: CoordinatorParticipantTableProps) {
  if (participants.length === 0) {
    return (
      <EmptyState
        title="No Participants Found"
        description="No registered delegates match your search query."
      />
    );
  }

  const getResultBadge = (result: string | null | undefined) => {
    if (!result) return null;
    if (result === "FIRST") return <Badge variant="gold" size="sm">1st Place</Badge>;
    if (result === "SECOND") return <Badge variant="neutral" size="sm">2nd Place</Badge>;
    if (result === "THIRD") return <Badge variant="neutral" size="sm">3rd Place</Badge>;
    if (result === "FINALIST") return <Badge variant="accent" size="sm">Finalist</Badge>;
    return <Badge variant="neutral" size="sm">{result}</Badge>;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow interactive={false}>
          <TableHead>Participant</TableHead>
          <TableHead>College / Institution</TableHead>
          <TableHead>Badge Code</TableHead>
          <TableHead>Desk Attendance</TableHead>
          <TableHead>Score & Award</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((row) => {
          const isAttended = Boolean(row.attended || row.delegationMember?.eventCheckedIn);
          const collegeName = row.delegation?.collegeName || row.user.college || "Independent";
          const badgeCode = row.delegationMember?.badgeCode || "N/A";

          return (
            <TableRow key={row.id}>
              {/* Participant Info */}
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar name={row.user.name} size="sm" />
                  <div className="space-y-0.5 min-w-0">
                    <div className="font-semibold text-sm text-ink truncate">
                      {row.user.name}
                    </div>
                    <div className="text-xs text-ink-muted truncate">
                      {row.user.email}
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* College */}
              <TableCell className="text-sm text-ink-muted truncate max-w-[200px]">
                {collegeName}
              </TableCell>

              {/* Badge Code */}
              <TableCell className="font-mono text-sm text-ink font-semibold">
                {badgeCode}
              </TableCell>

              {/* Attendance Status */}
              <TableCell>
                <Button
                  variant={isAttended ? "secondary" : "primary"}
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => onToggleAttendance(row.id, isAttended)}
                  leftIcon={
                    isAttended ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                    ) : undefined
                  }
                >
                  {isAttended ? "Checked In" : "Mark Present"}
                </Button>
              </TableCell>

              {/* Score / Result */}
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  {row.score !== null && row.score !== undefined && (
                    <span className="font-bold tabular-nums text-ink">
                      {row.score} pts
                    </span>
                  )}
                  {getResultBadge(row.result)}
                </div>
              </TableCell>

              {/* Action */}
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onOpenScoreModal({
                      id: row.id,
                      name: row.user.name,
                      college: collegeName,
                      score: row.score || null,
                      result: row.result || null,
                    })
                  }
                  leftIcon={<Edit className="w-3.5 h-3.5" />}
                >
                  Score
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

