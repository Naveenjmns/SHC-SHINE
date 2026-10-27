"use client";

import React, { useState } from "react";
import {
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Modal,
  DialogFooter,
  Sheet,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  DropdownMenu,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
  useToast,
  EmptyState,
  Pagination,
  Tooltip,
  Avatar,
  Button,
  Input,
  Select,
  Checkbox,
} from "@/components/ui";
import {
  MoreVertical,
  Trash2,
  Edit,
  Download,
  Inbox,
  Filter,
} from "lucide-react";

export default function DataDisplayPreviewMatrix() {
  const { toast, confirmAction } = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);

  const handleConfirmTest = async () => {
    const confirmed = await confirmAction({
      title: "Delete Event Registration?",
      message: "Are you sure you want to delete this registration? This action cannot be undone.",
      confirmText: "Delete Record",
      isDestructive: true,
    });
    if (confirmed) {
      toast.success("Registration deleted successfully", "Action Confirmed");
    } else {
      toast.info("Deletion canceled", "Cancelled");
    }
  };

  return (
    <div className="space-y-8">
      {/* Badges & Status Pills */}
      <div className="p-6 border border-border rounded-2xl bg-surface shadow-card space-y-4">
        <h3 className="eyebrow">
          StatusPill & Badge Primitives (Paired with Icons)
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Badge variant="confirmed">Confirmed</Badge>
          <Badge variant="pending">Pending Review</Badge>
          <Badge variant="rejected">Rejected</Badge>
          <Badge variant="live">Live Now</Badge>
          <Badge variant="closed">Closed</Badge>
          <Badge variant="accent">SHINE 2026</Badge>
          <Badge variant="gold">1st Place Gold</Badge>
          <Badge variant="info">System Notice</Badge>
          <Badge variant="neutral">Default Tag</Badge>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="p-6 border border-border rounded-2xl bg-surface shadow-card space-y-4">
        <h3 className="eyebrow">
          Tabs & Data Table
        </h3>
        <Tabs defaultValue="all">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Registrations (3)</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed (2)</TabsTrigger>
              <TabsTrigger value="pending">Pending (1)</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Filter className="w-3.5 h-3.5" />}
                onClick={() => setSheetOpen(true)}
              >
                Filters Sheet
              </Button>
            </div>
          </div>

          <TabsContent value="all">
            <Table>
              <TableHeader>
                <TableRow interactive={false}>
                  <TableHead>Student</TableHead>
                  <TableHead>College</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Badge Code</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name="Rahul Sharma" size="sm" />
                      <div>
                        <div className="font-semibold text-ink">Rahul Sharma</div>
                        <div className="text-xs text-ink-muted">rahul@example.com</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink-muted">Loyola College (Autonomous)</TableCell>
                  <TableCell>
                    <Badge variant="confirmed" size="sm">Confirmed</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">SHINE26-DEMO-RAHUL</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu
                      trigger={
                        <button className="p-2 rounded-[8px] hover:bg-surface-raised text-ink-muted hover:text-ink cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                    >
                      <DropdownLabel>Manage Registration</DropdownLabel>
                      <DropdownItem icon={<Edit className="w-3.5 h-3.5" />}>Edit Profile</DropdownItem>
                      <DropdownItem icon={<Download className="w-3.5 h-3.5" />}>Download QR</DropdownItem>
                      <DropdownSeparator />
                      <DropdownItem
                        variant="destructive"
                        icon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={handleConfirmTest}
                      >
                        Delete Record
                      </DropdownItem>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar name="Priya Patel" size="sm" />
                      <div>
                        <div className="font-semibold text-ink">Priya Patel</div>
                        <div className="text-xs text-ink-muted">priya@example.com</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-ink-muted">St. Joseph&apos;s College</TableCell>
                  <TableCell>
                    <Badge variant="pending" size="sm">Pending</Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-ink-muted">SHINE26-REG-9812</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu
                      trigger={
                        <button className="p-2 rounded-[8px] hover:bg-surface-raised text-ink-muted hover:text-ink cursor-pointer">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      }
                    >
                      <DropdownItem icon={<Edit className="w-3.5 h-3.5" />}>Review Application</DropdownItem>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="confirmed">
            <div className="p-6 text-center text-xs text-ink-muted">Showing 2 confirmed students.</div>
          </TabsContent>

          <TabsContent value="pending">
            <div className="p-6 text-center text-xs text-ink-muted">Showing 1 pending student.</div>
          </TabsContent>
        </Tabs>

        {/* Pagination Specimen */}
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={5}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Cards, Tooltips, Modal & Toast Triggers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card interactive>
          <CardHeader>
            <div className="flex items-center justify-between">
              <Badge variant="gold" size="sm">Podium Event</Badge>
              <Tooltip content="Live in Auditorium Hall 1">
                <span className="text-xs text-ink-subtle underline cursor-help">Venue Info</span>
              </Tooltip>
            </div>
            <CardTitle>Interactive Card Primitive</CardTitle>
            <CardDescription>
              Cards use the 16px radius, a 1px hairline border and the blue-tinted shadow-card elevation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-ink-muted">
              Hover to preview the border-strong and shadow-elevated lift.
            </p>
          </CardContent>
          <CardFooter>
            <span className="text-xs tabular-nums text-ink-muted">10:30 AM — 01:00 PM</span>
            <Button size="sm" onClick={() => setModalOpen(true)}>
              Open Modal
            </Button>
          </CardFooter>
        </Card>

        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="EmptyState Primitive"
          description="Used when no data records or search results match the selected query."
          action={{
            label: "Trigger Success Toast",
            onClick: () => toast.success("Sample success notification", "Notification Sent"),
          }}
          secondaryAction={{
            label: "Trigger Confirmation",
            onClick: handleConfirmTest,
          }}
        />
      </div>

      {/* Modal Specimen */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Event Details Modal"
        description="Native HTML5 <dialog> with focus trap and Esc-to-close"
      >
        <div className="space-y-4 text-sm text-ink">
          <p className="text-xs text-ink-muted">
            Modals utilize <code className="font-mono text-accent">--radius-feature</code> (24px),
            <code className="font-mono text-accent">--shadow-modal</code>, and a translucent navy scrim backdrop.
          </p>
          <Input label="Event Room Name" defaultValue="Kamarajar Arangam Main Stage" />
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setModalOpen(false);
                toast.success("Venue room saved successfully");
              }}
            >
              Save Venue
            </Button>
          </DialogFooter>
        </div>
      </Modal>

      {/* Sheet Specimen */}
      <Sheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Registrations"
        description="Slide-over sheet panel for complex criteria"
      >
        <div className="space-y-4">
          <Input label="Search Keyword" placeholder="Name or college..." />
          <Select
            label="College Affiliation"
            options={[
              { value: "ALL", label: "All Affiliated Colleges" },
              { value: "SHC", label: "Sacred Heart College (Host)" },
              { value: "EXT", label: "External Institutions" },
            ]}
          />
          <Checkbox label="Only verified badges" defaultChecked />
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
              Reset
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                setSheetOpen(false);
                toast.info("Applied filters to table");
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
