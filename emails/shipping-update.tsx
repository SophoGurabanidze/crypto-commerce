import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Link,
} from "@react-email/components";

interface ShippingUpdateProps {
  orderNumber: string;
  trackingNumber: string;
  trackingUrl?: string;
}

export default function ShippingUpdate({
  orderNumber = "ORD-20260101-DEMO",
  trackingNumber = "1Z999AA10123456784",
  trackingUrl = "https://tracking.example.com",
}: ShippingUpdateProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Your Order Has Shipped!</Heading>
          <Text style={text}>
            Great news! Your order <strong>{orderNumber}</strong> is on its way.
          </Text>
          <Text style={text}>
            Tracking number: <strong>{trackingNumber}</strong>
          </Text>
          {trackingUrl && (
            <Link href={trackingUrl} style={link}>
              Track your package
            </Link>
          )}
          <Text style={footer}>
            CryptoShop - Modern E-Commerce with Crypto Payments
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", fontFamily: "sans-serif" };
const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "600px",
};
const h1 = { color: "#333", fontSize: "24px" };
const text = { color: "#666", fontSize: "14px", lineHeight: "24px" };
const link = { color: "#0070f3", fontSize: "14px" };
const footer = { color: "#999", fontSize: "12px", marginTop: "40px" };
