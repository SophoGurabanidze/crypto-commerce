"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { OrderTimeline } from "@/components/orders/order-timeline";
import { toast } from "sonner";

type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["processing", "refunded"],
  processing: ["shipped", "delivered", "refunded"],
  shipped: ["delivered", "refunded"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useQuery(api.orders.getById, {
    id: orderId as Id<"orders">,
  });
  const updateStatus = useMutation(api.orders.updateStatus);

  const [trackingNumber, setTrackingNumber] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");

  if (order === undefined) return <div>Loading...</div>;
  if (!order) return <div>Order not found.</div>;

  const nextStatuses = VALID_TRANSITIONS[order.status] ?? [];

  const handleStatusChange = async (newStatus: OrderStatus) => {
    try {
      await updateStatus({
        id: order._id,
        status: newStatus,
        trackingNumber: newStatus === "shipped" ? trackingNumber || undefined : undefined,
        trackingUrl: newStatus === "shipped" ? trackingUrl || undefined : undefined,
      });
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update"
      );
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Order {order.orderNumber}</h1>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Status Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <OrderTimeline status={order.status} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextStatuses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No further transitions available.
              </p>
            ) : (
              <>
                {nextStatuses.includes("shipped") && (
                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                    <Label>Tracking URL</Label>
                    <Input
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://tracking.example.com/..."
                    />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {nextStatuses.map((status) => (
                    <Button
                      key={status}
                      variant={
                        status === "cancelled" || status === "refunded"
                          ? "destructive"
                          : "default"
                      }
                      size="sm"
                      onClick={() => handleStatusChange(status)}
                    >
                      Mark as {status}
                    </Button>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span>
                {item.productName} x{item.quantity} ({item.productType})
              </span>
              <span>${((item.price * item.quantity) / 100).toFixed(2)}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>${(order.total / 100).toFixed(2)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method</span>
            <span>{order.paymentMethod}</span>
          </div>
          {order.paymentDetails.stripeSessionId && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Stripe Session</span>
              <span className="font-mono text-xs truncate max-w-[200px]">
                {order.paymentDetails.stripeSessionId}
              </span>
            </div>
          )}
          {order.paymentDetails.transactionHash && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tx Hash</span>
              <span className="font-mono text-xs truncate max-w-[200px]">
                {order.paymentDetails.transactionHash}
              </span>
            </div>
          )}
          {order.paymentDetails.tokenSymbol && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Token</span>
              <span>{order.paymentDetails.tokenSymbol}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
