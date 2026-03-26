import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section, Row, Column, Hr, Img, Button,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = "Supet"
const BRAND_COLOR = "#E87B1C"
const BRAND_DARK = "#D16A0F"
const TEXT_COLOR = "#3D3228"
const MUTED_COLOR = "#7A6E63"
const BG_ACCENT = "#FFF7ED"

interface OrderItem {
  title?: string
  name?: string
  quantity?: number
  price?: number
}

interface OrderConfirmationProps {
  customerName?: string
  orderId?: string
  total?: string
  items?: OrderItem[]
  shippingAddress?: string
  orderDate?: string
}

const OrderConfirmationEmail = ({
  customerName,
  orderId,
  total,
  items,
  shippingAddress,
  orderDate,
}: OrderConfirmationProps) => {
  const displayName = customerName || 'Cliente'
  const displayId = orderId ? `#${orderId.slice(0, 8).toUpperCase()}` : '#—'
  const displayDate = orderDate || new Date().toLocaleDateString('pt-BR')

  return (
    <Html lang="pt-BR" dir="ltr">
      <Head />
      <Preview>Pedido {displayId} confirmado — Supet 🐾</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>🐾 Supet</Text>
          </Section>

          {/* Hero */}
          <Section style={heroSection}>
            <Text style={heroEmoji}>✅</Text>
            <Heading style={h1}>Pedido confirmado!</Heading>
            <Text style={heroSubtext}>
              Olá, <strong>{displayName}</strong>! Recebemos seu pedido e já estamos preparando tudo com carinho para o seu pet.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Order Summary Card */}
          <Section style={cardSection}>
            <Text style={cardTitle}>Resumo do Pedido</Text>
            <Row>
              <Column>
                <Text style={labelText}>Pedido</Text>
                <Text style={valueText}>{displayId}</Text>
              </Column>
              <Column>
                <Text style={labelText}>Data</Text>
                <Text style={valueText}>{displayDate}</Text>
              </Column>
            </Row>
          </Section>

          {/* Items */}
          {items && items.length > 0 && (
            <Section style={itemsSection}>
              <Text style={cardTitle}>Itens do Pedido</Text>
              {items.map((item, idx) => (
                <Row key={idx} style={itemRow}>
                  <Column style={{ width: '70%' }}>
                    <Text style={itemName}>{item.title || item.name || `Item ${idx + 1}`} × {item.quantity || 1}</Text>
                  </Column>
                  <Column style={{ width: '30%', textAlign: 'right' as const }}>
                    <Text style={itemPrice}>R$ {Number(item.price || 0).toFixed(2)}</Text>
                  </Column>
                </Row>
              ))}
              <Hr style={thinDivider} />
              <Row>
                <Column style={{ width: '70%' }}>
                  <Text style={totalLabel}>Total</Text>
                </Column>
                <Column style={{ width: '30%', textAlign: 'right' as const }}>
                  <Text style={totalValue}>R$ {total || '0,00'}</Text>
                </Column>
              </Row>
            </Section>
          )}

          {/* Shipping Address */}
          {shippingAddress && (
            <Section style={cardSection}>
              <Text style={cardTitle}>📍 Endereço de Entrega</Text>
              <Text style={addressText}>{shippingAddress}</Text>
            </Section>
          )}

          {/* CTA */}
          <Section style={ctaSection}>
            <Button style={ctaButton} href="https://supet.com.br/perfil">
              Acompanhar meu pedido
            </Button>
          </Section>

          {/* Footer */}
          <Hr style={divider} />
          <Section style={footerSection}>
            <Text style={footerText}>
              Dúvidas? Responda este e-mail ou entre em contato pelo nosso site.
            </Text>
            <Text style={footerBrand}>
              Supet — Cuidado natural para seu pet 🐾
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: OrderConfirmationEmail,
  subject: (data: Record<string, any>) =>
    `✅ Pedido ${data.orderId ? '#' + data.orderId.slice(0, 8).toUpperCase() : ''} confirmado — Supet`,
  displayName: 'Confirmação de pedido',
  previewData: {
    customerName: 'Maria Silva',
    orderId: 'abc12345-6789-0000-1111-222233334444',
    total: '189,90',
    orderDate: '26/03/2026',
    items: [
      { title: 'Supet Spray 200ml', quantity: 2, price: 89.95 },
      { title: 'Supet Shampoo 300ml', quantity: 1, price: 59.90 },
    ],
    shippingAddress: 'Rua das Flores, nº 123, Apto 4B, Jardim Paulista, São Paulo/SP, 01234-567',
  },
} satisfies TemplateEntry

// ─── Styles ────────────────────────────────────────────────
const main = { backgroundColor: '#ffffff', fontFamily: "'Plus Jakarta Sans', Arial, sans-serif" }
const container = { maxWidth: '600px', margin: '0 auto', padding: '0' }

const header = {
  backgroundColor: BRAND_COLOR,
  padding: '24px 32px',
  borderRadius: '16px 16px 0 0',
  textAlign: 'center' as const,
}
const logoText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '800' as const,
  margin: '0',
  letterSpacing: '1px',
}

const heroSection = { padding: '32px 32px 16px', textAlign: 'center' as const }
const heroEmoji = { fontSize: '48px', margin: '0 0 8px' }
const h1 = { fontSize: '26px', fontWeight: '800' as const, color: TEXT_COLOR, margin: '0 0 12px' }
const heroSubtext = { fontSize: '15px', color: MUTED_COLOR, lineHeight: '1.6', margin: '0' }

const divider = { borderColor: '#F0E8E0', margin: '0 32px' }
const thinDivider = { borderColor: '#F0E8E0', margin: '12px 0' }

const cardSection = {
  backgroundColor: BG_ACCENT,
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '16px 32px',
}
const cardTitle = {
  fontSize: '13px',
  fontWeight: '700' as const,
  color: BRAND_COLOR,
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 12px',
}
const labelText = { fontSize: '11px', color: MUTED_COLOR, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 2px' }
const valueText = { fontSize: '15px', fontWeight: '600' as const, color: TEXT_COLOR, margin: '0 0 8px' }

const itemsSection = {
  backgroundColor: BG_ACCENT,
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '8px 32px 16px',
}
const itemRow = { marginBottom: '8px' }
const itemName = { fontSize: '14px', color: TEXT_COLOR, margin: '0' }
const itemPrice = { fontSize: '14px', fontWeight: '600' as const, color: TEXT_COLOR, margin: '0' }
const totalLabel = { fontSize: '15px', fontWeight: '700' as const, color: TEXT_COLOR, margin: '0' }
const totalValue = { fontSize: '18px', fontWeight: '800' as const, color: BRAND_COLOR, margin: '0' }

const addressText = { fontSize: '14px', color: TEXT_COLOR, lineHeight: '1.5', margin: '0' }

const ctaSection = { textAlign: 'center' as const, padding: '8px 32px 24px' }
const ctaButton = {
  backgroundColor: BRAND_COLOR,
  color: '#ffffff',
  padding: '14px 32px',
  borderRadius: '12px',
  fontWeight: '700' as const,
  fontSize: '15px',
  textDecoration: 'none',
  display: 'inline-block',
}

const footerSection = { padding: '16px 32px 32px', textAlign: 'center' as const }
const footerText = { fontSize: '13px', color: MUTED_COLOR, margin: '0 0 8px', lineHeight: '1.5' }
const footerBrand = { fontSize: '12px', color: '#C4B5A5', margin: '0' }
