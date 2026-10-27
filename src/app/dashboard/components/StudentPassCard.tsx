import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button } from "@/components/ui";
import { QrCode, CheckCircle2, Clock, ExternalLink, Printer } from "lucide-react";

export interface StudentPass {
  id: string;
  name: string;
  email: string;
  badgeCode: string;
  college?: string | null;
  eventCheckedIn: boolean;
  qrData?: string | null;
}

interface StudentPassCardProps {
  pass: StudentPass | null;
  collegeName?: string | null;
}

export default function StudentPassCard({ pass, collegeName }: StudentPassCardProps) {
  if (!pass) return null;

  return (
    <Card className="bg-surface border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge
            variant={pass.eventCheckedIn ? "confirmed" : "pending"}
            size="sm"
          >
            {pass.eventCheckedIn ? "Desk Verified" : "Awaiting Verification"}
          </Badge>
          <span className="text-xs font-semibold text-accent">PASS</span>
        </div>
        <CardTitle className="text-base">Digital Event Pass</CardTitle>
        <CardDescription className="text-xs truncate">
          {pass.name} • {collegeName || pass.college || "Participant"}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* QR Code Container */}
        <div className="p-4 rounded-[8px] bg-surface-raised border border-border flex flex-col items-center justify-center text-center space-y-2">
          {pass.qrData ? (
            <div className="w-36 h-36 bg-surface p-2 rounded-[8px] border border-border flex items-center justify-center">
              <Image
                src={pass.qrData}
                alt={`QR code for ${pass.badgeCode}`}
                width={128}
                height={128}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-32 h-32 rounded-[6px] bg-surface border border-dashed border-border flex items-center justify-center text-ink-subtle">
              <QrCode className="w-12 h-12" />
            </div>
          )}

          <div className="font-mono text-xs font-bold text-ink">
            {pass.badgeCode}
          </div>
          <div className="text-[11px] text-ink-muted">
            Present at entrance desk on arrival
          </div>
        </div>

        {/* Action Button */}
        <Link href={`/badge/${pass.badgeCode}`} className="block">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            leftIcon={<ExternalLink className="w-3.5 h-3.5" />}
          >
            Open Fullscreen Badge
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

