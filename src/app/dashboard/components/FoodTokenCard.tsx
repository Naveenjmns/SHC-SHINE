import React, { useState } from "react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Badge, Button, Modal } from "@/components/ui";
import { Utensils, QrCode, CheckCircle2, Clock, MapPin } from "lucide-react";

export interface FoodPass {
  foodTokenCode: string;
  foodPreference?: "VEG" | "NON_VEG";
  foodTokenClaimed: boolean;
  foodQrData?: string | null;
}

interface FoodTokenCardProps {
  foodPass: FoodPass | null;
  diningVenue?: string | null;
}

export default function FoodTokenCard({ foodPass, diningVenue }: FoodTokenCardProps) {
  const [qrModalOpen, setQrModalOpen] = useState(false);

  if (!foodPass) return null;

  return (
    <>
      <Card className="bg-surface border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <Badge
              variant={foodPass.foodTokenClaimed ? "closed" : "confirmed"}
              size="sm"
            >
              {foodPass.foodTokenClaimed ? "Meal Claimed" : "Token Active"}
            </Badge>

            <Badge
              variant={foodPass.foodPreference === "VEG" ? "confirmed" : "pending"}
              size="sm"
            >
              {foodPass.foodPreference === "VEG" ? "Pure Veg" : "Non-Veg"}
            </Badge>
          </div>
          <CardTitle className="text-base">Lunch Coupon & Token</CardTitle>
          <CardDescription className="text-xs truncate">
            {diningVenue || "SGB Quadrangle Dining Hall"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-1">
          <div className="p-3 rounded-[8px] bg-surface-raised border border-border flex items-center justify-between">
            <div>
              <div className="text-[11px] text-ink-muted">Token Code:</div>
              <div className="font-mono text-xs font-bold text-accent">
                {foodPass.foodTokenCode}
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setQrModalOpen(true)}
              leftIcon={<QrCode className="w-3.5 h-3.5" />}
            >
              Show QR
            </Button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-ink-subtle">
            <Clock className="w-3 h-3 text-accent shrink-0" />
            <span>Serving Window: 01:00 PM — 02:30 PM</span>
          </div>
        </CardContent>
      </Card>

      {/* Enlarged QR Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        title="Symposium Lunch Coupon"
        description="Scan this code at the dining hall distribution counter"
        maxWidth="sm"
      >
        <div className="p-4 flex flex-col items-center justify-center text-center space-y-4">
          {foodPass.foodQrData ? (
            <div className="w-48 h-48 bg-surface p-3 rounded-[8px] border border-border flex items-center justify-center">
              <Image
                src={foodPass.foodQrData}
                alt={`Food Token ${foodPass.foodTokenCode}`}
                width={180}
                height={180}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-48 h-48 rounded-[8px] bg-surface-raised border border-dashed border-border flex items-center justify-center text-ink-subtle">
              <QrCode className="w-16 h-16" />
            </div>
          )}

          <div className="space-y-1">
            <div className="font-mono text-sm font-bold text-ink">
              {foodPass.foodTokenCode}
            </div>
            <Badge
              variant={foodPass.foodPreference === "VEG" ? "confirmed" : "pending"}
              size="sm"
            >
              {foodPass.foodPreference === "VEG" ? "Pure Vegetarian" : "Non-Vegetarian"}
            </Badge>
          </div>

          <Button variant="secondary" size="sm" onClick={() => setQrModalOpen(false)}>
            Dismiss
          </Button>
        </div>
      </Modal>
    </>
  );
}

