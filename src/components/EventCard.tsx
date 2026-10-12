"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
} from "@/components/ui";
import { MapPin, Clock, ArrowRight, BookOpen, Trophy } from "lucide-react";
import { formatDateSafe, formatTimeSafe } from "@/lib/dateUtils";
import EventDetailModal, { EventDetailData } from "./events/EventDetailModal";

export interface CoordinatorInfo {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  imageUrl?: string | null;
}

export interface EventCardProps {
  id: string;
  name: string;
  description?: string | null;
  category: "ON_STAGE" | "OFF_STAGE";
  fee?: number;
  capacity?: number | null;
  venue?: string | null;
  venueZoneId?: string | null;
  dateTime?: string | Date;
  rules?: string | null;
  hasPrelims?: boolean;
  prelimsDateTime?: string | Date | null;
  prelimsVenue?: string | null;
  prelimsVenueZoneId?: string | null;
  floorPlanUrl?: string | null;
  prelimsRules?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  staffCoordinator?: CoordinatorInfo | null;
  studentCoordinator?: CoordinatorInfo | null;
  coordinator?: CoordinatorInfo | null;
  staffCoordinatorName?: string | null;
  staffCoordinatorEmail?: string | null;
  staffCoordinatorPhone?: string | null;
  staffCoordinatorImageUrl?: string | null;
  studentCoordinatorName?: string | null;
  studentCoordinatorEmail?: string | null;
  studentCoordinatorPhone?: string | null;
}

export default function EventCard(props: EventCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const staffName = props.staffCoordinator?.name || props.staffCoordinatorName;
  const staffEmail = props.staffCoordinator?.email || props.staffCoordinatorEmail;
  const staffPhone = props.staffCoordinator?.phone || props.staffCoordinatorPhone;

  const studentName = props.studentCoordinator?.name || props.studentCoordinatorName;
  const studentEmail = props.studentCoordinator?.email || props.studentCoordinatorEmail;
  const studentPhone = props.studentCoordinator?.phone || props.studentCoordinatorPhone;

  const eventDetailData: EventDetailData = {
    id: props.id,
    name: props.name,
    category: props.category,
    venue: props.venue || null,
    venueZoneId: props.venueZoneId,
    dateTime: props.dateTime || new Date(),
    rules: props.rules,
    hasPrelims: props.hasPrelims,
    prelimsDateTime: props.prelimsDateTime,
    prelimsVenue: props.prelimsVenue,
    prelimsRules: props.prelimsRules,
    fee: props.fee,
    staffCoordinatorName: staffName,
    staffCoordinatorEmail: staffEmail,
    staffCoordinatorPhone: staffPhone,
    studentCoordinatorName: studentName,
    studentCoordinatorEmail: studentEmail,
    studentCoordinatorPhone: studentPhone,
  };

  return (
    <>
      <Card id={props.id} interactive className="flex flex-col justify-between">
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <Badge
              variant={props.category === "ON_STAGE" ? "confirmed" : "neutral"}
              size="sm"
            >
              {props.category === "ON_STAGE" ? "On-Stage" : "Off-Stage"}
            </Badge>

            {props.hasPrelims && (
              <Badge variant="pending" size="sm">
                Has Prelims
              </Badge>
            )}
          </div>

          <CardTitle className="pt-2">{props.name}</CardTitle>

          <CardDescription className="line-clamp-2">
            {props.description || "National inter-collegiate symposium competition arena."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-2 pt-2 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>
              {props.dateTime ? formatTimeSafe(props.dateTime) : "10:30 AM"}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="truncate">{props.venue || "Main Auditorium"}</span>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<BookOpen className="w-3.5 h-3.5" />}
            onClick={() => setModalOpen(true)}
          >
            Rules & Details
          </Button>

          <Link href="/register">
            <Button
              variant="primary"
              size="sm"
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Register
            </Button>
          </Link>
        </CardFooter>
      </Card>

      {/* Rules and Event Details Modal */}
      <EventDetailModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        event={eventDetailData}
      />
    </>
  );
}
