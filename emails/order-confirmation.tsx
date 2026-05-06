import {
  Html,
  Head,
  Body,
  Container,
  Heading,
  Text,
  Section,
  Row,
  Column,
  Hr,
} from "@react-email/components";

interface OrderConfirmationProps {
  orderNumber: string;
  items: Array<{ name: string; quantity: number; price: number }>;
  total: number;
  paymentMethod: string;
}

export default function OrderConfirmation({
  orderNumber = "ORD-20260101-DEMO",
  items = [{ name: "Sample Product", quantity: 1, price: 1999 }],
  total = 1999,
  paymentMethod = "stripe",
}: OrderConfirmationProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Order Confirmed!</Heading>
          <Text style={text}>
            Thank you for your purchase. Your order <strong>{orderNumber}</strong>{" "}
            has been confirmed.
          </Text>

          <Section>
            {items.map((item, i) => (
              <Row key={i} style={row}>
                <Column>
                  {item.name} x{item.quantity}
                </Column>
                <Column style={priceCol}>
                  ${((item.price * item.quantity) / 100).toFixed(2)}
                </Column>
              </Row>
            ))}
          </Section>

          <Hr style={hr} />

          <Row style={row}>
            <Column>
              <strong>Total</strong>
            </Column>
            <Column style={priceCol}>
              <strong>${(total / 100).toFixed(2)}</strong>
            </Column>
          </Row>

          <Text style={text}>
            Payment method: {paymentMethod.replace("_", " ")}
          </Text>

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
const row = { marginBottom: "8px" };
const priceCol = { textAlign: "right" as const };
const hr = { borderColor: "#eee", margin: "20px 0" };
const footer = { color: "#999", fontSize: "12px", marginTop: "40px" };
